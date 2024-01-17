"use client"

import React, { ReactNode, createContext, useState, useEffect, useRef } from 'react'
import { useToast } from '../ui/use-toast'
import { useMutation } from '@tanstack/react-query'
import { trpc } from '@/app/_trpc/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { text } from 'stream/consumers'

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

   const [messageRevertMonitor, setMessageRevertMonitor] = useState(false)
   const [isLoading, setIsLoading] = useState<boolean>(false)

   const utils = trpc.useContext()
   const { toast } = useToast()


   const backupMessage = useRef("")

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

        const decoder =  new TextDecoder()
        const reader = response?.body?.getReader();
        let accResponse = ''
        while (true) {
            const obj = await reader?.read();
            if (obj?.done) {
              break;
            }
            // Process the chunk (value) received from the server
            const chunkValue = decoder.decode(obj?.value);
            accResponse += chunkValue
            console.log("This is stream chuck message", accResponse)

            //// append chunck to message ////
            utils.getFileMessages.setInfiniteData(
                {fileId, limit: INFINITE_QUERY_LIMIT},
                (old) => {
                  if(!old) return {pages: [], pageParams: []}

                  let isAiResponseCreated = old.pages.some((page) => page.messages.some((message) => message.id === "ai-response"))
                  let updatedPages = old.pages.map((page) => {
                    if(page === old.pages[0]){
                        let updatedMessages

                        if(!isAiResponseCreated){
                           updatedMessages = [
                            {
                                createAt: new Date().toISOString(),
                                id: "ai-response",
                                text: accResponse,
                                isUserMessage: false
                            },
                            ...page.messages
                           ]
                        } else {
                            updatedMessages = page.messages.map((message) => {
                                if(message.id === "ai-response"){
                                    return {
                                        ...message,
                                        text: accResponse
                                    }
                                }
                                return message
                            })
                        }

                        return {
                            ...page,
                            messages: updatedMessages
                        }
                        
                    }
                    return page
                  })

                  return {...old, pages: updatedPages}
                }
            )
          }
          setMessageRevertMonitor(true)
        return response.body?.getReader()

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
            hasModelResponse: Boolean(message),
        }
    },
    onSuccess: async(stream) => {
     setIsLoading(false)
     if(!stream){
        return toast({
            title: "There was a problem sending this message",
            description: "Please refresh this page and try again",
            variant: "destructive"
        })
     }
    },
    onError: ({error,__, context}) => {
        if (!messageRevertMonitor) {
            // Revert local state only if there is no model response
            utils.getFileMessages.setData(
              { fileId },
              { messages: context?.previousMessages ?? [] }
            );
          }
            // utils.getFileMessages.setData(
            //     {fileId},
            //     {messages: context?.previousMessages ?? []}
            // )
      },
        onSettled: async() => {
            setIsLoading(false)

            await utils.getFileMessages.invalidate({fileId})
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