import React, { useState } from 'react'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from 'next/navigation'
import { db } from '@/db'
import DashBoard from '@/components/DashBoard'

interface Props {}

const Page = async() => {

    const { getUser } = getKindeServerSession()

    const user = await getUser()
    if(!user || !user.id) redirect("/auth-callback?origin=dashboard")

    const dbUser = await db.user.findFirst({
      where: {id : user.id}
    })
    
    if(!dbUser){
      redirect("/auth-callback?origin=dashboard")
    }
    
    
  return (
    <>
    <DashBoard/>
    </>
  )
}

export default Page