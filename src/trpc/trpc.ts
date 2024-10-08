import { TRPCError,initTRPC } from '@trpc/server';
 import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

const t = initTRPC.create();
 const middleware = t.middleware

const isAuth = middleware(async(options) => {
  const { getUser } = getKindeServerSession()
  const user  = await getUser()

  if(!user || !user.id){
    throw new TRPCError({code: "UNAUTHORIZED"})
  }

  return options.next({
    ctx:{
        userId:user?.id,
        user
      }
  })
  
})

export const router = t.router;
export const publicProcedure = t.procedure;
export const PrivateProcedure = t.procedure.use(isAuth);