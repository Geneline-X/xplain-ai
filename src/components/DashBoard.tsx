"use client"

import React, {useEffect, useState} from 'react'
import UploadButton from './UploadButton'
import { trpc } from '@/app/_trpc/client'
import { Ghost, Loader2, MessageSquare, Plus, Trash } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from './ui/button'
import { useSearchParams } from 'next/navigation'
import { getUserSubscriptionPlan } from '@/lib/monime'
import MobileUploadButton from './MobileUploadButton'
import { PDFDocument } from 'pdf-lib';
import { useToast } from './ui/use-toast'
import { useRouter } from 'next/navigation'
import { readFile } from '@/lib/utils'

interface PageProps{
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
}
const DashBoard = ({subscriptionPlan}: PageProps) => {

  const searchParams = useSearchParams()

  const router = useRouter()

 
    const { toast} = useToast()
    const [currentDeletingFile, setCurrentDeletingFile] = useState<string | null>(null)
    const [loadingFiles, setLoadingFiles] = useState<{ [key: string]: boolean }>({}) // Track loading state for each file

    const { data: files, isLoading } = trpc.getUserFiles.useQuery()

    const utils = trpc.useContext()
    const { mutate: deleteFile } = trpc.deleteFile.useMutation({
        onSuccess: () => {
          utils.getUserFiles.invalidate()
        },
        onMutate: ({id}) => {
            setCurrentDeletingFile(id)
        },
        onSettled: () => {
            setCurrentDeletingFile(null)
        }
    })

    const handleClickFile = async (file: any) => {
      try {
        const response = await fetch(`https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`)
        const blob = await response.blob()
        const arrayBuffer: any = await readFile(blob)
        const pdf = await PDFDocument.load(arrayBuffer)
        const numPages = pdf.getPageCount()
        const MAX_PAGE_COUNT_FREE = 10
  
        // Check page count against plan limit
        if (numPages > MAX_PAGE_COUNT_FREE && !subscriptionPlan.isSubscribed) {
          // Show toast and redirect to pricing page
          toast({
            title: "Too Many Pages",
            description: `Your PDF has ${numPages} pages, exceeding the free plan limit of ${MAX_PAGE_COUNT_FREE}. Please upgrade to upload larger PDFs.`,
            variant: "destructive",
          })
          router.push("/pricing")
          return
        } else {
          router.push(`/dashboard/${file.id}`)
          return
        }
      } catch (error) {
        console.log("this is the error", error)
      }
    }

    

  return (
    <main className='mx-auto max-w-7xl md:p-10'>
     
    <div className='mt-8 flex flex-col items-start justify-between gap-4 border-b boder-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0'>
        <h1 className='mt-3 font-bold text-5xl text-gray-900'>
          My Files
        </h1>
        {/* Display MobileUploadButton only on small screens */}
        <div className="flex sm:hidden items-center justify-center">
          <MobileUploadButton isSubscribed={subscriptionPlan.isSubscribed} />
        </div>

        {/* Display UploadButton on larger screens */}
        {/*  */}
        <div className="hidden sm:block">
          <UploadButton isSubscribed={subscriptionPlan.isSubscribed} />
        </div>
    </div>

    {/* display all user first */}
    {files && files?.length !==0 ? (
      <ul className='mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid cols-3'>
        {
        files
          .sort((a,b) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime())
          .map((file, index) => (
              <li key={file.id} className='col-span-1 divide-y divide-gray-200 rouonded-lg bg-white shadow transition hover:shadow-lg'>
                <Link onClick={async(e) => {
                  e.preventDefault()
                  setLoadingFiles(prevState => ({ ...prevState, [file.id]: true })) // Set loading state to true for this file
                  handleClickFile(file)

                }} href={`/dashboard/${file.id}`} className='flex flex-col gap-2 '>
                  <div className="pt-6 flex w-full items-center justify-between space-x-6">
                    <div className='h-10 w-10 ml-2 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600'/>
                    <div className="flex-1 truncate">
                        <div className="flex items-center space-x-3">
                          {loadingFiles[file.id] ? ( // Display loader-spinner if loading
                            <Loader2 color='blue' className='h-10 w-10 animate-spin' />
                          ) : (
                            <h3 className='truncate text-lg font-medium text-zinc-900'>{file.name}</h3>
                          )}
                        </div>
                    </div>
                  </div>
                </Link>
                <div className='px-6 mt-4 grid grid-cols-3 place-items-center py-2 gap-6 text-xs text-zinc-500'>
                          <div className="flex items-center gap-2">
                              <Plus className='h-4 w-4'/>
                              {format(new Date(file.createAt), "dd MMM yyyy")}
                          </div>  
                          <div className="flex items-center gap-2">
                              <MessageSquare className='h-4 w-4'/>
                              Mocked
                          </div>

                          <Button onClick={() => deleteFile({id: file?.id})} size="sm" className='w-full' variant='destructive'>
                              { currentDeletingFile === file.id ? (
                                  <Loader2 className='h-4 w-4 animate-spin'/>
                              ) :<Trash className='h-4 w-4'/>}
                          </Button>
                  </div>
              </li>
          ))
        }
      </ul>
    ) : isLoading? (
      <Skeleton height={100} className='my-2' count={3}/>
    ): (
      <div className='mt-16 flex flex-col items-center gap-2'>
          <Ghost className='h-8 w-8 text-zinc-800'/>
          <h3 className='font-semibold text-xl'>Pretty empty around here</h3>
          <p>Let&apos;s upload your first PDF.</p>
      </div>
    ) }
  </main>
  )
}


export default DashBoard