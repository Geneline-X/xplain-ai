
import { getUserSubscriptionPlan } from '@/lib/monime'
import React from 'react'
import BillingForm from '@/components/BillingForm'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/db'

interface Props {}

const Page = async() => {
    const subScriptionPlan = await getUserSubscriptionPlan()
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    const dbUser = await db.user.findFirst({
      where: {
      id: user?.id,
    },
  })

  return (
    <BillingForm subScriptionPlan={subScriptionPlan} price={"500"}/>
  )
}

export default Page