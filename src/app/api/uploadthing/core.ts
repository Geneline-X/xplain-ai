import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from '@pinecone-database/pinecone';
import { getUserSubscriptionPlan } from "@/lib/stripe"
import {PLANS} from "@/config/stripe"
///// maybe i will add redis and bull for quick response ////


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
    
    if((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)){
      await db.file.update({
        data: {
          uploadStatus: "FAILED"
        },
        where: {
          id: createdFile.id,
        }
      })
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
       environment: 'gcp-starter',
    })

    
    const pineconeIndex = pinecone.Index("cph");

    // Vectorize and index the entire documents using gemini /////
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    
    // Vectorize each page and store the embeddings in an array
    const embeddingsArray = await Promise.all(
      pageLevelDocs.map(async (page, i) => {
        const pageText = page.pageContent;

        // Embed the individual page using model.embedContent
        const result = await model.embedContent(pageText);
        const pageEmbedding = result.embedding.values;

        const pageId = `${createdFile.id}-page-${i}`;

        
        const upsertResponse = await pineconeIndex.namespace(createdFile.id).upsert(
          [
          {
            id: pageId,
            values: pageEmbedding,
          }]
        );

       
      })
    );

    await db.file.update({
      data: {
        uploadStatus: 'SUCCESS'
      },
      where: {
        id: createdFile.id,
      }
    })
    console.log("PDF Vectorization and Pinecone Indexing complete!");

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
