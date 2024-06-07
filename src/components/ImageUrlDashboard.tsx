"use client"

import React, {useState} from 'react'
import UrlInput from './chat-url-img/UrlInput'
import { Button } from './ui/button'
import { trpc } from '@/app/_trpc/client'
import { Send, Link as LinkIcon, Trash, Loader2, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useToast } from './ui/use-toast'
import Skeleton from 'react-loading-skeleton'

interface Props {}

const ImageUrlDashboard = () => {

    const { toast} = useToast()
    const [currentDeletingFile, setCurrentDeletingFile] = useState<string | null>(null)
    //const [loadingFiles, setLoadingFiles] = useState<{ [key: string]: boolean }>({}) // Track loading state for each file

    const { data: urlFiles, isLoading} = trpc.getUserUrlFiles.useQuery()
    
    console.log("this is the loading value: ", isLoading)
    const utils = trpc.useContext()
    const { mutate: deleteUrlFile } = trpc.deleteUrlFile.useMutation({
        onSuccess: () => {
          utils.getUserUrlFiles.invalidate()
        },
        onMutate: ({id}) => {
            setCurrentDeletingFile(id)
        },
        onSettled: () => {
            setCurrentDeletingFile(null)
        }
    })
  return  (
    <div className='flex flex-col mb-5 items-center justify-center mt-8'>
      <UrlInput/>

       {urlFiles && urlFiles.length !== 0 ? (
        <ul className='mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid-cols-3'>
          {urlFiles
            .sort((a, b) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime())
            .map((file) => (
              <li key={file.id} className='col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow transition hover:shadow-lg'>
                <Link href={`/dashboard/url-image-chat/${file.id}`} className='flex flex-col gap-2'>
                  <div className="pt-6 flex w-full items-center justify-between space-x-6">
                    <div className='h-10 w-10 ml-2 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600'>
                      <LinkIcon className='h-6 w-6 text-white' />
                    </div>
                    <div className="flex-1 truncate">
                      <div className="flex items-center space-x-3">
                        <h3 className='truncate text-lg font-medium text-zinc-900'>{file.name}</h3>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className='px-6 mt-4 grid grid-cols-3 place-items-center py-2 gap-6 text-xs text-zinc-500'>
                  <div className="flex items-center gap-2 text-blue-400">
                    {format(new Date(file.createAt), "dd MMM yyyy")}
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <MessageSquare className='h-4 w-4'/>
                    {file._count.message} {file._count.message > 1 ? "Messages" : "Message"}
                  </div>
                  <Button onClick={() => deleteUrlFile({id: file?.id})} size="sm" className='w-full' variant='destructive'>
                    {currentDeletingFile === file.id ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : <Trash className='h-4 w-4' />}
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      ) : isLoading? (
        <Skeleton height={100} className='my-2' count={4}/>
      ) : (
        <div className='mt-16 flex flex-col items-center gap-2'>
          <h3 className='font-semibold text-xl'>No URLs available</h3>
        </div>
      ) }
    </div>
  )

}

export default ImageUrlDashboard