
import { NextRequest } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from 'next/navigation'
import { generateRandomHex } from "@/lib/utils";
// import { createLiveBlockSession } from "@/lib/elegance";


export async function POST(request: NextRequest) {
//  try {
//      // Get the current user's info from the session //
//   const { getUser } = getKindeServerSession()

//   const user = await getUser()

//   if(!user || !user.id) redirect("/auth-callback?origin=dashboard")
  
//   const { room } = await request.json();

//   // generate a random hexa decimal 
//   const randomHex = generateRandomHex()

//   // Create a session for the current user
//   const session = createLiveBlockSession({user, randomHex})
  
//   // Give the user access to the room
//   session.allow(room, session.FULL_ACCESS);

//   // Authorize the user and return the result
//   const { body, status } = await session.authorize();

//   // return the response to the client//
//   return new Response(body, { status });

//  } catch (error) {
//     console.log(error)
//     return new Response(JSON.stringify({message: "Error occured creating "}))
//  }
}