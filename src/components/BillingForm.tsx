"use client"
import { useEffect } from 'react'
import { getUserSubscriptionPlan } from '@/lib/monime'
import React from 'react'
import { useToast } from './ui/use-toast'
import { trpc } from '@/app/_trpc/client'
import MaxWidthWrapper from './MaxWidthWrapper'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
import { formatDistanceToNow, format, differenceInHours } from 'date-fns'
import { useRouter } from 'next/navigation'

interface BillingFormProps {
    subScriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
    price: string | null
}

const BillingForm = ({subScriptionPlan, price}: BillingFormProps) => {
    const {toast} = useToast()
    const { mutate: updateUserDataCancelSub } = trpc.updateUserDataCancelSub.useMutation();
    const router = useRouter()
    // Assuming subScriptionPlan?.monimeCurrentPeriodsEnd! is a valid Date object
    const endDate = subScriptionPlan?.monimeCurrentPeriodsEnd!;

    useEffect(() => {
      if (endDate) {
        const currentTime = new Date();
        const hoursUntilEnd = differenceInHours(endDate, currentTime);
        if (hoursUntilEnd <= 0 && subScriptionPlan.isSubscribed) {
          // If hours until end are less than or equal to 0 and subscription is active, cancel subscription
           updateUserDataCancelSub();
        }
      }
      }, [endDate, subScriptionPlan.isSubscribed, updateUserDataCancelSub]);
    
    if (!endDate) {
        // Handle the case where endDate is null or undefined
        return <div>Error: End date not available</div>;
      }
      
    const formattedDate = format(endDate, "dd.MM.yy HH:mm:ss");
    const timeUntilEnd = formatDistanceToNow(endDate, { addSuffix: true });

   
    
    const {mutate: createMonimeSession, isLoading} = trpc.createMonimeSession.useMutation({
        onSuccess: (data) => {
            const url = data?.url
            if(url) window.location.href = url
            if(!url){
                toast({
                    title: "There was problem...",
                    description: "Please try again in a moment",
                    variant: "destructive"
                })
            }
        }
    })
  return (
    <MaxWidthWrapper className='max-w-5xl'>
       <form className='mt-12' onSubmit={(e) => {
        e.preventDefault()
        if(!price){
          toast({
            title: "price is null",
            description: "please go back to the pricing page, and renew"
          })
          router.push("/pricing")
          return
        }
        createMonimeSession({price})
       }}>
         <Card>
            <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>You are currently on the <strong>{subScriptionPlan.name}</strong> plan.</CardDescription>
            </CardHeader>
            <CardFooter className='flex flex-col items-center space-y-2 md:flex-row md:flex-justify-between md:space-x-0'>
                <Button type='submit'>
                    {isLoading ? (
                        <Loader2 className='mr-4 h-4 w-4 animate-spin'/>
                    ) : null}
                    {subScriptionPlan.isSubscribed ? "Manage Subscription": "Upgrade to Pro"}
                </Button>

                {subScriptionPlan.isSubscribed ? (
                    <p className='rounded-full text-xs font-medium'>
                        {subScriptionPlan.isCanceled ? "Your plan will be cancelled on ": "Your plan renews "}
                        {timeUntilEnd}.
                    </p>
                ):null}
            </CardFooter>
         </Card>
       </form>
    </MaxWidthWrapper>
  )
}

export default BillingForm