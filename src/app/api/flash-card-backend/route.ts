import { db } from "@/db";
import { FlashCardsValidators } from "@/lib/validators/FlashCardsValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { generateFlashCards } from "@/lib/elegance";

export async function POST(req:Request) {
    try {
        const body = await req.json()
        const data = FlashCardsValidators.parse(body)

        const { getUser } = getKindeServerSession()
        const user = await  getUser()
    
        const userId = user?.id
    
        if(!userId) return new Response("Unauthorized", {status: 401})
    
            const { fileId, numberOfMessages } = data;

        // Fetch the last `numberOfMessages` chat messages from the database
        const messages = await db.message.findMany({
            where: {
                fileId,
                userId,
            },
            orderBy: {
                createAt: "desc",
            },
            take: numberOfMessages,
        });

        if (!messages || messages.length === 0) {
            return new Response("No messages found", { status: 404 });
        }

        // Combine the messages into a single context string
        const context = messages.reverse().map(msg => msg.text).join("\n");

        // Generate flash cards from the context
        const flashCards = await generateFlashCards(context, fileId);
        return new Response(JSON.stringify(flashCards), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({message: "Error Occured", error}), {status: 500})
    }
}