
import { GoogleGenerativeAI, } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

export const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY!
);

export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: 'apw5-4e34-81fa',
    projectId: 'xon8qzk'
})

export const pineconeIndex = pinecone.Index("cph-serverless");
export const llm = genAI.getGenerativeModel({model:"gemini-1.0-pro"})
export const model = genAI.getGenerativeModel({ model: "embedding-001" });


