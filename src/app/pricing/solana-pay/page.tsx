"use client"

import React, { useState, useRef, useEffect } from 'react';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import axios from 'axios';
import { Keypair } from "@solana/web3.js"
import { createQRCode } from '@/lib/solana-pay-utils/createQrCode';
import { checkTransaction } from '@/lib/solana-pay-utils/checkTransaction';

interface Props {}

const Page = () => {

    const qrRef = useRef<HTMLDivElement>(null)
    const [reference, setReference] = useState(Keypair.generate().publicKey)
    const [urlFrom, setUrlFrom] = useState<string>("")
    //Create the QR code when the `reference` changes
    useEffect(() => {
        createQRCode(qrRef, reference, urlFrom)
    }, [reference, urlFrom])

     // Periodically check the transaction status and reset the `reference` state variable once confirmed
    useEffect(() => {
        const interval = setInterval(() => {
        checkTransaction(reference, setReference)
        }, 1500)

        return () => {
        clearInterval(interval)
        }
    }, [reference])


    const fetchPaymentUrl = async (currency: string) => {
        try {
            //const response = await axios.post('/api/solana-generate-url',{  } );
            const response = await fetch("/api/solana-generate-url",{
                method: "POST",
                body: JSON.stringify({
                    currency, 
                    reference
                })
            })
            const data = await response.json()
            console.log("this is the data: ", data)
            const { url:urlFrom } = data
            setUrlFrom(urlFrom)
            createQRCode(qrRef, reference, urlFrom)
            
        } catch (error) {
            console.error('Error fetching payment URL:', error);
        }
    };

  return (
    <MaxWidthWrapper>
       <div className='flex justify-between mt-7'>
                <button onClick={() => fetchPaymentUrl('USDC')} className={buttonVariants({ className: "h-20" })}>
                    Pay with USDC
                </button>
                <button onClick={() => fetchPaymentUrl('SOL')} className={buttonVariants({ className: "h-20" })}>
                    Pay with SOL
                </button>
                <button onClick={() => fetchPaymentUrl('BONK')} className={buttonVariants({ className: "h-20" })}>
                    Pay with BONK
                </button>
        </div>

        <div className="mt-5 flex justify-between">
           <div ref={qrRef} />
        </div>
    </MaxWidthWrapper>
    
  )
}

export default Page