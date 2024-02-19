import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from '@pinecone-database/pinecone';
import { getUserSubscriptionPlan } from "@/lib/monime"
import {PLANS} from "@/config/stripe"

export const maxDuration = 300;

const f = createUploadthing();

const middleware = async() => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) throw new Error("Unauthorized");

  const subscriptionPlan = await getUserSubscriptionPlan()
  return { subscriptionPlan , userId: user.id };

}

const onUploadComplete = async({metadata, file}: {
  metadata: Awaited<ReturnType<typeof middleware>>
  file: {
    key:string,
    name:string,
    url: string
  }
}) => {

  const isFileExists = await db.file.findFirst({
    where: {
      key: file.key
    }
  })
  if(isFileExists){
    return
  }
  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      uploadStatus: "PROCESSING",
    },
  });

  try {
    const response = await fetch(
      `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
    );
    const blob = await response.blob();

    const loader = new PDFLoader(blob);
    const pageLevelDocs = await loader.load();
    const pageAmnt = pageLevelDocs.length;
    
    const {subscriptionPlan} = metadata
    
    const { isSubscribed} = subscriptionPlan
    const isProExceeded = pageAmnt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf
    
    const isFreeExceeded = pageAmnt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf
    // (isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)
    if((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)){
      await db.file.update({
        data: {
          uploadStatus: "FAILED"
        },
        where: {
          id: createdFile.id,
        }
      })
    } else{
      const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
         environment: 'apw5-4e34-81fa',
         projectId: 'xon8qzk'
      })
      const pineconeIndex = pinecone.Index("cph-serverless");
      
      // Vectorize and index the entire documents using gemini /////
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "embedding-001" });
      
      // Vectorize each page and store the embeddings in an array
    
      // Process pages in batches
      const batchSize = 50; 

      // Function to process a batch of pages concurrently
      const processBatch = async (batch:any, startIndex:number):Promise<any> => {
          try {
              const upsertPromises = batch.map(async (page:any, index:number) => {
                const pageIndex = startIndex + index;
                const pageText = page.pageContent;

                // Embed the individual page using model.embedContent
                const result = await model.embedContent(pageText);
                const pageEmbedding = result.embedding.values;

                const pageId = `${createdFile.id}-page-${pageIndex}`;

                // Store the embedding for the page
                return pineconeIndex.namespace(createdFile.id).upsert([
                    {
                        id: pageId,
                        values: pageEmbedding,
                    }
                ]);
            });

            // Wait for all upsert operations in the batch to complete
            return Promise.all(upsertPromises);
          } catch (error:any) {
            // Handle the error gracefully
              console.error('Error occurred during batch processing:', error.message);
              // You can choose to log the error, retry the operation, or take other appropriate actions

              // Retry the operation for the failed batch
              return processBatch(batch, startIndex);
          }
      };
      const totalPages = pageLevelDocs.length;
      for (let i = 0; i < totalPages; i += batchSize) {
          const batch = pageLevelDocs.slice(i, i + batchSize);
          await processBatch(batch, i);
      }
      
      await db.file.update({
        data: {
          uploadStatus: 'SUCCESS'
        },
        where: {
          id: createdFile.id,
        }
      })
      console.log("PDF Vectorization and Pinecone Indexing complete!");
  
    }
  } catch (error) {
    // Handle errors
    await db.file.update({
      data: {
        uploadStatus: 'FAILED'
      },
      where: {
        id: createdFile.id,
      }
    })
    console.error("Error:", error);
  }
}
export const ourFileRouter: FileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: "1GB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
};

export type OurFileRouter = typeof ourFileRouter;
