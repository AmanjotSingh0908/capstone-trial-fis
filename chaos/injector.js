const { exec } = require('child_process');
const path = require('path');

class FaultInjector {
  constructor(appContainer = 'capstonetrial-app-1', dbContainer = 'capstonetrial-mongo-1') {
    this.appContainer = appContainer;
    this.dbContainer = dbContainer;
    this.chaosDir = path.join(__dirname);
  }

  injectMemoryStress(duration = 10) {
    const scriptPath = path.join(this.chaosDir, 'memory-stress.js');
    const cmd = `docker cp "${scriptPath}" ${this.appContainer}:/tmp/memory-stress.js && docker exec ${this.appContainer} node /tmp/memory-stress.js ${duration}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error injecting memory stress: ${error}`);
        return;
      }
      console.log(`Memory stress injected for ${duration}s`);
    });
  }

  injectNetworkLatency(delay = 100, duration = 10) {
    // Since tc netem not available, use container pause/unpause to simulate network issues
    const pauseCmd = `docker pause ${this.appContainer}`;
    const unpauseCmd = `docker unpause ${this.appContainer}`;

    exec(pauseCmd, (error) => {
      if (error) {
        console.error(`Error pausing container for network simulation: ${error}`);
        return;
      }
      console.log(`Container paused to simulate network latency for ${duration}s`);
      setTimeout(() => {
        exec(unpauseCmd, (error) => {
          if (error) {
            console.error(`Error unpausing container: ${error}`);
            return;
          }
          console.log('Container unpaused');
        });
      }, duration * 1000);
    });
  }

  injectDBIOStress(duration = 10) {
    const scriptPath = path.join(this.chaosDir, 'db-io-stress.js');
    const cmd = `node "${scriptPath}" ${duration}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error injecting DB I/O stress: ${error}`);
        return;
      }
      console.log(`DB I/O stress injected for ${duration}s`);
    });
  }

  killAppProcess() {
    const cmd = `docker exec ${this.appContainer} pkill -f "node app.js"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error killing app process: ${error}`);
        return;
      }
      console.log('App process killed (Chaos Monkey style)');
    });
  }

  killDBProcess() {
    const cmd = `docker exec ${this.dbContainer} pkill mongod`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error killing DB process: ${error}`);
        return;
      }
      console.log('DB process killed');
    });
  }

  pauseContainer(container, duration = 10) {
    const pauseCmd = `docker pause ${container}`;
    const unpauseCmd = `docker unpause ${container}`;

    exec(pauseCmd, (error) => {
      if (error) {
        console.error(`Error pausing container: ${error}`);
        return;
      }
      console.log(`Container ${container} paused for ${duration}s`);
      setTimeout(() => {
        exec(unpauseCmd, (error) => {
          if (error) {
            console.error(`Error unpausing container: ${error}`);
            return;
          }
          console.log(`Container ${container} unpaused`);
        });
      }, duration * 1000);
    });
  }
}

module.exports = FaultInjector;