
import { GoogleGenerativeAI, } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

// model 1
export const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_GEMINI_MODEL_BILLING!
);


export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: 'apw5-4e34-81fa', // aped-4627-b74a
    projectId: 'xon8qzk' //
})

export const pineconeIndex = pinecone.Index("cph-serverless");
export const llm = genAI.getGenerativeModel({model:"gemini-1.5-flash"})
export const model = genAI.getGenerativeModel({ model: "embedding-001" });


