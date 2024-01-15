"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import { trpc } from '../_trpc/client'
import { Loader2 } from 'lucide-react'

interface Props {}

const Page = () => {
    const router = useRouter()

    const searchParams = useSearchParams()
    const origin = searchParams.get('origin')

   trpc.authCallback.useQuery(undefined, {
    onSuccess: ({success}) => {
      console.log("Success callback triggered with:", success);
      if(success) {
        // user is synced to db
        console.log("this is inside the success ", success)
        router.push(origin ? `/${origin}` : "/dashboard")
      }
    },
    onError: (error) => {
        if(error?.data?.code === "UNAUTHORIZED"){
          console.log("this is inside the error")
            router.push("/sign-in")
        }
    },
    retry: true,
    retryDelay: 500,
  })

  return (
    <div className='w-full mt-24 justify-center'>
        <div className="flex flex-col items-center gap-2">
            <Loader2 className='h-8 animate-spin text-zinc-800'/>
            <h3 className='font-semibold text-xl'>Setting up your Account...</h3>
            <p>you will be redirected automatically</p>
        </div>
    </div>
  )
}

export default Page