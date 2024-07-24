import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { getUserSubscriptionPlan } from "@/lib/monime";
import { PLANS } from "@/config/stripe";
import { getEndpointByFileType, getFileType, updateStatusInDb } from "@/lib/elegance";

export const maxDuration = 300;

const f = createUploadthing();

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) throw new Error("Unauthorized");

  const subscriptionPlan = await getUserSubscriptionPlan();
  return { subscriptionPlan, userId: user.id };
};

const onUploadComplete = async ({ metadata, file }: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: { key: string; name: string; url: string };
}) => {
  const isFileExists = await db.file.findFirst({ where: { key: file.key } });
  if (isFileExists) return;

  const { extension, name: fileType } = getFileType(file.name);

  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      uploadStatus: "PROCESSING",
    },
  });

  const endpoint = getEndpointByFileType(fileType);
  try {
      const responseCF = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdFile,
          mimeType: extension,
          fileContent: {
            url :createdFile.url
          }
        })
      });

      if (responseCF.ok) {
        await updateStatusInDb({ uploadStatus: "SUCCESS", createdFile });
      } else {
        throw new Error("Failed to process file");
      }

      const data = await responseCF.json();
      console.log("Data from cloud functions:", data);
      new Response(JSON.stringify({data}))
  
  } catch (error:any) {
    await updateStatusInDb({ uploadStatus: "FAILED", createdFile });
    console.error("Error:", error.message);
     new Response(JSON.stringify({message: error.message}))
  }
};

export const ourFileRouter: FileRouter = {
  freePlanUploader: f({
    pdf: { maxFileSize: "1GB" },
    image: { maxFileSize: "1GB" },
    video: { maxFileSize: "1GB" },
    audio: { maxFileSize: "1GB" }
  })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),

  proPlanUploader: f({ 
    pdf: { maxFileSize: "1GB" }, 
    image: { maxFileSize: "1GB" },
    video: { maxFileSize: "32MB" },
    audio: { maxFileSize: "16GB" }
  })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
};

export type OurFileRouter = typeof ourFileRouter;
