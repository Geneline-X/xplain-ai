"use client"
import { trpc } from '@/app/_trpc/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { Loader2, MessageSquare } from 'lucide-react'
import React, { useContext, useEffect, useRef, useCallback } from 'react'
import Skeleton from 'react-loading-skeleton'
import Message from './Message'
import { ChatContex } from './ChatContext'
import { ChatContexUrl } from './ChatContextUrl'
import { useIntersection } from "@mantine/hooks"
import { useEditorContent } from '../editor/EditorContext'

interface MessagesProps {
  fileId: string
}

const MessagesUrl = ({fileId}: MessagesProps) => {
  
  const { editorContent, updateEditorContent } = useEditorContent();

  useEffect(() => {
    if (editorContent.fileId !== fileId) {
      updateEditorContent({ fileId });
    }
  }, [fileId, editorContent.fileId, updateEditorContent]);

  let { isLoading: isAiThinking, addMessage, message,setMessage } = useContext(ChatContexUrl)
  const {data, isLoading, fetchNextPage} = trpc.getUrlFileMessages.useInfiniteQuery({
    urlfileId: fileId,
    limit: INFINITE_QUERY_LIMIT,
  }, {
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    keepPreviousData: true
  })

  const messages = data?.pages.flatMap((page) => page.messages)

  const loadingMessage = {
    createAt: new Date().toISOString(),
    id: 'loading-message',
    isUserMessage: false,
    text: (
      <span className='flex h-full items-center justify-center'>
        <Loader2 className='h-4 w-4 animate-spin'/>
      </span>
    )
  }
  const combinedMessages = [
    ...(isAiThinking ? [loadingMessage] : []),
    ...(messages ?? [])
  ]

  const lastMessageRef = useRef<HTMLDivElement>(null)

  const { ref, entry} = useIntersection({
    root: lastMessageRef.current,
    threshold: 1
  })

  useEffect(() => {
    if(entry?.isIntersecting){
      fetchNextPage()
    }
  }, [entry, fetchNextPage])

  const actionRef = useRef<string | null>(null);

  useEffect(() => {
    if (actionRef.current) {
      addMessage();
      actionRef.current = null;
    }
  }, [message, addMessage]);

  const handleActionClick = useCallback((actionType: string) => {
    let predefinedMessage;
    switch (actionType) {
      case 'summary':
        predefinedMessage = 'Please summarize the website.';
        break;
      case 'questions':
        predefinedMessage = 'Generate possible questions based on the website.';
        break;
      case 'keyPoints':
        predefinedMessage = 'Extract key points from the website.';
        break;
      default:
        return;
    }
    actionRef.current = predefinedMessage;
    setMessage(predefinedMessage);
  }, [setMessage]);

  return (
    <div className='flex max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch whitespace-normal break-words'>
      {// combinedMessages && combinedMessages.length > 0
        combinedMessages && combinedMessages.length > 0 ? (
          combinedMessages.map((message, i) => {

            const isNextMessageSamePerson = combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage

            if(i === combinedMessages.length - 1){
              return <Message
                ref={ref}
                message={message}
               isNextMesageSamePerson={isNextMessageSamePerson} 
               key={message.id}
               />
            } else{
              return <Message 
              message={message}
              isNextMesageSamePerson={isNextMessageSamePerson} 
              key={message.id}
              />
            }
          }) 
          //isLoading 
        ) : isLoading? (
            <div className='w-full flex-col gap-2'>
                <Skeleton className='h-16'/>
                <Skeleton className='h-16'/>
                <Skeleton className='h-16'/>
                <Skeleton className='h-16'/>
            </div>
        ) : (
          <div className='flex-1 flex flex-col items-center justify-center gap-2'>
          <MessageSquare className='h-8 w-8 text-blue-400'/>
          <h3 className='font-semibold text-xl'>You&apos;re all set!</h3>
          <p className='text-zinc-500 text-sm'>
            Ask your first question to get started, or try one of the actions below:
          </p>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => handleActionClick('summary')}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded shadow hover:bg-blue-600 transition duration-200"
            >
              Summary
            </button>
            <button
              onClick={() => handleActionClick('questions')}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded shadow hover:bg-blue-600 transition duration-200"
            >
              Possible Questions
            </button>
            <button
              onClick={() => handleActionClick('keyPoints')}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded shadow hover:bg-blue-600 transition duration-200"
            >
              Key Points
            </button>
          </div>          
        </div>
        )}
    </div>
  )
}

export default MessagesUrl