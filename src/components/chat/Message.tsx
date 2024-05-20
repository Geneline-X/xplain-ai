"use client"
import { cn } from '@/lib/utils'
import { ExtendedMessage } from '@/types/message'
import React, { forwardRef } from 'react'
import { Icons } from '../Icons'
import ReactMarkdown from "react-markdown"
import { format } from 'date-fns'
import CopyToClipboard from 'react-copy-to-clipboard';
import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // You can choose other styles as well
import rehypeRaw from 'rehype-raw';
import { Copy } from 'lucide-react'
import remarkGfm from 'remark-gfm';


// const renderers = {
//   code: ({ language='python', value }:any) => {
//     return (
//       <SyntaxHighlighter language={language} style={dark}>
//         {value}
//       </SyntaxHighlighter>
//     );
//   },
// };

// const processMessage = (message:string) => {
//   const processedHtml = remark()
//     .use(remarkGfm)
//     .use(rehypeHighlight)
//     .processSync(message)
//     .toString();

//   return processedHtml;
// };

interface MessageProps {
    message: ExtendedMessage
    isNextMesageSamePerson: boolean
}

const Message = forwardRef<HTMLDivElement, MessageProps>(({message, isNextMesageSamePerson}, ref) => {
  
  const [isCopied, setIsCopied] = useState(false);


  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500); // Reset the copy state after 1.5 seconds
  };

  const currentTime = new Date();
 const formattedTime = `${currentTime.getHours()}:${currentTime.getMinutes().toString().padStart(2, '0')}`;


  return (
  <div ref={ref} className={cn('flex items-end', {
    "justify-end": message.isUserMessage
  })}>
  
    <div className={cn("realtive flex h-6 w-6 aspect-square items-center", {
        "order-2 bg-blue-500 rounded-sm": message.isUserMessage,
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
            "bg-blue-500 text-black": message.isUserMessage,
            "bg-gray-200 text-gray-900" : !message.isUserMessage,
            "rounded-br-none": !isNextMesageSamePerson && message.isUserMessage,
            "rounded-bl-none": !isNextMesageSamePerson && !message.isUserMessage,
        })}>
           {typeof message.text === "string" ? (
            <ReactMarkdown className={cn("prose", {
                "text-zinc-50": message.isUserMessage
               })} 
               remarkPlugins={[remarkGfm]}
               components={{
                a: ({ node, ...props }) => (
                  <a {...props} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                    {props.children}
                  </a>
                ),
                
                }}
               >
                 {message.text}
               </ReactMarkdown>
           ): (
            message.text
           )}
           {message.id !== 'loading-message' ? (
            <>
            <div className={cn("text-xs select-none mt-2 w-full txt-right", {
                "text-zinc-500": !message.isUserMessage,
                "text-blue-300": message.isUserMessage,
            })}>
                {formattedTime}
            </div>
            <div className='flex justify-end'>
              <CopyToClipboard text={message.text as string} onCopy={handleCopy}>
                <button className={cn('text-xs flex cursor-pointer focus:outline-none',{
                  "text-blue-400":!message.isUserMessage,
                  "text-zinc-100": message.isUserMessage,
                })}>
                  {isCopied ? 'Copied!' : (
                  <>
                    <Copy className='mr-2 w-4 h-4'/>Copy
                  </>
                  )}
                </button>
              </CopyToClipboard>
            </div>
            </>
            
           ): null}
        </div>
    </div>
  </div>
  )
})

Message.displayName = 'Message';

export default Message