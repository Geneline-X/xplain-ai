"use client"
import React, { useState, useRef } from 'react'
import ReactPlayer from 'react-player'
import { Play, Pause, Volume2 } from 'lucide-react'
import { useToast } from './ui/use-toast'
import { Button } from './ui/button'
import { Input } from './ui/input'
import SimpleBar from "simplebar-react"

interface VideoRendererProps {
  url: string;
}

const VideoRenderer = ({ url }: VideoRendererProps) => {
  const { toast } = useToast()
  const [playing, setPlaying] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(0.8)
  const [played, setPlayed] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [seeking, setSeeking] = useState<boolean>(false)

  const playerRef = useRef<ReactPlayer>(null)

  const handlePlayPause = () => {
    setPlaying(!playing)
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(event.target.value))
  }

  const handleSeekMouseDown = () => {
    setSeeking(true)
  }

  const handleSeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(event.target.value))
  }

  const handleSeekMouseUp = (event: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false)
    playerRef.current?.seekTo(parseFloat(event.currentTarget.value))
  }

  const handleProgress = (state: { played: number }) => {
    if (!seeking) {
      setPlayed(state.played)
    }
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  return (
    <div className='w-full bg-white rounded-md flex flex-col items-center'>
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button onClick={handlePlayPause} variant="ghost" aria-label='play/pause'>
            {playing ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
          </Button>

          <Input
            type="range"
            min={0}
            max={1}
            step="any"
            value={played}
            onMouseDown={handleSeekMouseDown}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            className="w-32 h-8 m-0 p-0"
          />
          <p className="text-zinc-700 text-sm space-x-1">
            <span>{Math.round(played * duration)}</span>
            <span>/</span>
            <span>{Math.round(duration)}</span>
          </p>
        </div>

        <div className='flex items-center space-x-[.2px]'>
          <Volume2 className='h-4 w-4' />
          <Input
            type="range"
            min={0}
            max={1}
            step="any"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-8 m-0 p-0"
          />
        </div>
      </div>

      <div className='flex-1 w-full max-h-screen'>
        <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)]'>
          <div className='relative w-full h-full'>
            <ReactPlayer
              ref={playerRef}
              url={url}
              playing={playing}
              volume={volume}
              onProgress={handleProgress}
              onDuration={handleDuration}
              width='100%'
              height='100%'
              style={{ objectFit: 'contain' }}
            />
          </div>
        </SimpleBar>
      </div>
    </div>
  )
}

export default VideoRenderer
