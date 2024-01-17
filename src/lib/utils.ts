import { type ClassValue, clsx } from "clsx"
import { Metadata } from "next"
import { twMerge } from "tailwind-merge"
import { pathToFileURL } from "url"
 
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

export const setBackgroundCompleted = (isBackgroundCompleted: boolean) => {
  isBackgroundCompletedPromise =  Promise.resolve({isBackgroundCompleted})
  return isBackgroundCompletedPromise
}

export const getBackgroundCompleted = async() => {
  if (isBackgroundCompletedPromise) {
    return await isBackgroundCompletedPromise;
  }
  return false;
}

export function constructMetaData({
  title =  "ChatFlowPdfHub - the SaaS for students",
  description = "ChatFlowPdfHub is a software that makes chatting with your PDF files easy.",
  image = "/logo-pic.jpg",
  icons = "/favicon.ico",
  noIndex = false
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?:boolean
} = {}) : Metadata {
  return {
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

