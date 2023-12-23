import React, { useContext, useRef } from 'react'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Send } from 'lucide-react'
import { ChatContex } from './ChatContext'

interface ChatInputProps {
    isDisabled?: boolean
}

const ChatInput = ({isDisabled} : ChatInputProps) => {

    const { addMessage, handleInputChange, isLoading, message} = useContext(ChatContex)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
  return (
    <div className='absolute bottom-0 left-0 w-full'>
        <form className='mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl'>
            <div className='relative flex h-full flex-1 items-stretch md:flex-col'>
               <div className='relative flex flex-col w-full flex-grow p-4'>
                 <div className='relative'>
                    <Textarea 
                    placeholder='Enter your question...'
                    rows={1}
                    ref={textareaRef!}
                    onChange={handleInputChange}
                    value={message}
                    maxRows={4}
                    autoFocus
                    onKeyDown={(e) => {
                        if(e.key === "Enter" && !e.shiftKey){
                            e.preventDefault()
                            addMessage()
                            textareaRef.current?.focus()

                        } 
                    }}
                    className='resize-none pr-12 text-base py-3 scrollbar-thumb-orange scrollbar-thumb-rounded scroll-track-orange-lighter scrollbar-w-2 scrolling-touch'
                    />
                    <Button
                    disabled={isLoading || isDisabled}
                     className='absolute bottom-1.5 right-[8px]' 
                     aria-label='send message'
                     type='submit'
                     onClick={() => {
                        addMessage()

                        textareaRef.current?.focus()
                     }}
                     >
                        <Send className='h-4 w-4'/>
                    </Button>
                 </div>
               </div>
            </div>
        </form>
    </div>
  )
}

export default ChatInput