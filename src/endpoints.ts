import { data } from './const';
import { v4 as uuidv4, validate } from 'uuid';
import { User } from './types/types';
import http from 'http';
import { requestBodyParser } from './utills';

function sendUpdateToMaster() {
  if (process.send) {
    process.send({ type: 'UPDATE_DATA', users: data.users });
    console.log('Sent update to master:', data.users);
  }
}

export function getUsers(res: http.ServerResponse): void {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data.users));
}

export function getUserById(id: string, res: http.ServerResponse) {
  if (!validate(id)) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid userId format' }));
  }

  const user = data.users.find((u) => u.id === id);
  if (!user) {
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'User not found' }));
  }

  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(user));
}

export async function createUser(
req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const body = await requestBodyParser(req);
    const { username, age, hobbies } = body;

    if (!username || typeof age !== 'number' || !Array.isArray(hobbies)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid input' }));
    }

    const newUser: User = { id: uuidv4(), username, age, hobbies };
    data.users.push(newUser);

    sendUpdateToMaster(); 

    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
   return  res.end(JSON.stringify(newUser));
  } catch (error) {
    res.statusCode = 500;
   return  res.end(JSON.stringify({ error: error.message }));
  }
}

export async function getUserUpdateId(
  id: string,
  res: http.ServerResponse,
  req: http.IncomingMessage
) {
  if (!validate(id)) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid userId format' }));
  }

  const body = await requestBodyParser(req);
  data.users = data.users.map((user) =>
    user.id === id ? { ...user, ...body } : user
  );

  sendUpdateToMaster();

  res.setHeader('Content-Type', 'application/json');
 return  res.end(JSON.stringify({ message: 'User updated' }));
}

export function deleteUser(id: string, res: http.ServerResponse) {
  if (!validate(id)) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid userId format' }));
  }

  data.users = data.users.filter((user) => user.id !== id);

  sendUpdateToMaster();

  res.setHeader('Content-Type', 'application/json');
 return  res.end(JSON.stringify({ message: 'User deleted' }));
}
