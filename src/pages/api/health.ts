// Health check endpoint for Docker and monitoring
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Health check endpoint for the 3AI Next.js frontend
 * Used by Docker healthcheck and monitoring services
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Return a 200 OK status with basic health information
  res.status(200).json({ 
    status: 'ok',
    service: '3AI-frontend',
    timestamp: new Date().toISOString()
  });
} 