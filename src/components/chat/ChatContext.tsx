"use client"
import React, { ReactNode, createContext, useState, useEffect, useRef } from 'react'
import { useToast } from '../ui/use-toast'
import { useMutation } from '@tanstack/react-query'
import { trpc } from '@/app/_trpc/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { text } from 'stream/consumers'
import { getBackgroundCompleted } from '@/lib/utils'

type StreamResponseType = {
    addMessage: () => void,
    message: string,
    handleInputChange: (event:React.ChangeEvent<HTMLTextAreaElement>) => void,
    isLoading: boolean
}

export const ChatContex = createContext<StreamResponseType>({
    addMessage: () => {},
    message: "",
    handleInputChange: () => {},
    isLoading: false
})

interface Props {
    fileId:string
    children: ReactNode
}
export const ChatContextProvider = ({fileId, children}: Props) => {
   const [message, setMessage] = useState<string>("")

   const [messageRevertMonitor, setMessageRevertMonitor] = useState(true)
   const [isLoading, setIsLoading] = useState<boolean>(false)

   const utils = trpc.useContext()
   const { toast } = useToast()


   const backupMessage = useRef("")
   const completeMessage = useRef<string>("")

   const {mutate: sendMessage} = useMutation({
    mutationFn: async ({message}: {message: string}) => {

        const response = await fetch("/api/message", {
            method: "POST",
            body: JSON.stringify({
                fileId,
                message
            }),
        })
        if(!response.ok){
            throw new Error("Failed to send message")
        }

         return response.body

    },
    ///// optimistic updates ///
    onMutate: async({message}) => {
      backupMessage.current = message
      setMessage("")

        ///// step 1////
       await utils.getFileMessages.cancel()

        //// step 2 ////
        const prevoiusMessage = utils.getFileMessages.getInfiniteData()
          
       
      //// step 3 /////
      utils.getFileMessages.setInfiniteData(
        {fileId, limit: INFINITE_QUERY_LIMIT},
        (old) => {
           if(!old) {
            return {
                pages: [],
                pageParams: []
            }
           }

           let newPages = [...old.pages]

           let latestPages = newPages[0]!

           latestPages.messages = [
            {
                createAt: new Date().toISOString(),
                id: crypto.randomUUID(),
                text: message,
                isUserMessage: true
            },
            ...latestPages.messages
           ]
           newPages[0] = latestPages

           return{
            ...old,
            pages: newPages
           }
        }
        )

        setIsLoading(true)
        return {
            previousMessages: prevoiusMessage?.pages.flatMap((page) => page.messages) ?? [],
        }
    },
    onSuccess: async(stream) => {
     
     if(!stream){
        return toast({
            title: "There was a problem sending this message",
            description: "Please refresh this page and try again",
            variant: "destructive"
        })
     }

     const reader = stream.getReader()
     const decoder = new TextDecoder()
     let done = false

     //accumulated response
     let accResponse = ""

     while(!done){
        const { value, done:doneReading } = await reader.read()
        done = doneReading
        const chunckValue = decoder.decode(value)

        accResponse += chunckValue

        /// append chunck to the actual message /////
        utils.getFileMessages.setInfiniteData({fileId, limit: INFINITE_QUERY_LIMIT}, 
            (old:any) => {
              if(!old) return { pages: [], pageParams: []}
            
              let isAiResponseCreated = old.pages.some((page:any) => page.messages.some((message:any) => message.id === 'ai-response'))
              let updatedPages = old.pages.map((page:any) => {
                if(page === old.pages[0]){
                    let updatedMessages 
                    if(!isAiResponseCreated){
                        updatedMessages = [
                            {
                                creatAt: new Date().toISOString(),
                                id:'ai-response',
                                text:accResponse,
                                isUserMessage: false
                            },
                            ...page.messages
                        ]
                    } else{
                        updatedMessages = page.messages.map((message:any) => {
                            if(message.id === 'ai-response'){
                                return {
                                    ...message,
                                    text: accResponse
                                }
                            }
                            return message
                        }
                      )
                    }

                    return {
                        ...page,
                        messages: updatedMessages
                    }
                }
                return page
              }
             )
             return {...old, pages: updatedPages}
            }
        )
    }  
    
    setIsLoading(false)
},
    onError: ({_,__, context}) => {
        setIsLoading(false)
         setMessage(backupMessage.current)
          utils.getFileMessages.setData(
            { fileId },
            { messages: context?.previousMessages ?? [] }
          );
       
    
      },
        onSettled: async() => {
          
            setIsLoading(false);
            await utils.getFileMessages.invalidate({ fileId });
           
        }
   })

   const addMessage = () => {
    sendMessage({message})
   }
   const handleInputChange = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
     setMessage(e.target.value)
   }

   return (
    <ChatContex.Provider value={{
        addMessage,
        message,
        handleInputChange,
        isLoading
    }}>
        {children}
    </ChatContex.Provider>
   )
}