import { db } from "@/db";

export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { userId, messageId, title, description, fileId } = body;
  
      // Validate input data
      if (!userId || !messageId) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
      }
  
      // Check if the user already has this message as a favorite
      const existingFavorite = await db.favorites.findFirst({
        where: {
          userId,
          messageId,
        },
      });
  
      if (existingFavorite) {
        return new Response(JSON.stringify({ error: 'Message already favorited' }), { status: 400 });
      }
  
      // Create a new favorite entry
      const newFavorite = await db.favorites.create({
        data: {
          userId,
          messageId,
          title,
          description,
          file: fileId ? { connect: { id: fileId } } : undefined,
        },
      });
  
      return new Response(JSON.stringify({ message: 'Favorite added successfully', data: newFavorite }), { status: 201 });
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'An error occurred' }), { status: 500 });
    }
  }
  