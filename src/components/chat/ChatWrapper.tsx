"use client"
import React, {useState, useEffect} from 'react'
import Messages from './Messages'
import ChatInput from './ChatInput'
import { trpc } from '@/app/_trpc/client'
import { ChevronLeft, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '../ui/button'
import { ChatContextProvider } from './ChatContext'

// import { RoomProvider } from '../../../liveblocks.config'
// import { ClientSideSuspense } from '@liveblocks/react'
// import { Liveblocks } from "@liveblocks/node";
//import { liveblocks } from '../../../liveblocks.config'

interface ChatWrapperProps {
  fileId: string,
}

const ChatWrapper = ({fileId}:ChatWrapperProps) => {
  const [messages, setMessages] = useState([]); // State for chat history

  const { data, isLoading} = trpc.getFileUploadStatus.useQuery({
    fileId,
  }, {
    refetchInterval: (data) => 
      data?.status === 'SUCCESS' || data?.status === 'FAILED' ? false : 500
  })

  // const room = liveblocks.createRoom(`document-${fileId}`, {
  //   defaultAccesses: 
  // });
  
  
  if(isLoading) return (
    <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
      <div className='flex-1 flex justify-center items-center flex-col mb-28'>
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-8 w-8 text-blue-400 animate-spin'/>
          <h3 className='font-semibold text-xl'>Loading...</h3>
          <p className='text-zinc-500 text-sm'>
            We&apos;re preparing your PDF.
          </p>
        </div>
      </div>
      
      <ChatInput isDisabled/>
    </div>
  )

  // useEffect(() => {
  //   // Fetch initial chat history (if needed)
  //   // ...

  //   const messageSubscription = room.subscribe(
  //     'chat-messages', // State key
  //     (newMessages:any) => setMessages((prevMessages) => [...prevMessages, ...newMessages])
  //   );

  //   return () => messageSubscription.unsubscribe(); // Cleanup subscription on unmount
  // }, [room]);

  // const sendMessage = (message) => {
  //   room.patch('chat-messages', (currentMessages) => [...currentMessages, {
  //     userId: /* Your user ID */, // Get user ID from authentication logic
  //     timestamp: Date.now(),
  //     content: message,
  //   }]);
  // };

const CustomQuestions = () => {

  const customQuestions = [
    "What is the main topic of the PDF?",
    "How many pages does the PDF have?",
    "Is there a table of contents?",
    // Add more questions as needed
  ];

  return (
    <div className="mb-4">
      <h2 className="font-semibold text-lg mb-2">Common Questions</h2>
      <ul className="space-y-2">
        {customQuestions.map((question, index) => (
          <li key={index} className="text-gray-600">{question}</li>
        ))}
      </ul>
    </div>
  );
  
}

  return (
      <ChatContextProvider fileId={fileId}>
          <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
            <div className='flex-1 justify-between flex flex-col mb-28'>
              <Messages fileId={fileId}/>
            </div>
            <ChatInput/>
          </div>
      </ChatContextProvider>
  )
}

export default ChatWrapper