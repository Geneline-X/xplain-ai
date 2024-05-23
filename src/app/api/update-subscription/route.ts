import { db } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

import { mainMonimeSessionData } from '@/trpc';
import { v4 } from 'uuid'
import { getMainMonimeSessionData } from '@/lib/utils';
import { addHoursToDate } from '@/lib/elegance';
import { TRPCError } from '@trpc/server';

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    // 1. Access Payment Data:
        
    const body = await req.json()

    const { price, monimeSessionId, userId } = body

      if(!userId && price && monimeSessionId){
        throw new TRPCError({code: "UNAUTHORIZED"})
      }
      
      // Convert createTime to a Date object when they hit the end point
      const createTime = new Date();
    
      // Set the subscription period in hours (adjust as needed)
      const subscriptionPeriodHours = 
                 price === "500" ? 3 : 
                 price === "2000" ? 24 : 
                 price === "5000" ? 168 : 0; // 1 hour for example
    
      // Calculate the end time by adding the subscription period to the createTime
      const subscriptionEndTime = addHoursToDate(createTime, subscriptionPeriodHours)
      console.log("this is the subscription end time: ", subscriptionEndTime)

      const newUser = await db.user.update({
        where: { id: userId },
        data: {
          monimeSessionId: monimeSessionId,
          monimeCustomerId: userId,
          monimeCurrentPeriodsEnd: subscriptionEndTime,
          monimeSubscriptionId: userId,
          currentPrice: price
        },
      });

      console.log('This is the new updated user', newUser);
    // 3. Redirect to Desired Page: 
    console.log("this is near the redirecting")
    return new Response(JSON.stringify({message: "subscription successfull"}))
   
} catch (error) {
    // 4. Error Handling:
    console.error('updating subscription: ', error);
    return new Response(JSON.stringify({message: error}), {status: 500})// Send a specific error message
  }
}
