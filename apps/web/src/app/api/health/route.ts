import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    data: {
      status: 'ok',
      service: 'gestion-granjas',
      timestamp: new Date().toISOString(),
    },
  });
}
