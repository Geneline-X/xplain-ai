import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { encodeURL } from "@solana/pay";
import { establishConnection } from "@/lib/solana-pay-utils/establishConnection";
import { simulateCheckout } from "@/lib/solana-pay-utils/checkoutData";

const MERCHANT_WALLET = new PublicKey(`${process.env.MERCHANT_WALLET}`);
const LUMA_MINT_ADDRESS = new PublicKey(`${process.env.LUMA_MINT_ADDRESS}`);
const USDC_MINT_ADDRESS = new PublicKey(`${process.env.USDC_MINT_ADDRESS}`);
const BONK_MINT_ADDRESS = new PublicKey(`${process.env.BONK_MINT_ADDRESS}`);

export async function POST(req: NextRequest,) {
    try {
        
        const body = await req.json()
        const { currency, reference} = body
        const newReference = new PublicKey(reference)
        console.log(currency, reference)
        //let currency:string = "USDC"

        // Establish connection to Solana cluster
        const connection = await establishConnection();

        // Simulate customer checkout
        const { label, message, memo, amount, } = await simulateCheckout();

        // Generate payment request link based on currency
        let url;
        if (currency === "USDC") {
            url = encodeURL({ recipient: MERCHANT_WALLET, amount, splToken: LUMA_MINT_ADDRESS, reference:newReference, label, message, memo });
        } else if (currency === "BONK") {
            url = encodeURL({ recipient: MERCHANT_WALLET, amount, splToken: BONK_MINT_ADDRESS, reference:newReference, label, message, memo });
        } else {
            // For other currencies or default case, use SOL
            url = encodeURL({ recipient: MERCHANT_WALLET, amount, reference:newReference, label, message, memo });
        }

        return new Response(JSON.stringify({url}), {status: 200})
    } catch (error) {
        console.error("Error generating payment URL:", error);
        return new Response(JSON.stringify({message: "error occured in the server"}), {status: 500})
    }
}
