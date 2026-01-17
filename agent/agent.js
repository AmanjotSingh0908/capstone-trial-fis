const WebSocket = require('ws');
const forge = require('node-forge');
const axios = require('axios');
const os = require('os');
const FaultInjector = require('../chaos/injector');

const ORCHESTRATOR_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8081';

// Generate key pair
const keypair = forge.pki.rsa.generateKeyPair(2048);
const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);

// Register with orchestrator
async function register() {
  try {
    const response = await axios.post(`${ORCHESTRATOR_URL}/register`, { publicKey });
    const { agentId, token } = response.data;

    console.log(`Agent registered with ID: ${agentId}`);

    // Write to file for easy access
    require('fs').writeFileSync('agent-id.txt', agentId);

    // Connect to WS
    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.on('open', () => {
      console.log('Connected to orchestrator');
    });

    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
      const data = JSON.parse(message);
      if (data.type === 'experiment') {
        executeExperiment(data.experiment, ws);
      }
    });

    ws.on('close', () => {
      console.log('Disconnected from orchestrator');
    });

  } catch (error) {
    console.error('Registration failed:', error.message);
  }
}

// Execute experiment
async function executeExperiment(experiment, ws) {
  console.log(`Executing experiment: ${experiment.id}`);

  const injector = new FaultInjector();

  // Collect baseline metrics
  const baseline = await collectMetrics();

  // Execute fault
  switch (experiment.faultType) {
    case 'memory':
      injector.injectMemoryStress(experiment.duration);
      break;
    case 'network':
      injector.injectNetworkLatency(100, experiment.duration); // Default delay
      break;
    case 'dbio':
      injector.injectDBIOStress(experiment.duration);
      break;
    // Add more
  }
  await sleep(experiment.duration * 1000 + 1000);

  // Collect post metrics
  const post = await collectMetrics();

  // Send results
  ws.send(JSON.stringify({
    type: 'experiment_result',
    experimentId: experiment.id,
    results: { baseline, post }
  }));

  console.log(`Experiment ${experiment.id} completed`);
}

// Collect real metrics
async function collectMetrics() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;

  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const cpuUsage = 100 - ~~(100 * idle / total);

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

  // Measure response time
  const responseTime = await measureResponseTime();

  return {
    cpu: cpuUsage,
    memory: memoryUsage,
    networkIO: 0, // Placeholder
    diskIO: 0,    // Placeholder
    responseTime: responseTime,
    timestamp: Date.now()
  };
}

// Measure app response time
async function measureResponseTime() {
  const start = Date.now();
  try {
    await axios.get('http://localhost:3000/health');
    return Date.now() - start;
  } catch (error) {
    return -1; // Unreachable
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

register();