import http from 'http';
import cluster from 'cluster';
import os from 'os';
import { createUser, getUsers, getUserById, getUserUpdateId, deleteUser } from './endpoints';
import { data } from './const';

const PORT = parseInt(process.env.PORT) || 4000;
const WORKER_PORT_START = 4001;
const numCPUs = os.cpus().length;
let currentWorkerIndex = 0;

function createServer(port: number) {
  const server = http.createServer((req, res) => {
    const id = req.url?.split('/').pop();
    try {

      if (req.method === 'POST' && req.url === '/api/users') {
        return createUser(req, res);
      }

      if (req.method === 'GET' && req.url === '/api/users') {
        return getUsers(res);
      }

      if (req.method === 'GET' && req.url.startsWith('/api/users/')) {
        return getUserById(id, res);
      }

      if (req.method === 'PUT' && req.url.startsWith('/api/users/')) {
        return getUserUpdateId(id, res, req);
      }

      if (req.method === 'DELETE' && req.url.startsWith('/api/users/')) {
        return deleteUser(id, res);
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));

    } catch (error) {

      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
    }

  });

  server.listen(port, () => {
    console.log(`Worker server running at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    console.error(`Server error: ${error.message}`);
  });
}



function startCluster() {
  if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork({ PORT: WORKER_PORT_START + i });

      worker.on('message', (message) => {
        if (message.type === 'UPDATE_DATA') {
          data.users = message.users;
          console.log('Received update from master:', data.users);
          broadcastToWorkers({ type: 'SYNC_DATA', users: data.users });
        }
      });
    }

    const loadBalancer = http.createServer((req, res) => {
      const workerPort = WORKER_PORT_START + currentWorkerIndex;
      currentWorkerIndex = (currentWorkerIndex + 1) % numCPUs;

      const options = {
        hostname: 'localhost',
        port: workerPort,
        path: req.url,
        method: req.method,
        headers: req.headers,
      };

      const proxy = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxy.on('error', (error) => {
        console.error(`Proxy error: ${error.message}`);
        res.statusCode = 500;
        res.end('Internal Server Error');
      });

      req.pipe(proxy);
    });

    loadBalancer.listen(PORT, () => {
      console.log(`Load balancer running at http://localhost:${PORT}`);
    });

    cluster.on('exit', (worker) => {
      console.log(`Worker ${worker.process.pid} EXITED`);
      const newWorker = cluster.fork({ PORT: WORKER_PORT_START + currentWorkerIndex });
    });
  } else {
    const workerPort = parseInt(process.env.PORT);
    createServer(workerPort);

    process.send?.({ type: 'REQUEST_SYNC' });

    process.on('message', (message: any) => {
      if (message.type === 'SYNC_DATA') {
        data.users = message.users;
        console.log(`Worker ${process.pid} synced data:`, data.users);
      }
    });
  }
}

function broadcastToWorkers(message: any) {
  for (const id in cluster.workers) {
    cluster.workers[id]?.send(message);
  }
}

const isMultiMode = process.argv.includes('--multi');
if (isMultiMode) {
  startCluster();
} else {
  createServer(PORT);
}
