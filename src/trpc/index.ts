import { db } from '@/db';
import { PrivateProcedure, publicProcedure, router } from './trpc';
 import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { TRPCError } from "@trpc/server"
import { z } from 'zod';
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
import { absoluteUrl } from '@/lib/utils';
import { getUserSubscriptionPlan, } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';

interface KindeUser {
    id: string;
    email: string;
    
}
export const appRouter = router({
  authCallback: publicProcedure.query(async() => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    if(!user?.id || !user?.email){
        throw new TRPCError({code: "UNAUTHORIZED"})
    }

    // Check in the database
    const dbUser = await db.user.findFirst({
        where: {id: user.id}
    })
    if(!dbUser){
        //// create user in db
        await db.user.create({
            data: {
                id: user.id,
                email: user.email,
                
            }
        })
    }
    return { success: true}
  }),


  createMonimeSession: PrivateProcedure.mutation(async({ctx}) => {
    const { userId } = ctx

    // const billingUrl = absoluteUrl("/dashboard/billing")

    if(!userId) throw new TRPCError({code: "UNAUTHORIZED"})

    const dbUser = await db.user.findFirst({
        where: {
            id: userId
        }
    })

    if(!dbUser) throw new TRPCError({code: "UNAUTHORIZED"})

    const subscriptionPlan = await getUserSubscriptionPlan()

    console.log("this is the subscription plan ",subscriptionPlan)
    if (!subscriptionPlan.isSubscribed && !dbUser.monimeCustomerId) {
        // Use Monime API to create a checkout session
         try {
            const monimeSessionResponse = await fetch('https://api.monime.space/v1/checkout-sessions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Monime-Space-Id': '755247', // Replace with your Monime Space ID
                  'X-Idempotency-Key': dbUser.id
                  // Add any other necessary headers
                },
                body: JSON.stringify({
                  clientReference: userId, // You can use a unique identifier for your session
                  // Add other necessary parameters based on Monime docs
                  callbackUrlState: dbUser.id,
                  bulk: {
                    amount: {
                      "currency": "SLE",
                      "value": "100"
                    }
                  },
                  cancelUrl:  `https://${process.env.VERCEL_URL}/pricing` || 'http://localhost:3000/pricing',
                  receiptUrl: `https://${process.env.VERCEL_URL}/dashboard` || 'http://localhost:3000/dashboard'
                }),
              });

              const monimeSessionData = await monimeSessionResponse.json();
              console.log("this is the session data ", monimeSessionData)
              // Extract relevant data from Monime response
              const monimeUrl = monimeSessionData.success ? monimeSessionData.result.checkoutUrl : null;
          
             console.log("this is the monime url ", monimeUrl)
              // Update user model with Monime data
                 const newUser =  await db.user.update({
                      where: { id: userId },
                      data: {
                      monimeSessionId: monimeSessionData.success ? monimeSessionData.result.id : null,
                      monimeUrl,
                      // Add other relevant fields based on Monime response
                      },
                  });
      
                  console.log(newUser)
      
        return { url: monimeUrl }; 
         } catch (error) {
            console.log(error)
        }
 } 
}),

//   confirmPayment: PrivateProcedure.input(z.object({
//     userId:z.string(),
//     paymentToken: z.string()
//   })).,

  getFileMessages: PrivateProcedure.input(z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string()
  })).query(async({ctx, input}) => {
    const { userId } = ctx
    const { fileId, cursor} = input
    const limit = input.limit ?? INFINITE_QUERY_LIMIT

    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId
        }
    })

    if(!file) throw new TRPCError({code: "NOT_FOUND"})

    const messages = await db.message.findMany({
        take: limit + 1,
        where: {
            fileId
        },
        orderBy: {
            createAt: "desc"
        },
        cursor: cursor ? {id: cursor} : undefined,
        select: {
            id: true,
            isUserMessage: true,
            createAt: true,
            text: true
        }
    })

    let nextCursor: typeof cursor | undefined = undefined
    if(messages.length > limit){
        const nextItem = messages.pop()
        nextCursor = nextItem?.id
    }

    return {
        messages,
        nextCursor
    }
  }),

  getUserFiles: PrivateProcedure.query(async({ctx})=>{
    const { userId, user} = ctx
    return await db.file.findMany({
        where: {
            userId
        }
    })
  }),

  getFileUploadStatus: PrivateProcedure.input(z.object({fileId: z.string()})).query(async({input, ctx})=> {
     const file = await db.file.findFirst({
        where:{
            id: input.fileId,
            userId: ctx.userId
        }
     })

     if(!file) return {status: "PENDING" as const}
     return {status: file.uploadStatus}
  }),
  getFile: PrivateProcedure.input(z.object({key:z.string()}))
  .mutation(async({ctx, input}) => {
     const { userId } = ctx

     const file = await db.file.findFirst({
        where: {
            key: input.key,
            userId
        }
     })

     if(!file) throw new TRPCError({code: "NOT_FOUND"})
     return file
  }),

  deleteFile: PrivateProcedure.input(z.object({
    id: z.string()})
  ).mutation(async({ctx, input}) => {
   const { userId } = ctx

   const file = await db.file.findFirst({
    where: {
        id: input.id,
        userId
    }
   })

   if(!file) throw new TRPCError({code: "NOT_FOUND"})

   await db.file.delete({
    where: {
        id:input.id
    }
   })

   return file
  }),

});
 
export type AppRouter = typeof appRouter;