import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import React from 'react'
import { PLANS } from '@/config/stripe'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ArrowRight, Check, HelpCircle, Minus } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import UpgradeButton from '@/components/UpgradeButton'

interface Props {}

const pricingItems = [
  {
    plan: 'Free',
    priceMonime: "0",
    tagline: 'For small side projects.',
    quota: 10,
    features: [
      {
        text: '10 pages per PDF',
        footnote: 'The maximum amount of pages per PDF-file.',
      },
      {
        text: '32MB file size limit',
        footnote: 'The maximum file size of a single PDF file.',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Higher-quality responses',
        footnote: 'Better algorithmic responses for enhanced content quality',
        negative: true,
      },
      {
        text: 'Priority support',
        negative: true,
      },
    ],
  },
  {
    plan: 'Pro-hour',
    priceMonime: "500", // 500
    tagline: 'For larger projects with higher needs.',
    quota: PLANS.find((p) => p.slug === 'pro-hour')!.quota,
    features: [
      {
        text: 'Infinte pages per PDF',
        footnote: 'The maximum amount of pages per PDF-file.',
      },
      {
        text: '1Gb file size limit',
        footnote: 'The maximum file size of a single PDF file.',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Higher-quality responses',
        footnote: 'Better algorithmic responses for enhanced content quality',
      },
      {
        text: 'Priority support',
      },
    ],
  },
  {
    plan: 'Pro-day',
    priceMonime: "2000", // 2000,
    tagline: 'For larger projects with higher needs.',
    quota: PLANS.find((p) => p.slug === 'pro-day')!.quota,
    features: [
      {
        text: 'Infinte pages per PDF',
        footnote: 'The maximum amount of pages per PDF-file.',
      },
      {
        text: '1Gb file size limit',
        footnote: 'The maximum file size of a single PDF file.',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Higher-quality responses',
        footnote: 'Better algorithmic responses for enhanced content quality',
      },
      {
        text: 'Priority support',
      },
    ],
  },
  {
    plan: 'Pro-week',
    priceMonime: "5000", // 5000,
    tagline: 'For larger projects with higher needs.',
    quota: PLANS.find((p) => p.slug === 'pro-week')!.quota,
    features: [
      {
        text: 'Infinte pages per PDF',
        footnote: 'The maximum amount of pages per PDF-file.',
      },
      {
        text: '1Gb file size limit',
        footnote: 'The maximum file size of a single PDF file.',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Higher-quality responses',
        footnote: 'Better algorithmic responses for enhanced content quality',
      },
      {
        text: 'Priority support',
      },
    ],
  },
]

const Page = async() => {

    const { getUser } = getKindeServerSession()
    const user = await getUser()


    
  return (
    <>
     <MaxWidthWrapper className='mb-8 mt-24 text-center max-w-5xl'>
        <div className='mx-auto mb-10 sm:max-w-lg'>
            <h3 className='text-6xl font-bold sm:text-7xl'>Pricing</h3>
            <p className='mt-5 text-gray-600 sm:text-lg'>
                Whether you&apos;re just trying out our service or need more, we&apos;ve got you covered
            </p>
        </div>
        <div className='pt-12 grid grid-cols-1 gap-10 lg:grid-cols-2'>
            <TooltipProvider>
              {pricingItems.map(({plan, tagline, quota, features, priceMonime}) => {
                const price = PLANS.find((p) => p.slug === plan.toLowerCase())?.price.amount || 0

                return (
                    <div key={plan} className={cn("relative rounded-2xl bg-white shadow-lg", {
                    "border-2 border-blue-500 shadow-blue-200": plan.startsWith("Pro"),
                    "border border-gray-200": !plan.startsWith("Pro") 
                  })}>
                    {plan.startsWith("Pro") && (
                      <div className='absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-blue-500 to-blue-500 px-3 py-2 tx-sm font-medium text-white'>
                        Upgrade now
                      </div>
                    )}

                    <div className='p-5'>
                      <h3 className='my-3 text-center font-display text-3xl font-bold'>
                        {plan}
                      </h3>
                      <p className='text-gray-500'>{tagline}</p>
                      <p className='my-5 font-display text-6xl font-semibold'>SLE  {price}</p>
                      {
                      plan === "Pro-hour" ? <p className='text-gray-500'>for 3 Hours</p>:
                      plan === "Pro-day" ? <p className='text-gray-500'>for a Day</p>:
                      plan === "Pro-week" ? <p className='text-gray-500'>for a Week</p>: null
                      }
                    </div>
                    <div className='flex h-20 items-center justify-center border-b border-t border-gray-200 bg-gray-50'>
                       <div className='flex items-center space-x-1'>
                          <p>{quota.toLocaleString()} Files/mo included</p>
                          <Tooltip delayDuration={300}>
                             <TooltipTrigger className='cursor-default ml-1.5'>
                              <HelpCircle className='h-4 w-4 text-zinc-500'/>
                             </TooltipTrigger>
                             <TooltipContent className='w-80 p-2'>
                                How many Files you can upload per month
                             </TooltipContent>
                          </Tooltip>
                       </div>
                    </div>

                    <ul className='my-10 space-y-5 px-8'>
                       {features.map(({text, footnote, negative}) => (
                        <li key={text} className='flex space-x-5'>
                          <div className='flex-shrink-0'>
                             {negative ? (
                              <Minus className='h-6 w-6 text-gray-300'/>
                             ): (
                               <Check className='h-6 w-6 text-blue-400'/>
                             )}
                          </div>
                          {footnote ? (
                            <div className='flex items-center space-x-1'>
                              <p className={cn("text-gray-400", {
                                "text-gray-600" : negative
                              })}>
                                {text}
                              </p>
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger className='cursor-default ml-1.5'>
                                  <HelpCircle className='h-4 w-4 text-zinc-500'/>
                                </TooltipTrigger>
                                <TooltipContent className='w-80 p-2'>
                                   {footnote}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ): (
                            <p className={cn("text-gray-400", {
                              "text-gray-600" : negative
                            })}>
                              {text}
                            </p>
                          )}
                        </li>
                       ))}
                    </ul>
                    <div className='border-t border-gray-200'/>
                    <div className='p-5'>
                        {plan === "Free" ? (
                          <Link href={user ? "/dashboard" : "/sign-in"} className={buttonVariants({
                            className: "w-full",
                            variant: "secondary"
                          })}>
                            {user ? "Dashboard" : "Sign up"}
                            <ArrowRight className='h-5 w-5 ml-1.5'/>
                          </Link>
                        ): user && priceMonime ? (
                         <UpgradeButton price={priceMonime}/>
                        ): (
                          <Link href="/sign-in" className={buttonVariants({
                            className: "w-full"
                          })}>
                            {user ? "Upgrade now" : "Sign up"}
                            <ArrowRight className='h-5 w-5 ml-1.5'/>
                          </Link>
                        )}  
                    </div>
                  </div>
                )
              })}
            </TooltipProvider>
        </div>
     </MaxWidthWrapper>
    </>
  )
}

export default Page