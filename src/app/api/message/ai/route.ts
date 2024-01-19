import { db } from "@/db";
import { SendMessageValidators } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";


export const POST = async(req: NextRequest) => {
    //// this is the endpoint
  try {
    const body = await req.json()
    const { getUser } = getKindeServerSession()
    const user = await  getUser()

    const userId = user?.id

    if(!userId) return new Response("Unauthorized", {status: 401})

    const { fileId ,message} = SendMessageValidators.parse(body)

    console.log(message)
    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId
        }
    })

    if(!file) return new Response("NotFound", {status: 404})
    
    await db.message.create({
        data: {
            text: message,
              isUserMessage: false,
              userId,
              fileId,
          }
    })
    return new Response(JSON.stringify({message:"AI message inserted"}), {status: 200})
 
          
  } catch (error) {
    console.log(error)
  }
}