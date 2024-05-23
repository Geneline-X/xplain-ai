import { db } from '@/db';
import { PrivateProcedure, publicProcedure, router } from './trpc';
 import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { TRPCError } from "@trpc/server"
import { z } from 'zod';
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
import { absoluteUrl, setMainMonimeSessionData } from '@/lib/utils';
import { getUserSubscriptionPlan, } from '@/lib/monime';
import { getStripeUserSubscriptionPlan, stripe } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';
import { v4 } from 'uuid'
interface KindeUser {
    id: string;
    email: string;
}

let mainMonimeSessionData:any = {}

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

  updateUserDataCancelSub: PrivateProcedure.mutation(async({ctx}) =>{
    const { userId } = ctx

    if(!userId) throw new TRPCError({code: "UNAUTHORIZED"})

    const dbUser = await db.user.findFirst({
        where: {
            id: userId
        }
    })

    if(!dbUser) throw new TRPCError({code: "UNAUTHORIZED"})

      const newUser = await db.user.update({
        where: { id: userId },
        data: {
          monimeCurrentPeriodsEnd: "",
          monimeSubscriptionId: ""
        },
      });
    
      console.log('This is the new updated user', newUser);

  }),
  createStripeSession: PrivateProcedure.mutation(async({ctx}) => {
    const { userId } = ctx

    if(!userId) throw new TRPCError({code: "UNAUTHORIZED"})

    const billingUrl = 'https://cph-nine.vercel.app/dashboard'
    const dbUser = await db.user.findFirst({
        where: {
            id: userId
        }
    })

    if (!dbUser) throw new TRPCError({ code: 'UNAUTHORIZED' })

    const subscriptionPlan = await getStripeUserSubscriptionPlan()

    if (
      subscriptionPlan.isSubscribed &&
      dbUser.monimeCustomerId
    ) {
      const stripeSession =
        await stripe.billingPortal.sessions.create({
          customer: dbUser.monimeCustomerId,
          return_url: `${billingUrl}/billing`,
        })

      return { url: stripeSession.url }
    }

    const stripeSession =
      await stripe.checkout.sessions.create({
        success_url: billingUrl,
        cancel_url: billingUrl,
        payment_method_types: ['card', 'paypal'],
        mode: 'subscription',
        billing_address_collection: 'auto',
        line_items: [
          {
            price: PLANS.find(
              (plan) => plan.name === 'Pro'
            )?.price.priceIds.test,
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId,
        },
      })

    return { url: stripeSession.url }
  }),
  createMonimeSession: PrivateProcedure.input(z.object({
    price: z.string() || z.null()
  })).mutation(async({ctx, input}) => {
    const { userId } = ctx
    const { price } = input
 
    console.log("this is the price ", price)

    if(!userId) throw new TRPCError({code: "UNAUTHORIZED"})

    const dbUser = await db.user.findFirst({
        where: {
            id: userId
        }
    })

    if(!dbUser) throw new TRPCError({code: "UNAUTHORIZED"})

    
    const subscriptionPlan = await getUserSubscriptionPlan()

    console.log("this is the subscription plan ",subscriptionPlan)
    if (!subscriptionPlan.isSubscribed) {
        // Use Monime API to create a checkout session
         try {
            const idempotencyKey = v4();
            const monimeSessionResponse = await fetch('https://api.monime.space/v1/checkout-sessions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Monime-Space-Id': 'spc-QcPL6aSJ38EDif4LRf9X23FV2',
                  'Authorization': `Bearer ${process.env.MONIME_ACCESS_TOKEN}`,
                  'X-Idempotency-Key': idempotencyKey
                },
                body: JSON.stringify({
                  clientReference: userId,
                  callbackUrlState: dbUser.id,
                  bulk: {
                    amount: {
                      "currency": "SLE",
                      "value": price
                    }
                  },
                  //${process.env.CPH_REDIRECT_URL}
                  cancelUrl:  `http://localhost:3000/api/monime-redirect-cancel?price=${price}`,
                  receiptUrl:  `http://localhost:3000/api/monime-redirect?price=${price}&monimeSessionId=${idempotencyKey}&userId=${dbUser.id}`
                }),
              });

              const monimeSessionData = await monimeSessionResponse.json();
              console.log("this is the session data ", monimeSessionData)
              mainMonimeSessionData = monimeSessionData
              await setMainMonimeSessionData({monimeSessionData, userId})
               // Extract relevant data from Monime response
              const monimeUrl = monimeSessionData.success ? monimeSessionData.result.checkoutUrl : null;
              
              return { url: monimeUrl }; 
         } catch (error) {
            console.log(error)
        }
 } 
}),

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
 
export { mainMonimeSessionData }
export type AppRouter = typeof appRouter;