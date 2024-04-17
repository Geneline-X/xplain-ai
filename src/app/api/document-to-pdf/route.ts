import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import fs from "fs/promises"; // Using fs/promises for cleaner async/await syntax
import { tmpdir } from "os";

export const POST = async (req: NextRequest, res: any) => {
  try {
    // Ensure the request contains a file
    const formData = await req.formData();

    console.log("this is the format data ", formData)
    if (!formData.has('file')) {
      throw new Error('Missing file in request');
    }

    // Make the request to PSPDFKit API with the file (modify based on PSPDFKit API requirements)
    const response = await axios.post('https://api.pspdfkit.com/build', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.PSPD_API_KEY}`,
      },
      responseType: "stream",
    });

     // Generate a temporary filename
     const tempFilename = `${tmpdir()}/converted-${Math.random().toString(36).substring(2, 15)}.pdf`;

      // Write the stream data to a temporary file
       await fs.writeFile(tempFilename, response.data);

       const fileData = await fs.readFile(tempFilename);
      
       // Stream the PDF data to the client in chunks
       await fs.unlink(tempFilename);
       console.log(tempFilename)
       console.log(fileData)
        return new Response(fileData, {status: 200, 
        headers: {
          'Content-Type': 'application/pdf',
          },
        })
       // Clean up the temporary file after usage (optional)
       
  } catch (error:any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ pdferror: "Failed to convert to PDF" }), {
      status: 500,
    });
  }
};
