"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import DropZone  from "react-dropzone"
import { Cloud, File, Loader2 } from 'lucide-react'
import { Progress } from './ui/progress'
import { useUploadThing } from '@/lib/uploadthing'
import { useToast } from './ui/use-toast'
import { trpc } from '@/app/_trpc/client'
import { useRouter } from 'next/navigation'
import { PDFDocument } from 'pdf-lib';

interface Props {}

const UploadDropzone = ({isSubscribed}: {isSubscribed: boolean}) => {

    const router = useRouter()
    const [isUpLoading, setIsUpLoading] = useState<boolean | null>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)

    const { toast} = useToast()
    const {startUpload} = useUploadThing(
      isSubscribed ? 'proPlanUploader': 'freePlanUploader'
    )

    const {mutate: startPolling} = trpc.getFile.useMutation({
        onSuccess: (file) => {
            router.push(`dashboard/${file.id}`)
            return toast({
              title: 'Upload Successful!',
              description: 'Your file has been uploaded.',
            });
        },
        onError: () => {
          return toast({
             title: 'Upload Failed During Polling',
             description: 'An error occurred while processing the uploaded file.',
             variant: 'destructive',
           });
         },
        retry: true,
        retryDelay: 500
    })
    const startSimulatedProgress = () => {
        setUploadProgress(0)

        const interval = setInterval(() => {
            setUploadProgress((prevProgress) => {
              if(prevProgress >= 95){
                  clearInterval(interval)
                  return prevProgress
              }
              return prevProgress + 5
            })
          }, 500)
        return interval
    }
    return (
        <DropZone multiple={false} onDrop={async(acceptedFile) => {
              const file = acceptedFile[0]
             if (file && file?.type! !== 'application/pdf') {
              toast({
                title: 'Invalid File Type',
                description: 'Please upload a PDF file.',
                variant: 'destructive',
              });
              // Clear the selectedFile state to empty the input
              setIsUpLoading(false)
              acceptedFile = []
              return;
            }
            //// handle the file uploading ////
           try {

            const readFile = (file:File) => {

              return new Promise((resolve, reject) => {
            
                const reader = new FileReader();
            
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            
                reader.readAsArrayBuffer(file);
              });
            }
        
            const arrayBuffer:any = await readFile(file);
      
            const pdf = await PDFDocument.load(arrayBuffer);

            const numPages = pdf.getPageCount();
            const MAX_PAGE_COUNT_FREE = 25
            // Check page count against plan limit
            if (numPages > MAX_PAGE_COUNT_FREE && !isSubscribed) {
              // Show toast and redirect to pricing page
              toast({
                title: "Too Many Pages",
                description: `Your PDF has ${numPages} pages, exceeding the free plan limit of ${MAX_PAGE_COUNT_FREE}. Please upgrade to upload larger PDFs.`,
                variant: "destructive",
              });
              router.push("/pricing"); // Replace with your pricing page URL
              return;
            }
            if(numPages < MAX_PAGE_COUNT_FREE && !isSubscribed){
              setIsUpLoading(true)
              const progressInterval = startSimulatedProgress()
              const res = await startUpload(acceptedFile)
              if(!res){
                  toast({
                      title: "something is wrong",
                      description: "Please try again later",
                      variant: "destructive"
                  })
              }else{
                const [fileResponse] = res || [];
                const key = fileResponse?.key
    
                if(!key) {
                    toast({
                        title: "something is wrong",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                }
    
                clearInterval(progressInterval)
                setUploadProgress(100)
    
                startPolling({key})
              }
            }
            if(isSubscribed){
              setIsUpLoading(true)
              const progressInterval = startSimulatedProgress()
              const res = await startUpload(acceptedFile)
              if(!res){
                  toast({
                      title: "something is wrong",
                      description: "Please try again later",
                      variant: "destructive"
                  })
              }else{
                const [fileResponse] = res || [];
                const key = fileResponse?.key
    
                if(!key) {
                    toast({
                        title: "something is wrong",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                }
    
                clearInterval(progressInterval)
                setUploadProgress(100)
    
                startPolling({key})
              }
            }
           } catch (error) {
            toast({
              title: 'Upload Failed',
              description: 'An error occurred', // Provide more specific error information
              variant: 'destructive',
            });
            console.error(error);
           }    
        }}>
             {({getRootProps, getInputProps, acceptedFiles}) => (
               <div {...getRootProps()} className='border h-64 m-4 border-dashed border-gray-300 rounded-lg'>
                 <div className="flex items-center justify-center h-full w-full">
                    <label htmlFor="dropzone-file"  className='flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'>
                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Cloud className='h-6 w-6 text-zinc-500 mb-2'/>
                        <p className='mb-2 text-sm text-zinc-700'>
                           <span className='font-semibold'>
                             Click to upload
                           </span>{" "}
                           or drag and drop
                        </p>
                        <p className='text-sm text-zinc-500'>PDF (up to {isSubscribed? "1GB" : "32MB"})</p>
                       </div>

                       {acceptedFiles && acceptedFiles[0] ? (
                       <div className='max-w-xs bg-white flex items-center rounded-md overflow-hidden outline-[1px] outline-zinc-200 divide-x divide-zinc-200'>
                           <div className='px-3 py-2 h-full grid place-items-center'>
                            <File className='h-4 w-4 text-orange-500 '/>
                           </div>
                           <div className="px-3 py-2 h-full text-sm truncate">
                             {acceptedFiles[0].name}
                            </div>
                       </div>
                    ) : null}

                    {isUpLoading ? (
                       <div className='w-full mt-4 max-w-xs mx-auto'>
                          <Progress 
                          value={uploadProgress} 
                          className='h-1 w-full bg-zinc-200'
                          indicatorColor={
                            uploadProgress === 100 ? "bg-green-500": ""
                          }
                          />
                          {uploadProgress === 100 ? (
                            <div className='flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2'>
                                <Loader2 className='h-3 w-3 animate-spin'/>
                                Redirecting...
                            </div>
                          ): null}
                       </div>
                       
                    ): null}

                    <input {...getInputProps} type="file" id='dropzone-file' className='hidden' />
                    </label> 
                 </div>
               </div>
             )}
        </DropZone>
    )
}

interface MobileUploadButtonProps {
  isSubscribed: boolean;
}


const UploadButton = ({isSubscribed}: {isSubscribed:boolean}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false)
  return (
    <>
    <Dialog open={isOpen} onOpenChange={(v) => {
        if(!v){
            setIsOpen(v)
        }
    }}>
        <DialogTrigger asChild onClick={() => setIsOpen(true)}>
            <Button>Upload PDF</Button>
        </DialogTrigger>

        <DialogContent>
            <UploadDropzone isSubscribed={isSubscribed}/>
        </DialogContent>
    </Dialog>

  </>
  )
}

export default UploadButton