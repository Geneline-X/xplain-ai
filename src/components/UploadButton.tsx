"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import DropZone  from "react-dropzone"
import { Cloud, File as LucideFile, Loader2 } from 'lucide-react'
import { Progress } from './ui/progress'
import { useUploadThing } from '@/lib/uploadthing'
import { useToast } from './ui/use-toast'
import { trpc } from '@/app/_trpc/client'
import { useRouter } from 'next/navigation'
import { PDFDocument } from 'pdf-lib';
import { readFile } from '@/lib/utils'

interface Props {}

const UploadDropzone = ({isSubscribed}: {isSubscribed: boolean}) => {

    const router = useRouter()
    const [isUpLoading, setIsUpLoading] = useState<boolean | null>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [isProcessing, setIsProcessing] = useState<boolean>(false)

    const { toast} = useToast()
    //// I will have to implement the logic for all kind of file /////
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

    const handleFileUpload = async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      setIsUpLoading(true);
      const progressInterval = startSimulatedProgress();

      try {
          if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
              const res = await startUpload(acceptedFiles);
              handleUploadResponse(res);
          } else if (file.type !== 'application/pdf') {
              await convertToPDFAndUpload(file);
          } else {
              await uploadPDF(file);
          }
      } catch (error) {
          console.error('Error uploading file:', error);
          toast({
              title: "Something went wrong",
              description: "Please try again later.",
              variant: "destructive"
          });
      } finally {
          setIsUpLoading(false);
          clearInterval(progressInterval);
      }
  };

  const handleUploadResponse = (res: any) => {
      if (!res) {
          toast({
              title: "Something went wrong",
              description: "Please try again later.",
              variant: "destructive"
          });
      } else {
          const [fileResponse] = res || [];
          const key = fileResponse?.key;
          if (key) {
              setUploadProgress(100);
              startPolling({ key });
          } else {
              toast({
                  title: "Something went wrong",
                  description: "Please try again later.",
                  variant: "destructive"
              });
          }
      }
  };

  const convertToPDFAndUpload = async (file: File) => {
      const fileNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.'));
      const newFileName = `${fileNameWithoutExtension}.pdf`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('instructions', `
          {
              "parts": [
                  {
                      "file": "file"
                  }
              ]
          }
      `);

      try {
          setIsProcessing(true);
          const response = await fetch('/api/document-to-pdf', {
              method: 'POST',
              body: formData,
          });

          if (!response.ok) {
              throw new Error('Conversion failed');
          }

          const convertedPdfData = await response.blob();
          const convertedPdfFile = new File([convertedPdfData], newFileName, { type: 'application/pdf' });
          await uploadPDF(convertedPdfFile);
      } catch (error) {
          console.error('Error converting to PDF:', error);
          toast({
              title: "Conversion Failed",
              description: "Please try again later.",
              variant: "destructive"
          });
      } finally {
          setIsProcessing(false);
      }
  };

  const uploadPDF = async (file: File) => {
      const arrayBuffer:any = await readFile(file);
      const pdf = await PDFDocument.load(arrayBuffer);
      const numPages = pdf.getPageCount();
      const MAX_PAGE_COUNT_FREE = 10;

      if (numPages > MAX_PAGE_COUNT_FREE && !isSubscribed) {
          toast({
              title: "Too Many Pages",
              description: `Your PDF has ${numPages} pages, exceeding the free plan limit of ${MAX_PAGE_COUNT_FREE}. Please upgrade to upload larger PDFs.`,
              variant: "destructive",
          });
          router.push("/pricing");
          return;
      }

      if (numPages > 30) {
          toast({
              title: "Too Many Pages",
              description: `Your PDF has ${numPages} pages, which may take longer to process. Please wait for the upload to complete.`,
              variant: "default",
          });
      }

      setIsUpLoading(true);
      const progressInterval = startSimulatedProgress();
      const res = await startUpload([file]);
      handleUploadResponse(res);
      setIsUpLoading(false);
      clearInterval(progressInterval);
  };

    return (
        <DropZone multiple={false} onDrop={handleFileUpload}>
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
                        <p className='text-sm text-zinc-500'>Document Files/Media Files (up to {isSubscribed? "infinite pages" : "10 pages"})</p>
                       </div>
                       {acceptedFiles && acceptedFiles[0] &&!isProcessing ? (
                       <div className='max-w-xs bg-white flex items-center rounded-md overflow-hidden outline-[1px] outline-zinc-200 divide-x divide-zinc-200'>
                           <div className='px-3 py-2 h-full grid place-items-center'>
                            <LucideFile className='h-4 w-4 text-blue-400 '/>
                           </div>
                           <div className="px-3 py-2 h-full text-sm truncate">
                             {acceptedFiles[0].name}
                            </div>
                            
                       </div>
                    ) : null}
                    { isProcessing ? (
                      <div className='flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2'>
                          <Loader2 className='text-blue-400 h-10 w-10 animate-spin'/>
                          Processing your file please wait...
                      </div>
                    ):null}

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

                    <input 
                      {...getInputProps} 
                      type="file" id='dropzone-file' 
                      className='hidden' 
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault(); 
                        
                      }}
                    />
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
            <Button>Upload File</Button>
        </DialogTrigger>

        <DialogContent>
            <UploadDropzone isSubscribed={isSubscribed}/>
        </DialogContent>
    </Dialog>

  </>
  )
}

export default UploadButton