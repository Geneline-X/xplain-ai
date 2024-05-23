import { type ClassValue, clsx } from "clsx"
import { Metadata } from "next"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path:string){
  if(typeof window !== "undefined") return path
  if(process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`
  return `http://localhost:${process.env.VERCEL_URL ?? 3000}${path}`
}

// sharedData.js
let mainMonimeSessionDataPromise: Promise<any> | null = null;

export const setMainMonimeSessionData = ({ monimeSessionData, userId }: any) => {
  // Create a new promise and resolve it immediately
  mainMonimeSessionDataPromise = Promise.resolve({
    ...monimeSessionData,
    userId,
  });

  return mainMonimeSessionDataPromise;
};

export const getMainMonimeSessionData = () => {
  return mainMonimeSessionDataPromise;
};

///// waiting for background message process //////
let isBackgroundCompletedPromise: Promise<any> | null = null;

export const setBackgroundCompleted = (isCompleted: boolean) => {
  isBackgroundCompletedPromise =  Promise.resolve(isCompleted)
  return isBackgroundCompletedPromise
}

export const getBackgroundCompleted = () => {
    return isBackgroundCompletedPromise;
}

export function constructMetaData({
  title =  "XPLAIN AI - the SaaS for interacting with your document(pdf,ppt,doc,etc) files",
  description = "XPLAIN AI is a software that makes chatting with your Documents(pdf,ppt,doc,etc) files easy.",
  image = "/explain-logo.jpg",
  icons = "/favicon.ico",
  noIndex = false,
  manifest="/manifest.json"
}: {
  title?: string
  manifest?: string
  description?: string
  image?: string
  icons?: string
  noIndex?:boolean
} = {}) : Metadata {
  return {
    manifest,
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url:image
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@DKamara36931"
    },
    icons,
    metadataBase: new URL("https://cph-nine.vercel.app"),
    themeColor: "#FFF",
    ...(noIndex && {
      robots: {
        index:false,
        follow:false
      }
    })
  }
}




///////// in-memory caching ////////////
  // Create an in-memory cache for blobs
  const blobCache = new Map();

  async function clearExpiredCache() {
    const now = Date.now();
    for (const [url, { timestamp }] of blobCache.entries()) {
      if (now - timestamp > 5 * 60 * 1000) { // 5 minutes in milliseconds
        blobCache.delete(url);
        console.log(`Cache entry for ${url} expired and removed.`);
      }
    }
  }

  // utility function //
export const readFile = (file:Blob) => {
              
    return new Promise((resolve, reject) => {
  
      const reader = new FileReader();
  
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
  
      reader.readAsArrayBuffer(file);
    });
  }
export async function getCachedOrFetchBlob(url:string) {

  if (blobCache.has(url)) {
    console.log('Blob retrieved from cache.');
    return blobCache.get(url).blob;
  }

  const response = await fetch(url);
  const blob = await response.blob();

  // Cache the blob for future use
  blobCache.set(url,{ blob, timestamp: Date.now() });

  console.log('Blob fetched from network and cached.');
  return blob;
}  

setInterval(clearExpiredCache, 60 * 1000);
///////// This code attempts Queuing ///////////
const messageQueue: Array<{
  message: string;
  text: string;
  userId: string;
  fileId: string;
}> = [];

async function processQueue(db:any) {
while (messageQueue.length > 0) {
  const { message, text, userId, fileId } = messageQueue.shift()!;
  try {
    // Perform your database operations here
    const createMessage = await db.message.create({
      data: {
        text: message,
          isUserMessage: true,
          userId,
          fileId,
      }
    })
    const streamMessage = await db.message.create({
      data: {
          text,
          isUserMessage: false,
          fileId,
          userId,
      }
    })
   
  } catch (error) {
    console.error('Error in background processing:', error);
    /// adding a retry if this operation fail ////
  }
}
}

/// priotize context ///
export function prioritizeContext(pageLevelDocs:any[], keywords:any = []) {
  try {
        // Handle empty input gracefully
      if (!pageLevelDocs.length) {
        return '';
      }

      const relevantPages = pageLevelDocs.filter(page => {
        // Case-insensitive keyword matching
        return keywords.some((keyword:string) => page.pageContent.toLowerCase().includes(keyword.toLowerCase()));
      });

      // Prioritize relevant pages with keyword concentration
      const sortedPages = relevantPages.sort((pageA, pageB) => {
        const keywordCountA = keywords.filter((keyword:any) => pageA.pageContent.toLowerCase().includes(keyword.toLowerCase())).length;
        const keywordCountB = keywords.filter((keyword:any) => pageB.pageContent.toLowerCase().includes(keyword.toLowerCase())).length;
        return keywordCountB - keywordCountA; // Descending order
      });

       // Extract prioritized content
      const prioritizedContent = sortedPages.flatMap(page => page.pageContent).join('\n\n');
      if (prioritizedContent.length < 100) {
        const additionalPages = pageLevelDocs.filter(page => !relevantPages.includes(page));
        const additionalContent = additionalPages.flatMap(page => page.pageContent).join('\n\n');
        return `${prioritizedContent}\n\n${additionalContent}`;
      }
      return prioritizedContent;
  } catch (error) {
    
  }
}

// Helper functions for file type identification
export function isPdfFileType(fileType: string): boolean {
  return fileType === 'application/pdf';
}

export function isPptxFileType(fileType: string): boolean {
  return fileType === 'application/vnd.ms-powerpoint' || fileType.startsWith('application/vnd.openxmlformats-officedocument.presentationml.');
}


export function generateRandomHex() {
  const randomValue = Math.floor(Math.random() * 16777215); // Generate a random integer between 0 and 0xFFFFFF (inclusive)
  return randomValue.toString(16).padStart(6, '0'); // Convert to hexadecimal string and pad with leading zeros if necessary
}

export const COLORS = [
  "#E57373",
  "#9575CD",
  "#4FC3F7",
  "#81C784",
  "#FFF176",
  "#FF8A65",
  "#F06292",
  "#7986CB",
];
