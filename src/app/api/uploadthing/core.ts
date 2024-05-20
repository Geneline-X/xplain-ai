import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { getUserSubscriptionPlan } from "@/lib/monime"
import {PLANS} from "@/config/stripe"
import { processBatch, updateStatusInDb } from "@/lib/elegance";
export const maxDuration = 300;

const f = createUploadthing();

const middleware = async() => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) throw new Error("Unauthorized");

  const subscriptionPlan = await getUserSubscriptionPlan()
  return { subscriptionPlan , userId: user.id };

}

//  run this code after upload completed to upload thing
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
    
    const { isSubscribed } = subscriptionPlan
    const isProExceeded = pageAmnt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf
    
    const isFreeExceeded = pageAmnt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf
   
    if((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)){
      await updateStatusInDb({uploadStatus:"FAILED", createdFile})
    } else{

      // Process pages in batches
      const batchSize = 50; 

      const totalPages = pageLevelDocs.length;
      for (let startIndex = 0; startIndex < totalPages; startIndex += batchSize) {
        
          // creating the batch //
          const batch = pageLevelDocs.slice(startIndex, startIndex + batchSize);

          // process the pages by batches ///
          await processBatch({batch, startIndex, createdFile});
      }
      
      // update the file status to success
      await updateStatusInDb({uploadStatus:"SUCCESS", createdFile})
      
      console.log("PDF Vectorization and Pinecone Indexing complete!");
  
    }
  } catch (error) {
    // Handle errors
    await updateStatusInDb({uploadStatus:"FAILED", createdFile})
    
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
