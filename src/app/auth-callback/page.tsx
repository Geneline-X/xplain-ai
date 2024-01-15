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
      console.log("this is the success ", success)
      if(success) {
        // user is synced to db
        router.push(origin ? `/${origin}` : "/dashboard")
      }
      if(!success){
        router.push(`/sign-in`)
      }
    },
    onError: (error) => {
      console.log("this is the error ", error);
      
      if(error.message === 'UNAUTHORIZED'){
        router.push(`/sign-in`)
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