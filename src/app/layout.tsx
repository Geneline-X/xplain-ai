import { cn, constructMetaData } from '@/lib/utils'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers'

import "react-loading-skeleton/dist/skeleton.css"
import "simplebar-react/dist/simplebar.min.css"

import { Toaster } from '@/components/ui/toaster'


const inter = Inter({ subsets: ['latin'] })

export const metadata = constructMetaData()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Providers>
        <head>
        <meta name="google-site-verification" content="xqSq2gtf73XFTo_Z-8FEfgbwYD2xrJuZ8ityqXyGL4s" />
        </head>
      <body className={cn(
        'min-h-screen font-sans antialiased grainy',
        inter.className
      )}>
        <Toaster/>
        <Navbar/>
        {children}
        </body>
      </Providers>
    </html>
  )
}
