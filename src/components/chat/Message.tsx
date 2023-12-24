import { cn } from '@/lib/utils'
import { ExtendedMessage } from '@/types/message'
import React, { forwardRef } from 'react'
import { Icons } from '../Icons'
import ReactMarkdown from "react-markdown"
import { format } from 'date-fns'
interface MessageProps {
    message: ExtendedMessage
    isNextMesageSamePerson: boolean
}

const Message = forwardRef<HTMLDivElement, MessageProps>(({message, isNextMesageSamePerson}, ref) => {
  return (
  <div ref={ref} className={cn('flex items-end', {
    "justify-end": message.isUserMessage
  })}>
    <div className={cn("realtive flex h-6 w-6 aspect-square items-center", {
        "order-2 bg-orange-600 rounded-sm": message.isUserMessage,
        "order-1 bg-zinc-800 rounded-sm": !message.isUserMessage,
        invisible: isNextMesageSamePerson
    })}>
      {message.isUserMessage ? (
        <Icons.user className='fill-zinc-200 text-zinc-200 h-3/4 w-3/4'/>
      ) : (
        <Icons.logo className='fill-zinc-300 h-3/4 w-3/4'/>
      )}
    </div>
    <div className={cn('flex flex-col space-y-2 text-base max-w-md mx-2', {
        "order-1 items-end": message.isUserMessage,
        "order-2 items-start": !message.isUserMessage
    })}>
        <div className={cn("px-4 py-2 rounded-lg inline-block", {
            "bg-orange-600 text-black": message.isUserMessage,
            "bg-gray-200 text-gray-900" : !message.isUserMessage,
            "rounded-br-none": !isNextMesageSamePerson && message.isUserMessage,
            "rounded-bl-none": !isNextMesageSamePerson && !message.isUserMessage,
        })}>
           {typeof message.text === "string" ? (
            <ReactMarkdown className={cn("prose", {
                "text-zinc-50": message.isUserMessage
               })}>
                 {message.text}
               </ReactMarkdown>
           ): (
            message.text
           )}
           {message.id !== 'loadieng-message' ? (
            <div className={cn("text-xs select-none mt-2 w-full txt-right", {
                "text-zinc-500": !message.isUserMessage,
                "text-orange-300": message.isUserMessage,
            })}>
                {format(new Date(message.createAt), "HH:mm")}
            </div>
           ): null}
        </div>
    </div>
  </div>
  )
})

Message.displayName = 'Message';

export default Message