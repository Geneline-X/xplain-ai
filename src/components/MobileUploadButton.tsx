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
    },
    retry: true,
    retryDelay: 500,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event?.target?.files?.[0]! ?? null);
    setIsOpen(true);
  };

  const handleFileUpload = async () => {
    setIsUploading(true);
    const progressInterval = startSimulatedProgress();
    try {
      const res = await startUpload([selectedFile!]);
      // ... handle upload response and polling
      if(!res){
        toast({
            title: "something is wrong",
            description: "Please try again later",
            variant: "destructive"
        })
     }

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

    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSelectedFile(null); // Clear selected file after upload
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
      <Button disabled={selectedFile ? true : false} onClick={handleUploadClicked} className="w-full mb-3 ml-5">
        Upload PDF
      </Button>
      <input
        id="mobile-file-input"
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Dialog open={isOpen} onOpenChange={(v) => !v && setIsOpen(false)}>
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
          ) : !disabled ? (
            <Button disabled={disabled} onClick={handleFileUpload} className="w-full bg-blue-500 text-white">
              Upload
            </Button>
          ): null}
          </div>
        </Dialog>
    </div>
    )
}

export default MobileUploadButton