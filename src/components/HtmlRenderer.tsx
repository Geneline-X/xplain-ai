"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCw, Search } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useForm } from "react-hook-form";
import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import SimpleBar from "simplebar-react";
import DOMPurify from 'dompurify';

interface HtmlRendererProps {
  htmlContent: string;
}

const HtmlRenderer = ({ htmlContent }: HtmlRendererProps) => {
  const { toast } = useToast();
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const contentArray = htmlContent.split('<!-- PAGE_BREAK -->'); // Assuming you use this to separate pages in HTML
  const numPages = contentArray.length;
  const sanitizedContent = DOMPurify.sanitize(contentArray[currentPage - 1]);
  const CustomPageValidator = z.object({
    page: z.string().refine((num) => Number(num) > 0 && Number(num) <= numPages)
  });

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>;

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<TCustomPageValidator>({
    defaultValues: { page: "1" },
    resolver: zodResolver(CustomPageValidator)
  });

  const handlePageSubmit = ({ page }: TCustomPageValidator) => {
    setCurrentPage(Number(page));
    setValue("page", String(page));
  };

  return (
    <div className='w-full bg-white rounded-md flex flex-col items-center'>
      <div className="h-14 w-full border-b border-zic-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button
            onClick={() => {
              setCurrentPage((prev) => (prev - 1 > 1 ? prev - 1 : 1));
              setValue("page", String(currentPage - 1));
            }}
            disabled={currentPage <= 1}
            variant="ghost"
            aria-label='previous page'>
            <ChevronDown className='h-4 w-4' />
          </Button>

          <div className='flex items-center gap-1.5'>
            <Input
              {...register("page")}
              className={cn("w-12 h-8", errors.page && "focus-visible:ring-blue-500")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(handlePageSubmit)();
                }
              }}
            />
            <p className="text-zinc-700 text-sm space-x-1">
              <span>/</span>
              <span>{numPages}</span>
            </p>
          </div>

          <Button
            onClick={() => {
              setCurrentPage((prev) => (prev + 1 > numPages ? numPages : prev + 1));
              setValue("page", String(currentPage + 1));
            }}
            disabled={numPages === undefined || currentPage === numPages}
            variant="ghost"
            aria-label='next page'>
            <ChevronUp className='h-4 w-4' />
          </Button>
        </div>

        <div className='flex items-center space-x-[.2px]'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className='gap-1' aria-label='zoom' variant="ghost">
                <Search className='h-3 w-3' />
                {scale * 100}%<ChevronDown className='h-3 w-3 opacity-50' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setScale(1)}>100%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(1.5)}>150%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2)}>200%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2.5)}>250%</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setRotation((prev) => prev + 90)} variant='ghost' aria-label='rotate 90 degrees'>
            <RotateCw className='h-3 w-3' />
          </Button>
        </div>
      </div>

      <div className='flex-1 w-full max-h-screen'>
        <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)]'>
          <div className='p-4' style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, transformOrigin: 'top left' }}>
            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
          </div>
        </SimpleBar>
      </div>
    </div>
  );
}

export default HtmlRenderer;
