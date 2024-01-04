"use client"
import { ChevronDown, ChevronUp, Loader2, RotateCw, Search,Expand } from 'lucide-react'
import React, { useState } from 'react'
import { Document, Page, pdfjs } from "react-pdf"
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { useToast } from './ui/use-toast'
import { useResizeDetector } from "react-resize-detector"
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useForm } from "react-hook-form"
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import SimpleBar from "simplebar-react"
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

interface PdfFullScreenProps {
    fileUrl: string
}

const PdfFullScreen = ({fileUrl} : PdfFullScreenProps) => {

    const { toast } = useToast()

    const {width, ref} = useResizeDetector()

    const [numPages, setNumPages] = useState<number>()
    const [currentPage, setCurrentPage] = useState<number>(1)

    const[scale, setScale] = useState<number>(1)
    const [rotation, setRotation] = useState<number>(0)
    const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <Dialog open={isOpen} onOpenChange={(v) => {
        if(!v){
            setIsOpen(v)
        }
    }}>
        <DialogTrigger onClick={() => setIsOpen(true)} asChild>
           <Button className='gap-1.5' variant="ghost" aria-label='fullscreen'>
             <Expand className='h-4 w-4'/>
           </Button>
        </DialogTrigger>
         <DialogContent className='max-w-7xl w-full'>
             <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)] mt-6'>
             <div ref={ref}>
                    <Document loading={
                    <div className='flex justify-center'>
                        <Loader2 className='my-24 h-6 w-6 animate-spin'/>
                    </div>
                    } 
                    onLoadError={() => {
                    toast({
                        title: "Error Loading pdf",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                    }}
                    onLoadSuccess={({numPages}) => setNumPages(numPages)}
                    file={fileUrl} 
                    className='max-h-full'
                    >
                    {new Array(numPages).fill(0)
                    .map((_, index) => (
                        <Page 
                        key={index}
                        width={width ? width : 1} 
                        pageNumber={index + 1}
                    />
                    ))}
                    </Document>
                </div>
             </SimpleBar>
         </DialogContent>
    </Dialog>
  )
}

export default PdfFullScreen