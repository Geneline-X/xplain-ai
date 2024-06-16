import React from 'react'
import { getKindeServerSession, } from "@kinde-oss/kinde-auth-nextjs/server"
import { db } from '@/db'
import { notFound, redirect } from 'next/navigation'
import HtmlRenderer from '@/components/HtmlRenderer'
import ChatWrapperUrl from '@/components/chat/ChatWrapperUrl'
import Link from 'next/link'
import StudySession from '@/components/StudySession'
interface PageProps {
    params: {
        urlFileId: string
    }
}
const Page = async({params}: PageProps) => {

    const { urlFileId } = params

    const { getUser } = getKindeServerSession()
   
    const user = await getUser()
    if(!user || !user.id) {
       return redirect(`/auth-callback?origin=dashboard/${urlFileId}`)
    }

      //// make database call ///
      const file = await db.urlFile.findFirst({
        where: {
            id: urlFileId,
            userId: user.id
        }
    })

    if(!file) notFound()

  return (
    <div className='flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]'>
    <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
      {/* left side */}
      <div className="flex-1 xl-flex">
         <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
         <div className="mb-4">
            <Link href="/dashboard/url-image-chat" className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Go to URL Dashboard 
            </Link>
         </div>
           <HtmlRenderer htmlContent={file.htmlContent!}/>
         </div>
      </div>
      <div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
         <div className='m-2'>
            <StudySession fileId={file.id} />
          </div>
       <ChatWrapperUrl fileId={file.id}/>
      </div>
     </div>
     
   </div>
  )
}

export default Page