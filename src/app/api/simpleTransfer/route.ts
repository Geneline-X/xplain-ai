import { NextApiRequest, NextApiResponse } from "next"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js"
import { establishConnection } from "../../../lib/solana-pay-utils/establishConnection"


// API endpoint
// export async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method === "GET") {
//     return get(res)
//   } else if (req.method === "POST") {
//     return await post(req, res)
//   } else {
//     return res.status(405).json({ error: "Method not allowed" })
//   }
// }

// "res" is Text and Image that displays when wallet first scans
export async function GET(res: NextApiResponse) {
//   res.status(200).json({
//     label: "XPLAIN AI",
//     icon: appLogo,
//   })
console.log("this is the get request in the api")
  return new Response(JSON.stringify({
    label: "XPLAIN AI",
    icon: "https://i.postimg.cc/gcxV8R6L/app-logo.jpg",
  }), {status: 200})
}

// "req" is public key of wallet scanning QR code
// "res" is transaction built for wallet to approve, along with a message
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  const { account } = req.body
  console.log("this is the account ", account)
  if (!account) {
    // res.status(400).json({ error: "No account provided" })
    return new Response(JSON.stringify({
        error: "No account provided"
    }), {status: 400})
  }

  const connection = await establishConnection()
  const { reference } = req.query
  if (!reference) {
    return new Response(JSON.stringify({
        error: "No reference provided"
    }), {status: 400})
  }

  try {
    const accountKey = new PublicKey(account)
    const referenceKey = new PublicKey(reference)

    // Airdrop devnet SOL to fund mobile wallet
     connection.requestAirdrop(accountKey, 2 * LAMPORTS_PER_SOL)

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash()

    const transaction = new Transaction({
      feePayer: accountKey,
      blockhash,
      lastValidBlockHeight,
    })

    const instruction = SystemProgram.transfer({
      fromPubkey: accountKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: 0.001 * LAMPORTS_PER_SOL,
    })

    instruction.keys.push({
      pubkey: referenceKey,
      isSigner: false,
      isWritable: false,
    })

    transaction.add(instruction)

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
    })
    const base64 = serializedTransaction.toString("base64")

    const message = "Approve to transfer 0.001 Devnet SOL"

    // res.status(200).json({  })
    return new Response(JSON.stringify({
        transaction: base64, message
    }), {status: 200})
  
  } catch (error) {
    return new Response(JSON.stringify({
        error: "error creating transaction"
    }), {status: 500})
  }
}