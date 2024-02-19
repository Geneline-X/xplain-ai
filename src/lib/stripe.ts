import { PLANS } from '@/config/stripe'
import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2023-10-16',
  typescript: true,
})

export async function getStripeUserSubscriptionPlan() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user?.id) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    }
  }

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  })

  if (!dbUser) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    }
  }

  const isSubscribed = Boolean(
    dbUser.monimeCustomerId &&
      dbUser.monimeCurrentPeriodsEnd && // 86400000 = 1 day
      dbUser.monimeCurrentPeriodsEnd.getTime() + 86_400_000 > Date.now()
  )

  const plan = isSubscribed
    ? PLANS.find((plan) => plan.price.priceIds.test === dbUser.monimeCustomerId)
    : null

  let isCanceled = false
  if (isSubscribed && dbUser.monimeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      dbUser.monimeSubscriptionId
    )
    isCanceled = stripePlan.cancel_at_period_end
  }

  return {
    ...plan,
    stripeSubscriptionId: dbUser.monimeSubscriptionId,
    stripeCurrentPeriodEnd: dbUser.monimeCurrentPeriodsEnd,
    stripeCustomerId: dbUser.monimeCustomerId,
    isSubscribed,
    isCanceled,
  }
}