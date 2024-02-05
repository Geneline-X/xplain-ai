import { NextRequest, NextResponse } from 'next/server';

// pages/api/monime-redirect-cancel.js

export async function POST(req:NextRequest, res:NextResponse) {
  return NextResponse.redirect('/pricing');
}
