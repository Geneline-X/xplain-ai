import React from 'react'
import MaxWidthWrapper from './MaxWidthWrapper'
import Link from 'next/link'
import { buttonVariants } from './ui/button'
import { LoginLink, RegisterLink, getKindeServerSession, } from '@kinde-oss/kinde-auth-nextjs/server'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import UserAccountNav from './UserAccountNav'
import MobileNav from './MobileNav'
import { getUserSubscriptionPlan } from '@/lib/monime'
import { NavLogo } from '@/app/Icons'
import InvitationMenu from './InvitationMenu'

interface Props {}

const Navbar = async() => {

  const { getUser } = getKindeServerSession()
  const user = await getUser()
  const subscriptionPlan = await getUserSubscriptionPlan()
  return (
    <nav className='sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all'>
      <MaxWidthWrapper>
        <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
           
              {/* Logo */}
          <div className='flex items-center space-x-2'>
            <Link href="/" className='flex z-40 font-semibold text-xl'>
               X<span className='text-sm mt-1'>-PLAIN-AI</span>
            </Link>
          </div>
          
          
            {/* todo: add mobile navbar */}
            <MobileNav isAuth={!!user} isSubscribed={subscriptionPlan.isSubscribed}/>
            <div className='hidden items-center space-x-4 sm:flex'>
                
                {!user ?<>
                   <Link href="/pricing" className={buttonVariants({
                    variant: "ghost",
                    size: "sm"
                   })}>Pricing</Link>
                   <LoginLink className={buttonVariants({
                    variant: "ghost",
                    size: "sm"
                   })}>Sign in</LoginLink>
                   <RegisterLink className={buttonVariants({
                    size: "sm"
                   })}>Get Started <ArrowRight className='ml-1.5 h-5 w-5'/></RegisterLink>
                </> :
                 <>
                 <Link href="/dashboard/editor" className={buttonVariants({
                    variant: "ghost",
                    size: "sm"
                   })}>
                    Editor
                   </Link>
                   <Link href="/dashboard" className={buttonVariants({
                    variant: "ghost",
                    size: "sm"
                   })}>
                    Dashboard
                   </Link>
                   <UserAccountNav 
                    name={!user.given_name || !user.family_name ? "Your Account" : `${user.given_name} ${user.family_name}`}
                    email={user.email ?? ""}
                    imageUrl={""} //user.picture ??
                   />
                
                </>}
            </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  )
}

export default Navbar