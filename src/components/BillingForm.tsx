"use client"
import { getUserSubscriptionPlan } from '@/lib/stripe'
import React from 'react'
import { useToast } from './ui/use-toast'
import { trpc } from '@/app/_trpc/client'
import MaxWidthWrapper from './MaxWidthWrapper'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
interface BillingFormProps {
    subScriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
}

const BillingForm = ({subScriptionPlan}: BillingFormProps) => {
    const {toast} = useToast()

    // Assuming subScriptionPlan?.monimeCurrentPeriodsEnd! is a valid Date object
    const endDate = subScriptionPlan?.monimeCurrentPeriodsEnd!;

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
        createMonimeSession()
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
                        {subScriptionPlan.isCanceled ? "Your plan will be cancelled on ": "Your plan renews in"}
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