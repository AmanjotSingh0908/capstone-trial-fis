const FaultInjector = require('./chaos/injector');
const os = require('os');
const axios = require('axios');

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

  const responseTime = await measureResponseTime();

  return { cpu: cpuUsage, memory: memoryUsage, responseTime };
}

async function measureResponseTime() {
  const start = Date.now();
  try {
    await axios.get('http://localhost:3000/health');
    return Date.now() - start;
  } catch (error) {
    return -1;
  }
}

const args = process.argv.slice(2);
const faultType = args[0];
const duration = parseInt(args[1]) || 10;
const value = parseInt(args[2]) || 100;

const injector = new FaultInjector();

(async () => {
  console.log('Baseline Metrics:', await collectMetrics());

  switch (faultType) {
    case 'memory':
      injector.injectMemoryStress(duration);
      setTimeout(async () => {
        console.log('Post-Fault Metrics:', await collectMetrics());
        process.exit(0);
      }, duration * 1000 + 1000);
      break;
    case 'network':
      injector.injectNetworkLatency(value, duration);
      setTimeout(async () => {
        console.log('Post-Fault Metrics:', await collectMetrics());
        process.exit(0);
      }, duration * 1000 + 1000);
      break;
    case 'dbio':
      injector.injectDBIOStress(duration);
      setTimeout(async () => {
        console.log('Post-Fault Metrics:', await collectMetrics());
        process.exit(0);
      }, duration * 1000 + 1000);
      break;
    case 'killapp':
      injector.killAppProcess();
      setTimeout(async () => {
        console.log('Post-Fault Metrics:', await collectMetrics());
        process.exit(0);
      }, 2000);
      break;
    case 'killdb':
      injector.killDBProcess();
      setTimeout(async () => {
        console.log('Post-Fault Metrics:', await collectMetrics());
        process.exit(0);
      }, 2000);
      break;
    case 'pauseapp':
      injector.pauseContainer(injector.appContainer, duration);
      setTimeout(async () => {
        console.log('Post-Fault Metrics:', await collectMetrics());
        process.exit(0);
      }, duration * 1000 + 1000);
      break;
    case 'pausedb':
      injector.pauseContainer(injector.dbContainer, duration);
      setTimeout(async () => {
        console.log('Post-Fault Metrics:', await collectMetrics());
        process.exit(0);
      }, duration * 1000 + 1000);
      break;
    default:
      console.log('Usage: node fis.js <faultType> [duration] [value]');
      console.log('faultType: memory, network, dbio, killapp, killdb, pauseapp, pausedb');
  }
})();