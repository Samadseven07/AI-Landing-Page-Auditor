import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, url } = await request.json()

  // Example: Add to ConvertKit, Mailchimp, etc.
  // await fetch('https://api.mailchimp.com/...', {
  //   method: 'POST',
  //   headers: { ... },
  //   body: JSON.stringify({ email_address: email, ... })
  // })

  return NextResponse.json({ success: true })
}