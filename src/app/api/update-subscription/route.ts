import { db } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { mainMonimeSessionData } from '@/trpc';
import { v4 } from 'uuid'
import { getMainMonimeSessionData } from '@/lib/utils';
import { addHoursToDate } from '@/lib/elegance';

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    // 1. Access Payment Data:
        
    const body = await req.json()

    const { price } = body

      const monimeSessionData = await getMainMonimeSessionData()
      console.log("this is the session data in the post ", monimeSessionData)

      console.log("this is the stored monimedata ", monimeSessionData)
      // Extract relevant data from Monime response
      const monimeUrl = monimeSessionData?.success ? monimeSessionData.result.checkoutUrl : null;
    
      // Convert createTime to a Date object when they hit the end point
      const createTime = new Date();
    
      // Set the subscription period in hours (adjust as needed)
      const subscriptionPeriodHours = 
                 price === "100" ? 3 : 
                 price === "2000" ? 24 : 
                 price === "5000" ? 168 : 0; // 1 hour for example
    
      // Calculate the end time by adding the subscription period to the createTime
      const subscriptionEndTime = addHoursToDate(createTime, subscriptionPeriodHours)
      console.log("this is the subscription end time: ", subscriptionEndTime)
      const newUser = await db.user.update({
        where: { id: monimeSessionData?.userId },
        data: {
          monimeSessionId: mainMonimeSessionData.success ? mainMonimeSessionData.result.id : null,
          monimeCustomerId: monimeSessionData.userId,
          monimeCurrentPeriodsEnd: subscriptionEndTime,
          monimeSubscriptionId: monimeSessionData.userId,
          monimeUrl,
        
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
