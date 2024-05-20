import React, { useState } from 'react'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from 'next/navigation'
import { db } from '@/db'
import DashBoard from '@/components/DashBoard'
import { getUserSubscriptionPlan } from '@/lib/monime'

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
    
    const subscriptionPlan = await getUserSubscriptionPlan()
    
  return (
    <>
        <DashBoard subscriptionPlan={subscriptionPlan}/>
    </>
  )
}

export default Page