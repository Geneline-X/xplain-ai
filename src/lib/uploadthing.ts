import { generateReactHelpers } from "@uploadthing/react/hooks";
export const maxDuration = 300; 
import type { OurFileRouter } from "@/app/api/uploadthing/core";
 
export const { useUploadThing, uploadFiles } =
generateReactHelpers<OurFileRouter>();