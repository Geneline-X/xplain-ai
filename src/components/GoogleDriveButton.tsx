"use client"
import React, { useEffect, useState } from 'react'
import useDrivePicker from "react-google-drive-picker"
import { Button } from './ui/button'
import { CallbackDoc } from 'react-google-drive-picker/dist/typeDefs'
import { Upload } from 'lucide-react'
import { PDFDocument } from 'pdf-lib';
import { readFile } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import { trpc } from '@/app/_trpc/client';
import { useRouter } from 'next/navigation';
import { useUploadThing } from '@/lib/uploadthing';
import { Cloud, File as LucideFile, Loader2 } from 'lucide-react'
import { Progress } from './ui/progress'
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
interface Props {}

const GoogleDriveButton = ({ isSubscribed }: { isSubscribed: boolean }) => {

  const [openPicker] = useDrivePicker()
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpLoading, setIsUpLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const router = useRouter();
  const { toast } = useToast();
  const { startUpload } = useUploadThing(
    isSubscribed ? 'proPlanUploader' : 'freePlanUploader'
  );
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

  const handleOpenPicker = () => {
     openPicker({
        clientId: `${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`,
        developerKey: `${process.env.NEXT_PUBLIC_GOOGLE_DEVELOPER_KEY}`,
        viewId: "DOCS",
        showUploadView: true,
        showUploadFolders: true,
        supportDrives:true,
        async callbackFunction(data) {
            if (data.action === 'picked') {
                const file = data.docs[0];
                console.log("this is the file from google drive: ",file)
                await handleFile(file);
            }
        },
     })
  }

  const startSimulatedProgress = () => {
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 5;
      });
    }, 500);
    return interval;
};

const handleFile = async (file: CallbackDoc) => {
    try {
        
      setIsProcessing(true);

   
      const response = await fetch(file.embedUrl, {
        "headers": {
            
        }
      });
     
      const blob = await response.blob();
      console.log("this is the blob: ", blob)
          // Check if the blob is HTML
    if (blob.type === 'text/html') {
        const text = await blob.text();
        const container = document.createElement('div');
        container.innerHTML = text;
        document.body.appendChild(container);
  
        const canvas = await html2canvas(container, {
          useCORS: true,
          scale: 2,
        });
  
        document.body.removeChild(container);
  
        const imgData = canvas.toDataURL('image/png');
        const pdfConvert = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
  
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
        pdfConvert.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
        const pdfBlob = pdfConvert.output('blob');
      const fileName = file.name;
      const fileType = file.mimeType;

      let finalFile;
    //   if (fileType !== 'application/pdf') {
    //     const fileNameWithoutExtension = fileName.substring(
    //       0,
    //       fileName.lastIndexOf('.')
    //     );
    //     const newFileName = `${fileNameWithoutExtension}.pdf`;

    //     const formData = new FormData();
    //     formData.append('file', blob);
    //     formData.append(
    //       'instructions',
    //       `
    //                 {
    //                   "parts": [
    //                     {
    //                       "file": "file"
    //                     }
    //                   ]
    //               }
    //     `
    //     );

    //     const conversionResponse = await fetch('/api/document-to-pdf', {
    //       method: 'POST',
    //       body: formData,
    //     });

    //     if (!conversionResponse.ok) {
    //       toast({
    //         title: 'Conversion failed',
    //         description: 'Please try again.',
    //         variant: 'destructive',
    //       });
    //       throw new Error('Conversion failed');
    //     }

    //     const convertedPdfData = await conversionResponse.blob();
    //     finalFile = new File([convertedPdfData], newFileName, {
    //       type: 'application/pdf',
    //     });
    //   } else {
        
    //   }
      finalFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const arrayBuffer:any = await readFile(finalFile);
      const pdf = await PDFDocument.load(arrayBuffer);
      const numPages = pdf.getPageCount();

      await handleUpload(finalFile, numPages);
     }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Upload failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
};

const handleUpload = async (file:File, numPages:number) => {
    const MAX_PAGE_COUNT_FREE = 10;

    if (numPages > MAX_PAGE_COUNT_FREE && !isSubscribed) {
      toast({
        title: 'Too Many Pages',
        description: `Your PDF has ${numPages} pages, exceeding the free plan limit of ${MAX_PAGE_COUNT_FREE}. Please upgrade to upload larger PDFs.`,
        variant: 'destructive',
      });
      router.push('/pricing');
      return;
    }

    setIsUpLoading(true);
    const progressInterval = startSimulatedProgress();
    const res = await startUpload([file]);

    if (!res) {
      toast({
        title: 'Upload failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      setIsUpLoading(false);
    } else {
      const [fileResponse] = res || [];
      const key = fileResponse?.key;

      if (!key) {
        toast({
          title: 'Upload failed',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      } else {
        clearInterval(progressInterval);
        setUploadProgress(100);
        startPolling({ key });
      }
    }
  };
  return (
    <div className="relative">
    <Button
      className='bg-gray-500 hover:bg-gray-700'
      onClick={() => handleOpenPicker()}
      disabled={isProcessing || isUpLoading}
    >
      {isProcessing || isUpLoading ? (
        <Loader2 className="animate-spin h-5 w-5 mr-2" />
      ) : (
        <Upload className="h-5 w-5 mr-2" />
      )}
      Upload from Drive
    </Button>

    {isProcessing && (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
          <p className="mt-2 text-gray-700">Processing your file, please wait...</p>
        </div>
      </div>
    )}

    {isUpLoading && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-75">
        <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
          <Progress
            value={uploadProgress}
            className="h-2 mb-4"
            indicatorColor={uploadProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}
          />
          <p className="text-gray-700 text-center">
            {uploadProgress === 100 ? 'Upload complete! Redirecting...' : 'Uploading...'}
          </p>
        </div>
      </div>
    )}
  </div>


  )
}

export default GoogleDriveButton