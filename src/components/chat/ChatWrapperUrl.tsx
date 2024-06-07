"use client"
import React, {useState, useEffect} from 'react'

import { ChatContextUrlProvider } from './ChatContextUrl'
import MessagesUrl from './MessagesUrl'
import ChatInputUrl from './ChatInputUrl'
interface ChatWrapperProps {
    fileId: string,
}

const ChatWrapperUrl = ({fileId}:ChatWrapperProps) => {
  return (
    <ChatContextUrlProvider fileId={fileId}>
          <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
            <div className='flex-1 justify-between flex flex-col mb-28'>
              <MessagesUrl fileId={fileId}/>
            </div>
            <ChatInputUrl/>
          </div>
    </ChatContextUrlProvider>
  )
}

export default ChatWrapperUrl