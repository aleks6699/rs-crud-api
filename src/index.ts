require('dotenv').config();
import http from 'http';
import { data } from './const';
import { v4 as uuidv4, validate } from 'uuid';
import { User } from './types/types';

const PORT = process.env.PORT || 3000;

function getUsers(res: http.ServerResponse): void {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(data.users));
}

function getUserById(id: string, res: http.ServerResponse) {
  if (!validate(id)) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid userId format (not a UUID)' }));
  }

  const user = data.users.find((user) => user.id === id);

  if (user) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    return res.end(JSON.stringify(user));
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'User not found' }));
  }
}
async function requestBodyParser(req: http.IncomingMessage): Promise<User> {
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

async function createUser(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const body = await requestBodyParser(req); // Парсим тело запроса
    const { username, age, hobbies } = body;

    if (!username || typeof age !== 'number' || !Array.isArray(hobbies)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Missing or invalid required fields' }));
    }

    const newUser: User = {
      id: uuidv4(),
      username,
      age,
      hobbies,
    };

    data.users.push(newUser);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 201;
    return res.end(JSON.stringify({ message: 'User created successfully', user: newUser }));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: error.message }));
  }
}

async function getUserUpdateId(id: string, res: http.ServerResponse, req: http.IncomingMessage) {
  const { username, age, hobbies } = await requestBodyParser(req);
  if (!validate(id)) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid userId format (not a UUID)' }));
  }
  if (!data.users.find((user) => user.id === id)) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'User not found' }));
  }
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;

  data.users = data.users.map((user) => {
    if (user.id === id) {
      return { ...user, username, age, hobbies };
    }
    return user;
  });

  return res.end(JSON.stringify({ message: 'User updated successfully', user: { id, username, age, hobbies } }));


}






const server = http.createServer((req, res) => {
  const id = req.url.split('/').pop();

  if (req.method === 'POST' && req.url === '/api/users') {
    return createUser(req, res);
  }

  if (req.method === 'GET' && req.url === '/api/users') {
    return getUsers(res);
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/users/')) {
    return getUserById(id, res);
  }

  if (req.method === 'PUT' && req.url?.startsWith('/api/users/')) {

    return getUserUpdateId(id, res, req);
  }

  // if (req.method === 'DELETE' && req.url?.startsWith('/api/users/')) {
  //    return deleteUser(id, res);
  // }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
});



server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
