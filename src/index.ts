import http from 'http';
import cluster from 'cluster';
import os from 'os';
import { createUser, getUsers, getUserById, getUserUpdateId, deleteUser } from './endpoints';
import { data } from './const';

const PORT = parseInt(process.env.PORT) || 4000;
const WORKER_PORT_START = 4001
const numCPUs = os.cpus().length;
let currentWorkerIndex = 0;

function createServer(port: number) {
  const server = http.createServer((req, res) => {
    const id = req.url.split('/').pop();

    if (req.method === 'POST' && req.url === '/api/users') {
      return createUser(req, res, syncWithMaster);
    }

    if (req.method === 'GET' && req.url === '/api/users') {
      return getUsers(res);
    }

    if (req.method === 'GET' && req.url.startsWith('/api/users/')) {
      return getUserById(id, res);
    }

    if (req.method === 'PUT' && req.url.startsWith('/api/users/')) {
      return getUserUpdateId(id, res, req, syncWithMaster);
    }

    if (req.method === 'DELETE' && req.url.startsWith('/api/users/')) {
      return deleteUser(id, res, syncWithMaster);
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, () => {
    console.log(`Worker server running at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    console.error(`Server error: ${error.message}`);
  });
}

function syncWithMaster(updatedUsers:any) {

  console.log('Updating local data object...');
  console.log('Local data updated:', data.users); 
  
  data.users = updatedUsers; 
  if (process.send) {
    process.send({ type: 'UPDATE_DATA', users: updatedUsers });
    console.log('Sent update to master:', updatedUsers); 
  }
}


function startCluster() {
  if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork({ PORT: WORKER_PORT_START + i });

      // Обработка сообщений от рабочих процессов
      worker.on('message', (message) => {
        if (message.type === 'UPDATE_DATA') {
          data.users = message.users; 
          console.log('Data synced with master:', data.users);
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

      req.pipe(proxy);
    });

    loadBalancer.listen(PORT, () => {
      console.log(`Load balancer running on http://localhost:${PORT}`);
    });

    cluster.on('exit', (worker) => {
      console.log(`Worker ${worker.process.pid} exited`);
    });
  } else {
    const workerPort = parseInt(process.env.PORT);
    createServer(workerPort);
  }
}


const isMultiMode = process.argv.includes('--multi');
if (isMultiMode) {
  startCluster();
} else {
  createServer(PORT);
}
