import { db } from "@/db";
import { SendMessageValidators } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";
import { StreamingTextResponse } from "ai"
import { ReadableStream } from "web-streams-polyfill/ponyfill";
import { llm } from "@/lib/gemini";
import { cleanedHtmlText, cosineSimilaritySearch, getFileType } from "@/lib/elegance";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
export const maxDuration = 300

let globalContext:string | string[] | undefined

// Improve the Response by referencing/ highlighting the particular page
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

    // no need for the cosine similarity search because the model, can handle 2million tokens
    const {joinedEmbeddings, contexts} = await cosineSimilaritySearch({file, message})
    globalContext = contexts
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
              });
            }

          if(!isUrlFile){
            const response = await fetch(
              `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
            );
            const blob = await response.blob();
            const {name} = getFileType(file.name)
            if(name === 'pdf'){
              const loader = new PDFLoader(blob);
              const pageLevelDocs = await loader.load();
      
              const pageTexts = pageLevelDocs.map(page => page.pageContent);
              globalContext = pageTexts
            }
          }
          
          
         //@ts-ignore
       const newContext = isUrlFile ? file.htmlContent : globalContext
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