import { appLogo, getTokenPrice } from "@/lib/elegance";
import { NextApiRequest, NextApiResponse } from "next";
import { clusterApiUrl, Connection, Keypair, PublicKey, VersionedTransaction, Cluster, Transaction, SystemProgram, LAMPORTS_PER_SOL, } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Account, createTransferCheckedInstruction, getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';

type GetResponse = {
    label: string,
    icon: string,
  };
  
  export type PostRequest = {
    account: string,
  };
  
  export type PostResponse = {
    transaction: string,
    message: string,
    network: Cluster,
  };
  
  export type PostError = {
    error: string
  };

const splToken = new PublicKey(`${process.env.USDC_MINT_ADDRESS}`);
const MERCHANT_WALLET = new PublicKey(`${process.env.MERCHANT_WALLET}`);

const connection = new Connection(clusterApiUrl("devnet"));



export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<GetResponse | PostResponse | PostError>
  ) {
    if (req.method === 'GET') {
      return get(res);
    } else if (req.method === 'POST') {
      return await post(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  }

// Response for GET request
function get(res: NextApiResponse<GetResponse>) {
    res.status(200).json({
      label: 'XPLAIN AI',
      icon: 'https://i.postimg.cc/gcxV8R6L/app-logo.jpg',
    });
  }

  // Main body of the POST request, this returns the transaction
async function postImpl(
    network: Cluster,
    account: PublicKey,
    reference: PublicKey
  ): Promise<PostResponse> {

    // Can also use a custom RPC here
    const endpoint = clusterApiUrl(network);
    const connection = new Connection(endpoint);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    // Create any transaction
    const transaction = new Transaction({
        feePayer: account,
        blockhash,
        lastValidBlockHeight,
    });

    const transferInstruction = SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: Keypair.generate().publicKey,
        lamports: LAMPORTS_PER_SOL / 1000,
    });

    // This allows us to listen for this transaction
    transferInstruction.keys.push({
        pubkey: reference,
        isSigner: false,
        isWritable: false,
    });

    transaction.add(transferInstruction);

    // Serialize the transaction and convert to base64 to return it
    const serializedTransaction = transaction.serialize({
        requireAllSignatures: false // account is a missing signature
    });
    const base64 = serializedTransaction.toString('base64');

      // Return the serialized transaction
        return {
            transaction: base64,
            message: 'Thank you for your purchase!',
            network,
        };

  }
// We pass eg. network in query params, this function extracts the value of a query param
function getFromQuery(
    req: NextApiRequest,
    field: string
  ): string | undefined {
    if (!(field in req.query)) return undefined;
  
    const value = req.query[field];
    if (typeof value === 'string') return value;
    // value is string[]
    if (value?.length === 0) return undefined;
    return value?.[0];
  }
  
  async function post(
    req: NextApiRequest,
    res: NextApiResponse<PostResponse | PostError>
  ) {
    const { account } = await req.body as PostRequest
    console.log(req.body)
    if (!account) {
      res.status(400).json({ error: 'No account provided' })
      return
    }
  
    const network = getFromQuery(req, 'network') as Cluster;
    if (!network) {
      res.status(400).json({ error: 'No network provided' });
      return
    }
  
    const reference = getFromQuery(req, 'reference');
    if (!reference) {
      res.status(400).json({ error: 'No reference provided' })
      return
    }
  
    try {
      const postResponse = await postImpl(
        network,
        new PublicKey(account),
        new PublicKey(reference),
      );
      res.status(200).json(postResponse)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error creating transaction' })
    }
  }
// const post = async(req: NextRequest, res:NextResponse) => {
//     const  accountField = await req.json()
//     if (!accountField) throw new Error('missing account');

//     const sender = new PublicKey(accountField);

//     const { blockhash } = await connection.getLatestBlockhash();

//     const transaction = new Transaction({
//         recentBlockhash: blockhash,
//         feePayer: accountField,
//     });
//     // create spl transfer instruction
//     const splTransferIx = await createSplTransferIx({sender, connection});

// }

// async function createSplTransferIx(sender:PublicKey, connection:Connection) {
//     const senderInfo = await connection.getAccountInfo(sender);
//     console.log("this is the senderinfo :", senderInfo)
//     if (!senderInfo) throw new Error('sender not found');

//     // Get the sender's ATA and check that the account exists and can send tokens
//     const senderATA = await getAssociatedTokenAddress(splToken, sender);
//     const senderAccount = await getAccount(connection, senderATA);
//     if (!senderAccount.isInitialized) throw new Error('sender not initialized');
//     if (senderAccount.isFrozen) throw new Error('sender frozen');

//     // Get the merchant's ATA and check that the account exists and can receive tokens
//     const merchantATA = await getAssociatedTokenAddress(splToken, MERCHANT_WALLET);
//     const merchantAccount = await getAccount(connection, merchantATA);
//     if (!merchantAccount.isInitialized) throw new Error('merchant not initialized');
//     if (merchantAccount.isFrozen) throw new Error('merchant frozen');

//     // Check that the token provided is an initialized mint
//     const mint = await getMint(connection, splToken);
//     if (!mint.isInitialized) throw new Error('mint not initialized');

//     // You should always calculate the order total on the server to prevent
//     // people from directly manipulating the amount on the client
//     let amount = await calculateCheckoutAmount("USDC");
   
//     // Check that the sender has enough tokens
//     const tokens = BigInt(String(amount));
//     if (tokens > senderAccount.amount) throw new Error('insufficient funds');

//     // Create an instruction to transfer SPL tokens, asserting the mint and decimals match
//     const splTransferIx = createTransferCheckedInstruction(
//         senderATA,
//         splToken,
//         merchantATA,
//         sender,
//         tokens,
//         mint.decimals
//     );

//     // Create a reference that is unique to each checkout session
//     const references = [new Keypair().publicKey];

//     // add references to the instruction
//     for (const pubkey of references) {
//         splTransferIx.keys.push({ pubkey, isWritable: false, isSigner: false });
//     }

//     return splTransferIx;
// }

// async function calculateCheckoutAmount(token: string) {
//     try {
        
//       if (token === 'USDC') {
//         return await getTokenPrice(`${process.env.USDC_MINT_ADDRESS}`) 
    
//       }
//       if(token === 'BONK'){
//         return await getTokenPrice(`${process.env.BONK_MINT_ADDRESS}`) 
//       }
      
      
//     } catch (error) {
//       console.error('Error fetching price:', error);
//       throw new Error('Failed to calculate checkout amount');
//     }
// }