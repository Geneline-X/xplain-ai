"use client"
import React from 'react'
import { useOthers, useUpdateMyPresence } from '../../liveblocks.config'

interface Props {}

const SomeOneIsTyping = () => {

    const someOneIsTyping = useOthers().some((user) => user.presence.isTyping)
  return <div></div>
}

export default SomeOneIsTyping