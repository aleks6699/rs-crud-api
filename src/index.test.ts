import { getUsers, getUserById, createUser, getUserUpdateId, deleteUser } from './endpoints';
import { data } from './const'; 
import { IncomingMessage, ServerResponse } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { requestBodyParser } from './utills';


describe('User handlers', () => {
  beforeEach(() => {
    data.users = [];
  });

  it('should return an empty array when no users are present', () => {
    const req = {} as IncomingMessage; 
    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    } as unknown as ServerResponse; 

    getUsers(res);

    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify([])); 
  });

  it('should return 404 for a non-existent user', () => {
    const req = {} as IncomingMessage;
    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    } as unknown as ServerResponse;

    getUserById(uuidv4(), res); 

    expect(res.statusCode).toBe(404);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'User not found' }));
  });

  it('should return 400 for invalid userId format', () => {
    const req = {} as IncomingMessage;
    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    } as unknown as ServerResponse;

    getUserById('invalid-id', res); 

    expect(res.statusCode).toBe(400);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Invalid userId format' }));
  });

  it('should create a new user', async () => {
    const req = {
      method: 'POST',
      body: JSON.stringify({ username: 'John Doe', age: 30, hobbies: ['reading', 'traveling'] }),
    } as unknown as IncomingMessage;

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    } as unknown as ServerResponse;

    (requestBodyParser as jest.Mock) = jest.fn().mockResolvedValue({
      username: 'John Doe',
      age: 30,
      hobbies: ['reading', 'traveling'],
    });

    await createUser(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('John Doe')); 
    expect(data.users.length).toBe(1); 

    const requestBodyParserMock = jest.fn().mockResolvedValue({
      username: 'John Doe',
      age: 30,
      hobbies: ['reading', 'traveling'],
    });
  });

  it('should return 400 for invalid user input when creating a user', async () => {
    const req = {
      method: 'POST',
      body: JSON.stringify({ username: '', age: 'not-a-number', hobbies: 'not-an-array' }),
    } as unknown as IncomingMessage;

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    } as unknown as ServerResponse;

    (requestBodyParser as jest.Mock) = jest.fn().mockResolvedValue({
      username: '',
      age: 'not-a-number',
      hobbies: 'not-an-array',
    });

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Invalid input' }));

    const requestBodyParserMock = jest.fn().mockResolvedValue({
      username: 'John Doe',
      age: 30,
      hobbies: ['reading', 'traveling'],
    });
  });

  it('should update a user', async () => {
    const userId = uuidv4();
    data.users.push({ id: userId, username: 'Jane Doe', age: 25, hobbies: ['music'] });

    const req = {
      method: 'PUT',
      body: JSON.stringify({ username: 'Jane Smith', age: 26, hobbies: ['art'] }),
    } as unknown as IncomingMessage;

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    } as unknown as ServerResponse;

    (requestBodyParser as jest.Mock) = jest.fn().mockResolvedValue({
      username: 'Jane Smith',
      age: 26,
      hobbies: ['art'],
    });

    await getUserUpdateId(userId, res, req);

    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: 'User updated' }));
    expect(data.users[0].username).toBe('Jane Smith'); 

    const requestBodyParserMock = jest.fn().mockResolvedValue({
      username: 'John Doe',
      age: 30,
      hobbies: ['reading', 'traveling'],
    });
  });

  it('should delete a user', () => {
    const userId = uuidv4();
    data.users.push({ id: userId, username: 'Jane Doe', age: 25, hobbies: ['music'] });

    const req = {} as IncomingMessage;
    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    } as unknown as ServerResponse;

    deleteUser(userId, res); 

    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: 'User deleted' }));
    expect(data.users.length).toBe(0); 
  });

  it('should return 400 for invalid userId format when deleting', () => {
    const req = {} as IncomingMessage;
    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    } as unknown as ServerResponse;

    deleteUser('invalid-id', res);

    expect(res.statusCode).toBe(400);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Invalid userId format' }));
  });
});
