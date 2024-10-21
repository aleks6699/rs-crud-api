import http from 'http';
import { User } from './types/types';
 export async function requestBodyParser(req: http.IncomingMessage): Promise<User> {
  let body = '';

  return new Promise((resolve, reject) => {
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsedBody = JSON.parse(body);
        resolve(parsedBody);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    });
  });
}