import { db } from "@/db";
import { SendMessageValidators } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import {StreamingTextResponse, GoogleGenerativeAIStream } from "ai"
import { ReadableStream, WritableStream } from "web-streams-polyfill/ponyfill";
import { getCachedOrFetchBlob } from "@/lib/utils";

export const maxDuration = 300
type MessageType = {
    id: string;
    text: string;
    isUserMessage: boolean;
    createAt: Date;
    updatedAt: Date;
    userId: string | null;
    fileId: string | null;
}
export const POST = async(req: NextRequest) => {
    //// this is the endpoint
    let createMessage: MessageType | undefined = undefined;

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

    const blob = await getCachedOrFetchBlob(
      `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
    );
    
    /// nlp part of the app //////

    ///// vectorize the incoming message ////
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
        environment: 'apw5-4e34-81fa',
        projectId: 'xon8qzk'
    })
    const pineconeIndex = pinecone.Index("cph-serverless");

    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    const result = await model.embedContent(message);
    const messageEmbedding = result.embedding.values;

    const similarEmbeddings = await pineconeIndex.namespace(file.id).query({topK: 8,vector: messageEmbedding, includeValues:true})

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

  
   const formattedPrevMessages = prevMessages.map((msg:MessageType) => {
        return {
          role: msg.isUserMessage ? "user" : "model",
          parts: msg.text,
        };
      });

       // Start the chat with the user's prompt
       let chat
       if(formattedPrevMessages.length === 0){
        chat = llm.startChat({
              generationConfig: {
                  maxOutputTokens: 2048,
              },
          });
       }else{
        chat = llm.startChat({
          history: formattedPrevMessages,
              generationConfig: {
                  maxOutputTokens: 2048,
              },
          });
       }
       
        const loader = new PDFLoader(blob);
        const pageLevelDocs = await loader.load();

        const allPageContents = pageLevelDocs.flatMap((page) => page.pageContent); // Assuming getText() method to get text content from the page
        const context = allPageContents.join('\n\n');

        const msg = `${message} ${similarEmbeddings.matches.join("")} ${context}`;
   
       //   const msg = `how to add`;
       const resultFromChat = await chat.sendMessageStream(msg);
      
       
      let text = ''
          // Perform your database operations here
        createMessage = await db.message.create({
          data: {
            text: message,
              isUserMessage: true,
              userId,
              fileId,
          }
        })

      const responseStream = new ReadableStream({
        async start(controller:any) {
          try {
            
            for await (const chunk of resultFromChat.stream) {
              controller.enqueue(chunk.text());
               text += chunk.text() 
            }
            
            const streamMessage = await db.message.create({
              data: {
                  text,
                  isUserMessage: false,
                  fileId,
                  userId,
              }
            })
            // console.log("this is the text generated ", text)
            controller.close();
          } catch (error) {
            console.error("Error enqueuing chunks:", error);
            await db.message.delete({
              where: {
                id: createMessage?.id
              }
            })
            controller.error(error);
          }
        },
      })    
      return  new StreamingTextResponse(responseStream);
            // Return the streaming response immediately     
          
  } catch (error) {
    console.log(error)
     // Check if createMessage is defined before accessing its properties
     if (createMessage) {
      try {
        await db.message.delete({
            where: {
                id: createMessage?.id
            }
          });
      } catch (error) {
        console.error("Error deleting message:", error);
      }
  }
    return new Response(JSON.stringify({message: error}), {status: 500})
  }
}