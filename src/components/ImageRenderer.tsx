"use client"
import React, { useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Plus, Minus, RotateCw, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useToast } from './ui/use-toast'
import { Button } from './ui/button'
import { Input } from './ui/input'
import SimpleBar from "simplebar-react"
import Image from 'next/image'

interface ImageRendererProps {
  url: string;
}

const ImageRenderer = ({ url }: ImageRendererProps) => {
  const { toast } = useToast()
  const [rotation, setRotation] = useState<number>(0)
  const [zoom, setZoom] = useState<number>(1)

  const handleRotateClockwise = () => {
    setRotation(prev => prev + 90)
  }

  const handleRotateCounterClockwise = () => {
    setRotation(prev => prev - 90)
  }

  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(event.target.value))
  }

  return (
    <div className='w-full bg-white rounded-md flex flex-col items-center'>
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button onClick={handleRotateClockwise} variant="ghost" aria-label='rotate clockwise'>
            <RotateCw className='h-4 w-4' />
          </Button>
          <Button onClick={handleRotateCounterClockwise} variant="ghost" aria-label='rotate counterclockwise'>
            <RotateCcw className='h-4 w-4' />
          </Button>
        </div>

        <div className='flex items-center space-x-[.2px]'>
          <ZoomIn className='h-4 w-4' />
          <Input
            type="range"
            min={0}
            max={4}
            step="0.1"
            value={zoom}
            onChange={handleZoomChange}
            className="w-24 h-8 m-0 p-0"
          />
          <ZoomOut className='h-4 w-4' />
        </div>
      </div>

      <div className='flex-1 w-full max-h-screen'>
        <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)]'>
          <div className='relative w-full h-full'>
            <TransformWrapper
             limitToBounds= {false}
              initialScale={zoom}
              onZoom={(ref) => setZoom(ref.state.scale)}
            >
              <TransformComponent>
                <Image
                  src={url}
                  alt="Rendered content"
                  style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
                  className='w-full h-auto p-3'
                  width={800}
                  height={800}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
        </SimpleBar>
      </div>
    </div>
  )
}

export default ImageRenderer
