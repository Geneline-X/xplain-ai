import { notFound, redirect } from 'next/navigation'
import React, { useEffect } from 'react'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { db } from '@/db'
import PdfRenderer from '@/components/PdfRenderer'
import VideoRenderer from '@/components/VideoRenderer'
import ChatWrapper from '@/components/chat/ChatWrapper'
import StudySession from '@/components/StudySession'
import { getFileType } from '@/lib/elegance'
import ImageRenderer from '@/components/ImageRenderer'
import AudioPlayer from '@/components/AudioPlayerRenderer'

interface PageProps {
  params: {
    fileId: string
  }
}

const Page = async ({ params }: PageProps) => {

  const { fileId } = params
  const { getUser } = getKindeServerSession()
  
  const user = await getUser()
  if (!user || !user.id) {
    return redirect(`/auth-callback?origin=dashboard/${fileId}`)
  }

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId: user.id
    }
  })

  if (!file) notFound()
    const {name} = getFileType(file.name)

  const renderFile = () => {
    switch (name) {
      case 'pdf':
        return <PdfRenderer url={ `https://utfs.io/f/${file.key}`} />
      case 'video':
        return <VideoRenderer url={ `https://utfs.io/f/${file.key}`} />
      case 'image':
        return <ImageRenderer url={`https://utfs.io/f/${file.key}`} />
      case 'audio':
        return <AudioPlayer url={ `https://utfs.io/f/${file.key}`} />
      
      default:
        return <div>Unsupported file type</div>
    }
  }

  return (
    <div className='flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]'>
      {name === 'audio' && (
        <div className="w-full bg-white shadow-md p-4">
          <AudioPlayer url={file.url} />
        </div>
      )}
      <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
        <div className="flex-1 xl-flex">
          <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
            {name !== 'audio' ? renderFile() : 
            <>
            <StudySession fileId={file.id} />
            <ChatWrapper fileId={file.id} />
            </>
            }
          </div>
        </div>
        {name !== 'audio'? (
          <div className="shrink-0 flex-[0.85] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
          <div className='m-2'>
            <StudySession fileId={file.id} />
          </div>
          <ChatWrapper fileId={file.id} />
        </div>
        ):null}
      </div>
    </div>
  )
}

export default Page
