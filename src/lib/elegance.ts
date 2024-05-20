import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/dist/types";
import { model, pineconeIndex } from "./gemini";
import { db } from "@/db";
import { Liveblocks } from "@liveblocks/node";
import Moralis from 'moralis';

// add hours to date //
export const addHoursToDate = (date: Date, hours:number) => {
  const newDate = new Date(date);
  newDate.setHours(date.getHours() + hours);
  return newDate;
};

//// get token price function ////
export const getTokenPrice = async(address: string) => {
    try {
        await Moralis.start({
            apiKey: `${process.env.MORALIS_API_KEY}`
        });
        const response = await Moralis.SolApi.token.getTokenPrice({
            "network": "mainnet",
            "address": address
          });
          console.log("this is the response: ", response)
          const { usdPrice } = response.result
          if(usdPrice){
            return  usdPrice
          }
          
          return "Token found!"
        
    } catch (error) {
        console.log(error)
    }
}
/// app logo ////
export const appLogo = 'https://i.postimg.cc/gcxV8R6L/app-logo.jpg'

export const liveblocks = new Liveblocks({
    secret: `${process.env.LIVEBLOCK_SECRET_API}`,
});

type SessionProps = { 
    user: KindeUser;
    randomHex: string
}
/// function that create a session for the user /////
export const createLiveBlockSession = ({user, randomHex}: SessionProps) => {
    const session = liveblocks.prepareSession(user?.id, {
    userInfo: {
        name: `${user?.family_name} ${user?.family_name}`,
        picture: user?.picture,
        color: randomHex
    },
  });
  return session
}

// function that get similar embeddings of the message //
export const getSimilarEmbeddings = async({file, message}: any) => {
    const result = await model.embedContent(message);
    const messageEmbedding = result.embedding.values;

    return await pineconeIndex.namespace(file.id).query({topK: 8,vector: messageEmbedding, includeValues:true}) 
}

//// function inside that return the readable stream ///
type GeneratorType = {
    controller: ReadableStreamDefaultController;
    text: string
    fileId:string,
    userId:string
}
// export async function startGenerator({controller, text, fileId, userId}: GeneratorType) {
//     try {
//           for await(const chunk of resultFromChat.stream) {
//             controller.enqueue(chunk.text());
//             text += chunk.text() 
//           }
//           // If previous database call exists, update the existing message
//           const streamMessage = await db.message.create({
//             data: {
//               text,
//               isUserMessage: false,
//               fileId,
//               userId,
//             },
//           });
        
//           controller.close();
//       } catch (error) {
//       // Handle errors
//       console.error("Error enqueuing chunks:", error);
//       await db.message.delete({ where: { id: createMessage?.id } });
//       controller.error(error);
//     }
//}

// Function to process a batch of pages concurrently
// the types
type ProcessBatchTypes = {
    batch: any,
    startIndex: number,
    createdFile:any
}

/// process documents by batches ////
export const processBatch = async ({batch, startIndex, createdFile}: ProcessBatchTypes):Promise<any> => {
    try {
        const upsertPromises = batch.map(async (page:any, index:number) => {
          const pageIndex = startIndex + index;
          const pageText = page.pageContent;

          // Embed the individual page using model.embedContent
          const result = await model.embedContent(pageText);
          const pageEmbedding = result.embedding.values;

          const pageId = `${createdFile.id}-page-${pageIndex}`;

          // Store the embedding for the page
          return pineconeIndex.namespace(createdFile.id).upsert([
              {
                  id: pageId,
                  values: pageEmbedding,
              }
          ]);
      });

      // Wait for all upsert operations in the batch to complete
      return Promise.all(upsertPromises);
    } catch (error:any) {
      // Handle the error gracefully
        console.error('Error occurred during batch processing:', error.message);
        // You can choose to log the error, retry the operation, or take other appropriate actions

        // Retry the operation for the failed batch
        return processBatch({batch, startIndex, createdFile});
    }
};


// update the status of the upload //
type UploadTypes = {
    createdFile:any
    uploadStatus: "SUCCESS" | "FAILED"
}
export const updateStatusInDb = async({uploadStatus, createdFile}: UploadTypes) => {
   try {
        await db.file.update({
            data: {
            uploadStatus: uploadStatus
            },
            where: {
            id: createdFile.id,
            }
        })
   } catch (error) {
      console.log(error)
   }
}