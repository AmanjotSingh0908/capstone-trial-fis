const duration = process.argv[2] || 10;
const allocations = [];

console.log(`Starting memory stress for ${duration}s`);

const start = Date.now();
while (Date.now() - start < duration * 1000) {
  allocations.push(Buffer.alloc(10 * 1024 * 1024)); // 10MB
  if (allocations.length > 100) allocations.shift(); // Prevent infinite growth, but stress
}

console.log('Memory stress completed');