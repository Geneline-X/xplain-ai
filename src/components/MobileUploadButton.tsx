"use client"
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import DropZone  from "react-dropzone"
import { Cloud, File as LucideFile, Loader2, Upload } from 'lucide-react'
import { Progress } from './ui/progress'
import { useUploadThing } from '@/lib/uploadthing'
import { useToast } from './ui/use-toast'
import { trpc } from '@/app/_trpc/client'
import { useRouter } from 'next/navigation'
import { PDFDocument } from 'pdf-lib';
import { PLANS } from '@/config/stripe'
import { readFile } from '@/lib/utils'
interface MobileUploadButtonProps {
    isSubscribed: boolean
}
const MobileUploadButton: React.FC<MobileUploadButtonProps> = ({ isSubscribed }) => {
  
  const router = useRouter()
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();
  const { startUpload } = useUploadThing(isSubscribed ? 'proPlanUploader' : 'freePlanUploader');
  const [disabled, setDisabled] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const { mutate: startPolling } = trpc.getFile.useMutation({
    onSuccess: (file) => {
      router.push(`dashboard/${file.id}`);
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
    retryDelay: 500,
  });

  const handleFileChange = async(event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event?.target?.files?.[0]! ?? null

      if(selectedFile && selectedFile.type !== "application/pdf"){
        
        const fileName = selectedFile?.name;
        const fileNameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
        const newFileName = `${fileNameWithoutExtension}.pdf`;
        toast({
          title: 'Processing',
          description: 'Please be patient we are processing the file.',
          variant: 'default',
        });

        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('instructions', `
          {
            "parts": [
              {
                "file": "file"
              }
            ]
          }
        `)

        try {
          
            setIsUploading(true)
            setIsProcessing(true)
                  // Send the POST request to the API route
            const response = await fetch('/api/document-to-pdf', {
              method: 'POST',
              body: formData,
              
            })

            if (!response.ok) {
              toast({
                title: 'Conversion failed',
                description: 'Please try again.',
                variant: 'destructive',
              });
              throw new Error('Conversion failed')
              
          }
          setIsProcessing(false)

          const convertedPdfData = await response.blob()
               
          const convertedPdfFile = new File([convertedPdfData], newFileName, { type: 'application/pdf' });

         console.log("this is the pdf File ", convertedPdfFile)
          const arrayBuffer:any = await readFile(convertedPdfFile);

          const pdf = await PDFDocument.load(arrayBuffer);

          const numPages = pdf.getPageCount();

          const MAX_PAGE_COUNT_FREE = 10
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
                setIsUploading(false)
                console.log(convertedPdfFile)
                setSelectedFile(convertedPdfFile)
            }
          

          if(isSubscribed){
            setIsUploading(false)
            setSelectedFile(convertedPdfFile)
          }

        } catch (error) {
          console.log("this is the error")
        }
      }else{
        setSelectedFile(selectedFile)
      }
        
  };

  const handleFileUpload = async () => {
    setIsUploading(true);
    const progressInterval = startSimulatedProgress();
    try {
      
      const res = await startUpload([selectedFile!]);
      // ... handle upload response and polling
      if(!res){
        ////// Need to apply the logic for redirecting //////
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

    } catch (error:any) {
      
      console.error(error);
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSelectedFile(null); // Clear selected file after upload
      setIsUploading(false);
    }
  };

  const startSimulatedProgress = () => {
    // ... your progress simulation logic
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
  };

  const handleUploadClicked = () => {
     document?.getElementById('mobile-file-input')?.click()
     
     setDisabled(false)
  }
  
  return (
    <div className="relative">
      <Button disabled={selectedFile ? true : false} onClick={handleUploadClicked} className="w-full mb-3">
        Upload PDF
      </Button>
      <input
        id="mobile-file-input"
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {!disabled ?<Dialog open={isOpen} onOpenChange={(v) => !v && setIsOpen(false)}>
        {/* Mobile-specific upload UI */}
        <div className="bg-white rounded-lg p-4">
          {selectedFile && (
            <div className="flex items-center mb-4">
              <LucideFile className="w-6 h-6 mr-2 text-blue-500" />
              <span className="text-sm">{selectedFile.name}</span>
            </div>
          )}
          {isUploading ? (
            <div className="flex items-center">
              <Progress value={uploadProgress} />
              {uploadProgress === 100 ? (
                <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-gray-600">Redirecting...</span>
                </div>
              ) : null}
              { isProcessing ? (
                      <div className='flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2'>
                          <Loader2 className='text-orange-500 h-10 w-10 animate-spin'/>
                          Processing your file please wait...
                      </div>
                ):null}
            </div>
          ) : (
            // messing around //
            <Button disabled={!selectedFile ? true : false} onClick={handleFileUpload} className="w-full bg-orange-500 text-white">
              Upload <Upload className='w-4 h-4 ml-2'/>
            </Button>
          )}
          </div>
        </Dialog>: null}
    </div>
    )
}

export default MobileUploadButton