import { notFound, redirect } from 'next/navigation'
import React, { useEffect } from 'react'
import { getKindeServerSession, } from "@kinde-oss/kinde-auth-nextjs/server"
import { db } from '@/db'
import PdfRenderer from '@/components/PdfRenderer'
import ChatWrapper from '@/components/chat/ChatWrapper'

interface PageProps {
    params: {
        fileId: string
    }
}
interface Props {}

const Page = async({params}: PageProps) => {


    ///// retrieve the file id
    const { fileId } = params
    const { getUser } = getKindeServerSession()
   
    const user = await getUser()
    if(!user || !user.id) {
       return redirect(`/auth-callback?origin=dashboard/${fileId}`)
    }

    //// make database call ///
    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId: user.id
        }
    })

    if(!file) notFound()
    
    const handleSendInvite = (email: string) => {
      // Logic to send invite
      console.log(`Invitation sent to ${email}`);
  };


 
  return (
    <div className='flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]'>
     <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
       {/* left side */}
       <div className="flex-1 xl-flex">
          <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
            <PdfRenderer url={file.url}/>
          </div>
       </div>
       <div className="shrink-0 flex-[0.85] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
         <ChatWrapper fileId={file.id}/>
       </div>
      </div>
      
    </div>
  )
}

export default Page