/**
 * Health Check Endpoint
 *
 * Used by Docker healthcheck and monitoring services to verify the application is running.
 * Returns 200 OK if the application is healthy.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'chickentracker',
    },
    { status: 200 }
  );
}
