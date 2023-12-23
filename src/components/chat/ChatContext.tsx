"use client"

import React, { ReactNode, createContext, useState } from 'react'
import { useToast } from '../ui/use-toast'
import { useMutation } from '@tanstack/react-query'

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

   const [isLoading, setIsLoading] = useState<boolean>(false)

   const { toast } = useToast()

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