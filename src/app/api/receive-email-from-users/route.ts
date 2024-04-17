import { NextRequest } from "next/server";
import nodemailer from "nodemailer"


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: `${process.env.TO_EMAIL}`,
      pass: `${process.env.EMAIL_PASSWORD}`
    },
    tls: {
        rejectUnauthorized: false
      }
  });
  


type EmailDetailProp = {
  name: string,
  email: string
  detail: string
}

export const POST = async (req: NextRequest) => {
  try {
    const emailDetail: EmailDetailProp = await req.json(); // Use req.json()
    const { name, email, detail } = emailDetail;

    const mailOptions = {
      from: `${name}`, // Replace with sender email
      to: process.env.TO_EMAIL,
      subject: "New submission to your contact form!",
      html: `
        <h1>New Submission from ${name}</h1>
        <p>Email: ${email}</p>
        <p>Detail: ${detail}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    if (!info.messageId) {
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
    }

    return new Response(JSON.stringify({ data: "Email sent successfully!" }), {status: 200});
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Error sending email" }), { status: 500 });
  }
};
