import { cn, constructMetaData } from '@/lib/utils'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers'
import { SpeedInsights } from "@vercel/speed-insights/next"
import "react-loading-skeleton/dist/skeleton.css"
import "simplebar-react/dist/simplebar.min.css"
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/toaster'
import { Room } from '@/components/Room'
import { EditorContextProvider } from '@/components/editor/EditorContext'

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
          <EditorContextProvider>
            <head>
            {/* <meta name="google-adsense-account" content="ca-pub-1827922289519800"/> */}
            <meta name="google-site-verification" content="xqSq2gtf73XFTo_Z-8FEfgbwYD2xrJuZ8ityqXyGL4s" />
            </head>
          <body className={cn(
            'min-h-screen font-sans antialiased grainy',
            inter.className
          )}>
              <Toaster/>
              <Navbar/>
              {children}
              <SpeedInsights/>
              <Analytics />
            </body>
            </EditorContextProvider>
          </Providers>
    </html>
  )
}
