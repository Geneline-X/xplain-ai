import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/dist/types";
import { model, pineconeIndex } from "./gemini";
import { db } from "@/db";
import { Liveblocks } from "@liveblocks/node";
import Moralis from 'moralis';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { vectordb } from "./firebaseConfig";
import { collection, getDocs, addDoc, writeBatch, doc, getDoc,  query} from "firebase/firestore";
import crypto from "crypto"
import cheerio from "cheerio"
import { llm } from "./gemini";

export const addHoursToDate = (date: Date, hours:number) => {
  const newDate = new Date(date);
  newDate.setHours(date.getHours() + hours);
  return newDate;
};

export const getFileType = (fileName: string): {extension:string, name:string} => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
      return {extension:"jpeg", name: 'image'};
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'heic':
    case 'heif':
      return {extension, name: 'image'};
    case 'mp4':
    case 'avi':
    case 'mkv':
    case 'mov':
      return {extension, name: 'video'};
    case 'mp3':
    case 'wav':
    case 'aac':
    case 'flac':
    case 'ogg':
    case 'm4a':
      return {extension, name: 'audio'};
    case 'pdf':
      return {extension, name: 'pdf'};
    default:
      throw new Error('Unsupported file type');
  }
};


export const getEndpointByFileType = (fileType: string): string => {
  switch (fileType) {
    case 'image':
      return `${process.env.RAG_PIPELINE_ENDPOINT}/file-upload/image`;
    case 'video':
      return `${process.env.RAG_PIPELINE_ENDPOINT}/file-upload/video`;
    case 'audio':
      return `${process.env.RAG_PIPELINE_ENDPOINT}/file-upload/audio`;
    case 'pdf':
      return `${process.env.RAG_PIPELINE_ENDPOINT}/file-upload/pdf`;
    default:
      throw new Error('Unsupported file type');
  }
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

export async function generateFlashCards(context: string, fileId: string): Promise<any[]> {
  try {
    const result = await llm.generateContent(`Generate flash cards from the following context, don't add "front" and "back", just returned question and answers:\n\n${context}`);
    const response = result.response.text(); // Await the text response
    const lines = response.split('\n');
    
    const flashCards = lines.map(line => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex !== -1) {
        const question = line.substring(0, separatorIndex).trim().replace(/\*/g, '');
        const answer = line.substring(separatorIndex + 1).trim().replace(/\*/g, '');
        if (question && answer) {
          return { question, answer };
        }
      }
      return null;
    }).filter(flashCard => flashCard !== null);

    return flashCards;
  } catch (error) {
    console.error("Error generating flash cards:", error);
    return [];
  }
}



// split text into chunks //
export function splitTextIntoChunks(text:string, chunkSize:number) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let chunk = '';

  for (const sentence of sentences) {
    if (chunk.length + sentence.length <= chunkSize) {
      chunk += sentence;
    } else {
      chunks.push(chunk);
      chunk = sentence;
    }
  }

  if (chunk) {
    chunks.push(chunk);
  }

  return chunks;
}

// create random key for each file //
export function generateUniqueKey(url:string) {
  const hash = crypto.createHash('sha256').update(url).digest('base64');
  // Remove any special characters from the base64 encoded string
  return hash.replace(/[+/=]/g, ''); 
}

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
  console.log("get embeddings starts")
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

//// returned cleaned html content with text only /////
export const cleanedHtmlText = (htmlContent:string):{textContent:string, cleanedHtmlContent:string} => {
  // Load the HTML content into Cheerio
  const $ = cheerio.load(htmlContent);

  $('script').remove();
  $('.ad, .ads, .advertisement, .sponsor, .sponsored, [id*="ad"], [class*="ad"]').remove();
  
  // Extract text content from HTML elements
  const textContentArray: string[] = [];
  $('body')
    .find('p, div, span, h1, h2, h3, h4, h5, h6')
    .each((_, element) => {
        textContentArray.push($(element).text());
    });
  const textContent = textContentArray.join(' ');

  const cleanedHtmlContent = $.html();
  return {textContent, cleanedHtmlContent}
}
type GeneratorType = {
    controller: ReadableStreamDefaultController;
    text: string
    fileId:string,
    userId:string
}

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
       
        // Retry the operation for the failed batch
        return processBatch({batch, startIndex, createdFile});
    }
};
export const processBatchUrl = async ({batch, startIndex, createdFile}: ProcessBatchTypes):Promise<any> => {
    try {
        const batchWrite = writeBatch(vectordb);
        const upsertPromises = batch.map(async (text:string, index:number) => {
          const pageIndex = startIndex + index;
         
          // Embed the individual page using model.embedContent
          const result = await model.embedContent(text);
          const pageEmbedding = result.embedding.values;

          const pageId = `${createdFile.id}-page-${pageIndex}`;
          
          // Store the embedding for the page 
          // Create the data object for the page embedding
            const pageData = {
              text,
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
      
        console.error('Error occurred during batch processing:', error.message);
       
        // Retry the operation for the failed batch
        return processBatchUrl({batch, startIndex, createdFile});
    }
};

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
