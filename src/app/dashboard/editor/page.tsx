
import Editor from '@/components/editor/Editor'
import React from 'react'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from 'next/navigation'
import { db } from '@/db'

interface Props {}

const Page = async() => {

  const { getUser } = getKindeServerSession()

  const user = await getUser()
  if(!user || !user.id) redirect("/auth-callback?origin=dashboard/editor")

  const dbUser = await db.user.findFirst({
    where: {id : user.id}
  })
  
  if(!dbUser){
    redirect("/auth-callback?origin=dashboard")
  }
  return (
        <div>
          {/* Add the gemini chat model around here to improve user experience */}
         <Editor/>
        </div>
  )
}

export default Page