"use client"

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '../ui/use-toast';

const UrlInput = () => {
  const [url, setUrl] = useState<string>('');
  const [name, setName] = useState<string>(''); // New state for name/tag
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'url') {
      setUrl(e.target.value);
    } else if (e.target.name === 'name') {
      setName(e.target.value);
    }
  };

  const router = useRouter()
  const handleButtonUrlClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/url-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, name }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Response from backend:', data);
        router.push(`/dashboard/url-image-chat/${data.urlFileId}`); // Redirect to the chat page
      } else {
        console.error('Error:', data);
        toast({
            title: "Error Occured",
            description: "Probably the website is Blocking you",
            variant: "destructive"
        })
      }
    } catch (error) {
        toast({
            title: "Error Occured",
            description: "Probably the website is Blocking you",
            variant: "destructive"
        })
      console.error('Error:', error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center mt-8'>
      <h1 className='mb-4 text-2xl font-bold'>Websites Chat</h1>
      <div className='flex flex-col space-y-2'>
        <Input
          type='text'
          name='url'
          placeholder='Enter URL...'
          value={url}
          onChange={handleInputChange}
          className='w-64 px-4 py-2 border border-gray-300 rounded-md'
        />
        <Input
          type='text'
          name='name'
          placeholder='Enter Tag...'
          value={name}
          onChange={handleInputChange}
          className='w-64 px-4 py-2 border border-gray-300 rounded-md'
        />
        <Button
          onClick={handleButtonUrlClick}
          disabled={isLoading}
          className='flex items-center px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600'
        >
          {isLoading ? (
            <Send className='h-4 w-4 animate-spin' />
          ) : (
            <>
              <Send className='h-4 w-4 mr-2' />
              Submit
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UrlInput;
