"use client"
import { ArrowRight, Gem, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface Props {}

const MobileNav = ({ isAuth, isSubscribed }: {isAuth: boolean, isSubscribed: boolean}) => {

    const [isOpen, setOpen] = useState<boolean>(false)

    const pathname = usePathname()

    const toggleOpen = () => setOpen((prev) => !prev)

    useEffect(() => {
        if(isOpen) toggleOpen()
    }, [pathname])
    
    const closeOnCurrent = (href: string) => {
        if(pathname === href){
            toggleOpen()
        }
    }
  return (
    <div className='sm:hidden'>
        <Menu 
        onClick={toggleOpen} 
        className='relative z-50 h-5 w-5 text-zinc-700'
        />
        {isOpen ? (
            <div className='fixed animate-in slide-in-from-top-5 fade-in-20 inset-0 z-0 w-full'>
                <ul className='absolute bg-white border-b border-zinc-200 shadow-xl grid w-full gap-3 px-10 pt-20 pb-8'>
                    {!isAuth ? (
                       <>
                        <li>
                            <Link 
                            onClick={() => closeOnCurrent('/sign-up')}
                            href='/sign-up'
                            className='flex items-center w-full font-semibold text-green-600'
                            >
                                Get started <ArrowRight className='ml-2 h-5 w-5'/>
                            </Link>
                        </li>

                        <li className='my-3 h-px w-full bg-gray-300'/>
                        <li>
                            <Link 
                            onClick={() => closeOnCurrent('/sign-in')}
                            href='/sign-in'
                            className='flex items-center w-full font-semibold'
                            >
                               Sign in 
                            </Link>
                        </li>
                        <li className='my-3 h-px w-full bg-gray-300'/>
                        <li>
                            <Link 
                            onClick={() => closeOnCurrent('/pricing')}
                            href='/pricing'
                            className='flex items-center w-full font-semibold'
                            >
                               Pricing 
                            </Link>
                        </li>
                       </>
                    ) : (
                      <>
                        <li>
                            <Link 
                            onClick={() => closeOnCurrent('/dashboard')}
                            href='/dashboard'
                            className='flex items-center w-full font-semibold'
                            >
                               Dashboard 
                            </Link>
                        </li>
                        <li className='my-3 h-px w-full bg-gray-300'/>
                        <li>
                            <Link 
                            onClick={() => closeOnCurrent('/dashboard/editor')}
                            href='/dashboard/editor'
                            className='flex items-center w-full font-semibold'
                            >
                               Editor 
                            </Link>
                        </li>
                        {!isSubscribed ? (
                            <>
                                <li className='my-3 h-px w-full bg-gray-300' />
                                <li>
                                <Link href='/pricing' className='flex items-center w-full font-semibold'>
                                    Upgrade <Gem className='text-blue-500 h-4 w-4 ml-1.5' />
                                </Link>
                                </li>
                            </>
                        ) : (
                            <>
                            <li className='my-3 h-px w-full bg-gray-300' />
                            <li>
                                <Link href='/dashboard/billing'>
                                    Manage Subscription
                                </Link>
                            </li>
                         </>
                        )}
                        <li className='my-3 h-px w-full bg-gray-300'/>
                        <li>
                            <Link 
                            href='/sign-out'
                            className='flex items-center w-full font-semibold'
                            >
                               Sign out
                            </Link>
                        </li>
                      </>
                    )}
                </ul>
            </div>
        ): null}
    </div>
  )
}

export default MobileNav