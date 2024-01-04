import { type ClassValue, clsx } from "clsx"
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

