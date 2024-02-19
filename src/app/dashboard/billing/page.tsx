
import { getUserSubscriptionPlan } from '@/lib/monime'
import React from 'react'
import BillingForm from '@/components/BillingForm'
interface Props {}

const Page = async() => {
    const subScriptionPlan = await getUserSubscriptionPlan()

  return (
    <BillingForm subScriptionPlan={subScriptionPlan}/>
  )
}

export default Page