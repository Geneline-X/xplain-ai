import { PLANS } from '@/config/stripe'
import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

export async function getUserSubscriptionPlan() {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
  
    if (!user?.id) {
      return {
        ...PLANS[0],
        isSubscribed: false,
        isCanceled: false,
        monimeCurrentPeriodsEnd: null,
      };
    }
  
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });
  
    if (!dbUser) {
      return {
        ...PLANS[0],
        isSubscribed: false,
        isCanceled: false,
        monimeCurrentPeriodsEnd: null,
      };
    }
  
    const isSubscribed = Boolean(
      dbUser.monimeSubscriptionId &&
        dbUser.monimeCurrentPeriodsEnd &&
        new Date(dbUser.monimeCurrentPeriodsEnd).getTime() > Date.now()
    );
  
    const plan = isSubscribed
      ? PLANS.find((p) => p.name === "Pro") // Adjust based on your plans
      : null;
  
    return {
      ...plan,
      monimeSubscriptionId: dbUser.monimeSubscriptionId,
      monimeCurrentPeriodsEnd: dbUser.monimeCurrentPeriodsEnd,
      monimeCustomerId: dbUser.monimeCustomerId,
      isSubscribed,
      isCanceled: false, // Assume not canceled since there's no specific Monime API endpoint for it
    };
  }
  