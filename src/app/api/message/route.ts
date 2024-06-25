import { db } from "@/db";
import { SendMessageValidators } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";
import { StreamingTextResponse } from "ai"
import { ReadableStream } from "web-streams-polyfill/ponyfill";
import { llm } from "@/lib/gemini";
import { cleanedHtmlText, cosineSimilaritySearch } from "@/lib/elegance";

export const maxDuration = 300


export const POST = async(req: NextRequest) => {

  try {

    const body = await req.json()
    const { getUser } = getKindeServerSession()
    const user = await  getUser()

    const userId = user?.id

    if(!userId) return new Response("Unauthorized", {status: 401})

    const { fileId ,message, isUrlFile } = SendMessageValidators.parse(body)
     let file
    if(!isUrlFile){
         file = await db.file.findFirst({
            where: {
                id: fileId,
                userId
            }
         })
    }else{
      file = await db.urlFile.findFirst({
        where: {
            id: fileId,
            userId
        }
     })
    }
    
    if(!file) return new Response("NotFound", {status: 404})
     
    /// nlp part of the app //////
    
    // get similar embeddings from pinecode database
    const {joinedEmbeddings, contexts} = await cosineSimilaritySearch({file, message})
    
    const prevMessages = await db.message.findMany({
        where: {
            fileId
        },
        orderBy:{
            createAt: "asc"
        },
        take: 6
    })

     const formattedPrevMessages = prevMessages.map((msg:any) => {
        return {
          role: msg.isUserMessage ? "user" : "model",
          parts: msg.text,
        };
      });
    
       // Start the chat with the user's prompt //
      let createMessage = await db.message.create({
        data: {
          text: message,
            isUserMessage: true,
            userId,
            fileId,
        }
      })
        let chat: any;
        ///// start the model chatting ////
         if(formattedPrevMessages.length === 0 || formattedPrevMessages[formattedPrevMessages.length - 1].role === "user"){
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
          
         //@ts-ignore
       const newContext = isUrlFile ? file.htmlContent : contexts
       const msg = `${message} ${newContext}`;
        const resultFromChat = await chat.sendMessageStream(msg);
        let text = ''
        const responseStream = new ReadableStream({
          async start(controller) {
            try {
                  for await(const chunk of resultFromChat.stream) {
                    controller.enqueue(chunk.text());
                    text += chunk.text() 
                  }
                  // If previous database call exists, update the existing message
                  const streamMessage = await db.message.create({
                    data: {
                      text,
                      isUserMessage: false,
                      fileId,
                      userId,
                    },
                  });
                
                  controller.close();
              } catch (error) {
              // Handle errors
              console.error("Error enqueuing chunks:", error);
              await db.message.delete({ where: { id: createMessage?.id } });
              controller.error(error);
            }
          }
        })

      return  new StreamingTextResponse(responseStream);
      // Return the streaming response immediately     
          
  } catch (error) {
    console.log(error)
    
    return new Response(JSON.stringify({message: error}), {status: 500})
  }
}