import { getUserSubscriptionPlan } from "@/lib/monime"
import {PLANS} from "@/config/stripe"
import { generateUniqueKey, updateStatusInDb, splitTextIntoChunks, processBatchUrl, cleanedHtmlText } from "@/lib/elegance";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import axios from "axios";
import cheerio from "cheerio"

export const maxDuration = 300;


export async function POST(req:Request) {
    try {
        const body = await req.json()
        const { url,name } = body
        const { getUser } = getKindeServerSession();
        const user = await getUser();
      
        if (!user || !user.id) throw new Error("Unauthorized");
      
        const response = await axios.get(url);
        const htmlContent = response.data;
     
        // Load the HTML content into Cheerio
        const { textContent,  cleanedHtmlContent} = cleanedHtmlText(htmlContent)
       
        // store the actual html element in the database/ supabase
        const urlFile = await db.urlFile.create({
            data: {
              name, 
              url: url,
              key: generateUniqueKey(url),
              userId: user.id,
              htmlContent:cleanedHtmlContent
            }
          });

          const textChunks = splitTextIntoChunks(textContent, 1000); // Adjust the chunk size as needed

          // Process chunks in batches
          const batchSize = 50;
          for (let startIndex = 0; startIndex < textChunks.length; startIndex += batchSize) {
            const batch = textChunks.slice(startIndex, startIndex + batchSize);
            await processBatchUrl({ batch, startIndex, createdFile: urlFile });
          }
      
          // Update the file status to success
         
          console.log("Text Vectorization and Indexing complete!");

        return new Response(JSON.stringify({message: "Vectorized Complete", urlFileId: urlFile.id}), {status:200})
    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({message: "Error Occred", error}), {status:500})
    }
}