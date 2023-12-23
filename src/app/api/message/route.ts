import { db } from "@/db";
import { SendMessageValidators } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { getPineconeClient } from "../../../lib/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { loadQAStuffChain} from "langchain/chains"
import {StreamingTextResponse, GoogleGenerativeAIStream } from "ai"

export const POST = async(req: NextRequest) => {
    //// this is the endpoint
  try {
    const body = await req.json()
    const { getUser } = getKindeServerSession()
    const user = await  getUser()

    const userId = user?.id

    if(!userId) return new Response("Unauthorized", {status: 401})

    const { fileId ,message } = SendMessageValidators.parse(body)

    console.log(message)
    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId
        }
    })

    if(!file) return new Response("NotFound", {status: 404})

   const createMessage =  await db.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId
        }
    })

    /// nlp part of the app //////

    ///// vectorize the incoming message ////
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
        environment: 'gcp-starter',
    })
    const pineconeIndex = pinecone.Index("cph");

    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    const result = await model.embedContent(message);
    const messageEmbedding = result.embedding.values;

     const similarEmbeddings = await pineconeIndex.namespace(file.id).query({topK: 4,vector: messageEmbedding, includeValues:true})

     console.log(`Found ${similarEmbeddings.matches?.length} matched...`)

     
    const llm = genAI.getGenerativeModel({model: "gemini-pro"})


    const prevMessages = await db.message.findMany({
        where: {
            fileId
        },
        orderBy:{
            createAt: "asc"
        },
        take: 6
    })

    const formattedPrevMessages = prevMessages.map((msg) => {
        return {
          role: msg.isUserMessage ? "user" : "model",
          parts: msg.text as string,
        };
      });
     
  
      // Assuming you have a prompt message from the user
      const userPrompt = "Hello, I have 2 dogs in my house.";
  
      
      // Start the chat with the user's prompt
      let chat = llm.startChat({
        history: [
            {
                role: 'user',
                parts: 'who is kamanda'
            },
            {
                role: "model",
                parts: "Kamanda is the person that they are writing to this letter"
            },
         ],
            generationConfig: {
                maxOutputTokens: 100,
            },
        });

        const responseBlob = await fetch(
            `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
          );
          const blob = await responseBlob.blob();
  
          const loader = new PDFLoader(blob);
          const pageLevelDocs = await loader.load();

          // Extract page numbers from similarity embeddings and increment by 1
            const pageNumbers = similarEmbeddings.matches.map((match) => {
                const pageNumberMatch = match.id.match(/page-(\d+)$/);
                return pageNumberMatch ? parseInt(pageNumberMatch[1]) + 1 : null;
            });
            // Search for corresponding pages in the PDFLoader
            const pageContents = pageNumbers.map((pageNumber) => {
                if (pageNumber !== null && pageNumber >= 0 && pageNumber < pageLevelDocs.length) {
                return pageLevelDocs[pageNumber].pageContent // Assuming getText() method to get text content from the page
                }
                return null;
            });

        const context = pageContents.filter((content) => content !== null).join('\n\n');


       const msg = `${message} ${similarEmbeddings.matches.join("")} ${context}`;
    //   const msg = `how to add`;
      const resultFromChat = await chat.sendMessageStream(msg);
      const response = await resultFromChat.response;
      const text =  response.text();
      console.log('This is the text generated from the model', text)
      
     const streamMessage =  await db.message.create({
        data: {
            text,
            isUserMessage: false,
            fileId,
            userId
        }
      })

      return new Response(JSON.stringify(streamMessage), {status: 200})
     
  } catch (error) {
    console.log(error)
  }
}