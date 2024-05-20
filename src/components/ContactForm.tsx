"use client"
import React, { useState } from 'react'
import MaxWidthWrapper from './MaxWidthWrapper'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
 
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader } from './ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from './ui/use-toast'
import { Resend } from 'resend';
import EmailTemplate from './EmailTemplate'

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Invalid email format.",
  }),
  detail: z.string().min(10, {
    message: "Detail must be at least 10 characters.",
  }),
})

interface Props {}

const ContactForm = () => {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          name: "",
          email: "",
          detail: ""
        },
      })

      const onSubmit = async(values: z.infer<typeof formSchema>) => {
        try {
           
            const response = await fetch("/api/receive-email-from-users", {
                method: "POST",
                body: JSON.stringify(values)
            })
            
            if(!response.ok){
                toast({
                   title: "Error Occured while submiting please try again",
                   variant: "destructive"
                })
                return
            }else{
                toast({
                    title: "Query Sent, We will reach soon!!",
                    variant: "default"
                 })
                 form.reset()
            }

        } catch (error) {
            console.log(error)
            toast({
                title: "Error Occured while submiting please try again",
                description: "",
                variant: "destructive"
             })
        }
      }
    const handleKeyPress = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission behavior
        form.handleSubmit(onSubmit)(); // Manually trigger form submission
    }
    };

  return (
    <MaxWidthWrapper>
            <Card className="shadow-md">
                <CardHeader className='flex justify-center text-center text-3xl font-semibold'>Contact Us</CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} onKeyPress={handleKeyPress} className="space-y-8">
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Full Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Email Address" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="detail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Queries or Details</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Please enter your queries or details" minRows={5} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? (
                                <Loader2 color='blue' className='h-5 w-5 animate-spin' />
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
    </MaxWidthWrapper>
  )
}

export default ContactForm
