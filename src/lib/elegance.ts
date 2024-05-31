import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/dist/types";
import { model, pineconeIndex } from "./gemini";
import { db } from "@/db";
import { Liveblocks } from "@liveblocks/node";
import Moralis from 'moralis';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { vectordb } from "./firebaseConfig";
import { collection, getDocs, addDoc, writeBatch, doc, getDoc,  query} from "firebase/firestore";


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

// export const liveblocks = new Liveblocks({
//     secret: `${process.env.LIVEBLOCK_SECRET_API}`,
// });


type SessionProps = { 
    user: KindeUser;
    randomHex: string
}
/// function that create a session for the user /////
// export const createLiveBlockSession = ({user, randomHex}: SessionProps) => {
//     const session = liveblocks.prepareSession(user?.id, {
//     userInfo: {
//         name: `${user?.family_name} ${user?.family_name}`,
//         picture: user?.picture,
//         color: randomHex
//     },
//   });
//   return session
// }

// function that get similar embeddings of the message from pinecone db //
// export const getSimilarEmbeddings = async({file, message}: any) => {
//     const result = await model.embedContent(message);
//     const messageEmbedding = result.embedding.values;

//     return await pineconeIndex.namespace(file.id).query({topK: 8,vector: messageEmbedding, includeValues:true}) 
// }



export const getSimilarEmbeddings = async ({ file, message }: any): Promise<any[]> => {
  try {
  
    const collectionRef = collection(vectordb, file.id)
    const messageEmbedding = (await model.embedContent(message)).embedding.values;
    
    const querySnapshot = (await getDocs(collection(vectordb, file.id)))
    
    const similarEmbeddings = querySnapshot.docs.map((doc) => doc.data().embedding);

    console.log("These are the similar embedding values:", similarEmbeddings);

    return similarEmbeddings; 
  } catch (error: any) {
    console.error('Error occurred during similarity search:', error.message);
    return []; // Return empty array on error
  }
};

// In-memory cache to store embeddings
const embeddingsCache: { [fileId: string]: { id: string, embedding: number[], pageText?: string }[] } = {};

// Timeouts for cache invalidation
const cacheTimeouts: { [fileId: string]: NodeJS.Timeout } = {};

// Function to retrieve embeddings from Firestore with caching and cache expiration
const getEmbeddingsFromFirestore = async (fileId: string) => {
  // Check if embeddings for the fileId are already in the cache
  if (embeddingsCache[fileId]) {
    console.log('Returning cached embeddings for fileId:', fileId);

    // Clear the existing timeout and set a new one to extend the cache expiration
    clearTimeout(cacheTimeouts[fileId]);
    cacheTimeouts[fileId] = setTimeout(() => {
      delete embeddingsCache[fileId];
      delete cacheTimeouts[fileId];
      console.log('Cache for fileId expired and removed:', fileId);
    }, 10 * 60 * 1000); // 10 minutes

    return embeddingsCache[fileId];
  }

  // If not in cache, retrieve from Firestore
  const q = query(collection(vectordb, fileId));
  const querySnapshot = await getDocs(q);
  const embeddings: { id: string, embedding: number[], pageText?:string }[] = [];
  querySnapshot.forEach((doc) => {
    embeddings.push({ id: doc.id, embedding: doc.data().embedding, pageText: doc.data().pageText });
  });

  // Store retrieved embeddings in the cache
  embeddingsCache[fileId] = embeddings;

  // Set a timeout to remove the cache after 10 minutes
  cacheTimeouts[fileId] = setTimeout(() => {
    delete embeddingsCache[fileId];
    delete cacheTimeouts[fileId];
    console.log('Cache for fileId expired and removed:', fileId);
  }, 10 * 60 * 1000); // 10 minutes


  return embeddings;
};

// Function to compute cosine similarity
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};


// Function to find the top N similar embeddings
const findTopNSimilarEmbeddings = (queryEmbedding: number[], embeddings: { id: string, embedding: number[], pageText?: string }[], topN: number) => {
  const similarities = embeddings.map((embedding) => ({
    id: embedding.id,
    embedding: embedding.embedding,
    pageText: embedding.pageText,
    similarity: cosineSimilarity(queryEmbedding, embedding.embedding),
  }));
  
  //console.log("this is the top similarity: ", similarities)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  return similarities.slice(0, topN);
};

// Function to perform cosine similarity search
export const cosineSimilaritySearch = async ({message, file, topN = 8}:any) => {
  try {
    const messageEmbedding = (await model.embedContent(message)).embedding.values;
    
    // Retrieve all embeddings from Firestore for the specified fileId
    const embeddings = await getEmbeddingsFromFirestore(file.id);

    // Find the top N similar embeddings
    const topSimilarEmbeddings = findTopNSimilarEmbeddings(messageEmbedding, embeddings, topN);

    // Extract and join the individual numbers of the embeddings into a single string
    const joinedEmbeddings = topSimilarEmbeddings.map(e => e.embedding.slice(0,topN)).flat().join(' ');
    const contexts = topSimilarEmbeddings.map(e => e.pageText).join('\n\n');
    
    return contexts ? { joinedEmbeddings, contexts } : {joinedEmbeddings};

  } catch (error) {
    console.error('Error during cosine similarity search:', error);
    throw error;
  }
};

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
        const batchWrite = writeBatch(vectordb);
        const upsertPromises = batch.map(async (page:any, index:number) => {
          const pageIndex = startIndex + index;
          const pageText = page.pageContent;

          // Embed the individual page using model.embedContent
          const result = await model.embedContent(pageText);
          const pageEmbedding = result.embedding.values;

          const pageId = `${createdFile.id}-page-${pageIndex}`;
          
          // Store the embedding for the page 
          // Create the data object for the page embedding
            const pageData = {
              pageText,
              embedding: pageEmbedding,
            };
            
            // Add the page data to the Firestore batch
            //const docRef = await addDoc(collection(vectordb, createdFile.id), pageData);

            const docRef = doc(collection(vectordb, createdFile.id), pageId);
            batchWrite.set(docRef, pageData);   
      });

      //return Promise.all(upsertPromises);
      await Promise.all(upsertPromises);

      // Commit the batch write
      await batchWrite.commit();

      console.log("Batch write committed successfully");
    } catch (error:any) {
      // Handle the error gracefully
        console.error('Error occurred during batch processing:', error.message);
        // You can choose to log the error, retry the operation, or take other appropriate actions

        // Retry the operation for the failed batch
        return processBatch({batch, startIndex, createdFile});
    }
};


          // return pineconeIndex.namespace(createdFile.id).upsert([
          //     {
          //         id: pageId,
          //         values: pageEmbedding,
          //     }
          // ]);
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