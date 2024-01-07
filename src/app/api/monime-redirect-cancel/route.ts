import { NextRequest, NextResponse } from 'next/server';
import { NextApiResponse } from 'next';
import { Server } from 'http';
import { EventEmitter } from "node:events"

// pages/api/monime-redirect-cancel.js

export async function POST(req:any, res:any) {
  // Handle the POST request from the external payment service
  // You may perform necessary processing here

  // Set the Location header for server-side redirection
  const redirectUrl = "https://cph-nine.vercel.app/pricing " || 'http://localhost:3000/pricing';
  res.setHeader('Location', redirectUrl);
  res.status(302).end(); // 302 Found status code indicates a temporary redirect

  // Optionally, you can send a response for the webhook acknowledgment
  res.status(200).send('Payment webhook received successfully');
}
