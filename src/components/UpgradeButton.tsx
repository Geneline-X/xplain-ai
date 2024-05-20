"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { buttonVariants, Button } from './ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { trpc } from '@/app/_trpc/client';

type UpgradeButtonProps = {
  price:string 
}
const UpgradeButton = ({price}: UpgradeButtonProps) => {
      
      const { mutate: createMonimeSession, isLoading} = trpc.createMonimeSession.useMutation({
        onSuccess: (data) => {
           
            const url = data?.url ?? '/dashboard/billing';
             window.location.href = url;
        }
      })
  return (
    <Button
      onClick={() => {
        createMonimeSession({price});
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

export default UpgradeButton;
