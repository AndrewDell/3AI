import express, { Request, Response } from 'express';
import http from 'http';

/**
 * Creates a simple HTTP server for Docker health checks
 * @param port - The port to listen on (default: 3001)
 * @returns The Express app and HTTP server
 */
export function createHealthCheckServer(port: number = 3001) {
  const app = express();
  const server = http.createServer(app);
  
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: '3AI-socket-server',
      timestamp: new Date().toISOString()
    });
  });
  
  // Start the server on the specified port
  server.listen(port, () => {
    console.log(`Health check server running on port ${port}`);
  });
  
  return { app, server };
}

export default createHealthCheckServer; 