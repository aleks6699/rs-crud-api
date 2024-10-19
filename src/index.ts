require('dotenv').config();
import http from 'http';
import { data } from './const';
import { v4, validate } from 'uuid';

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

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/users') {
    return getUsers(res);
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/users/')) {
    const id = req.url.split('/').pop();
    return getUserById(id, res);
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
