"use client"
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import DropZone  from "react-dropzone"
import { Cloud, File, Loader2, Upload } from 'lucide-react'
import { Progress } from './ui/progress'
import { useUploadThing } from '@/lib/uploadthing'
import { useToast } from './ui/use-toast'
import { trpc } from '@/app/_trpc/client'
import { useRouter } from 'next/navigation'
import { PDFDocument } from 'pdf-lib';
import { PLANS } from '@/config/stripe'
import { readFile } from 'fs'
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
      if (selectedFile && selectedFile.type !== 'application/pdf') {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
      // Clear the selectedFile state to empty the input
       setSelectedFile(null);
      return;
    }
    try {

      const readFile = (file:File) => {

        return new Promise((resolve, reject) => {
      
          const reader = new FileReader();
      
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
      
          reader.readAsArrayBuffer(file);
        });
      }
  
      const arrayBuffer:any = await readFile(selectedFile);

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
        // No page limit exceeded, proceed with setting state and opening modal
          setSelectedFile(selectedFile);
          setIsOpen(true);
      }
      if(isSubscribed){
        // No page limit exceeded, proceed with setting state and opening modal
          setSelectedFile(selectedFile);
          setIsOpen(true);
      }
    } catch (error) {
      // Handle PDF reading error
      toast({
        title: "Error Reading PDF",
        description: "An error occurred while reading the PDF file. Please try again.",
        variant: "destructive",
      });
      return;
    }

     // Check file size
     const MAX_FILE_SIZE_BYTES = 32 * 1024 * 1024;
     if (selectedFile.size > MAX_FILE_SIZE_BYTES && !isSubscribed) { // Assuming you have a MAX_FILE_SIZE constant
      toast({
        title: "File Too Large",
        description: `File size exceeds the maximum allowed size of 32MB.`,
        variant: "destructive",
      });
      setSelectedFile(null);
      router.push('/pricing')
      return;
    }
    if(selectedFile.size < MAX_FILE_SIZE_BYTES && !isSubscribed){
      setSelectedFile(selectedFile);
      setIsOpen(true);
    }
    if(isSubscribed){
      setSelectedFile(selectedFile);
      setIsOpen(true);
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
      toast({
        title: 'Upload Failed',
         description: 'An error occurred', // Provide more specific error information
         variant: 'destructive',
      });
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
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {!disabled ?<Dialog open={isOpen} onOpenChange={(v) => !v && setIsOpen(false)}>
        {/* Mobile-specific upload UI */}
        <div className="bg-white rounded-lg p-4">
          {selectedFile && (
            <div className="flex items-center mb-4">
              <File className="w-6 h-6 mr-2 text-blue-500" />
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
            </div>
          ) : (
            <Button disabled={disabled} onClick={handleFileUpload} className="w-full bg-orange-500 text-white">
              Upload <Upload className='w-4 h-4 ml-2'/>
            </Button>
          )}
          </div>
        </Dialog>: null}
    </div>
    )
}

export default MobileUploadButton