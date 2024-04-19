"use client"
import React, { useEffect } from 'react';
import Link from 'next/link';
import { buttonVariants, Button } from './ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { trpc } from '@/app/_trpc/client';

const UpgradeButtonStripe = () => {
      
      const { mutate: createStripeSession, isLoading} = trpc.createStripeSession.useMutation({
        onSuccess: (data) => {
            const url = data?.url ?? '/dashboard/billing';
             window.location.href = url;
        }
      })
  return (
    <Button
      onClick={() => {
        createStripeSession();
      }}
      disabled={isLoading}
      className='w-full'
    >
      {isLoading ? (
        <Loader2 className='h-4 w-4 animate-spin'/>
      ) : 'Upgrade now'} <ArrowRight className='h-5 w-5 ml-1.5' />
       </Button>
  );
};

export default UpgradeButtonStripe;
