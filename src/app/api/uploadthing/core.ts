import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { getPineconeClient } from "../../../lib/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";
///// maybe i will add redis and bull for quick response ////


const f = createUploadthing();

export const ourFileRouter: FileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user || !user.id) throw new Error("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
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

            // Upsert the embedding into Pinecone with the specified name space
            const upsertResponse = await pineconeIndex.namespace(createdFile.id).upsert([
              {
                id: pageId,
                values: pageEmbedding,
              },
            ]);

           
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
    }),
};

export type OurFileRouter = typeof ourFileRouter;
