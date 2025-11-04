import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API está funcionando',
    timestamp: new Date().toISOString(),
  })
}

