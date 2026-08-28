const Redis = require("ioredis");
const redis = new Redis("redis://localhost:6379");

async function runTest() {
  console.log("Sending 50+ updates to Redis as fast as possible...");
  
  const startTime = Date.now();
  let count = 0;
  
  for (let i = 0; i < 60; i++) {
    const payload = JSON.stringify({ 
      type: "TASK_UPDATED", 
      taskId: i, 
      timestamp: Date.now() 
    });
    
    await redis.publish("team:test-team-1", payload);
    count++;
  }
  
  const timeTaken = Date.now() - startTime;
  console.log(`\n--- TEST RESULTS ---`);
  console.log(`Successfully sent ${count} updates in ${timeTaken}ms!`);
  console.log(`That's equivalent to ${(count / (timeTaken / 1000)).toFixed(2)} updates per second.`);
  
  if (timeTaken < 1000) {
      console.log("Load test passed! Redis can easily handle 50+ real-time updates.");
  }
  
  process.exit(0);
}

runTest();
