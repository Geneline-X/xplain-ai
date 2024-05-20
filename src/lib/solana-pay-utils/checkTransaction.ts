import { findReference, FindReferenceError } from "@solana/pay"
import { Keypair, PublicKey } from "@solana/web3.js"
import { establishConnection } from "./establishConnection"

export const checkTransaction = async (
  reference: PublicKey,
  setReference: (newReference: PublicKey) => void
) => {
  try {
    const connection = await establishConnection()
    // Check for confirmed transactions including the reference public key
    await findReference(connection, reference, {
      finality: "confirmed",
    })

    // If a transaction is confirmed, generate a new reference and display an alert
    setReference(Keypair.generate().publicKey)
    window.alert("Transaction Confirmed")

    // 1 check which token that is being paid with //

       // 2 make an api call to update the user to have a life-time access //

  } catch (e) {
    // If current reference not found, ignore error
    if (e instanceof FindReferenceError) {
      console.log(reference.toString(), "not confirmed")
      return
    }

    // Log any other errors
    console.error("Unknown error", e)
  }
}