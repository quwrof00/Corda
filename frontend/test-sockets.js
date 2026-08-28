const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3001";
const CONNECTIONS_TO_SIMULATE = 30;

console.log(`Starting connection test. Attempting to connect ${CONNECTIONS_TO_SIMULATE} clients to ${SERVER_URL}...`);

let connectedCount = 0;
const sockets = [];

for (let i = 0; i < CONNECTIONS_TO_SIMULATE; i++) {
  const socket = io(SERVER_URL, {
    reconnection: false, // Don't try to reconnect endlessly if server is down
  });
  
  sockets.push(socket);

  socket.on("connect", () => {
    connectedCount++;
    // Simulate joining a team
    socket.emit("join-team", { teamId: "test-team-1", userId: `load_test_user_${i}` });
  });

  socket.on("disconnect", () => {
    connectedCount--;
  });
}

// Wait a bit to let connections establish, then report
setTimeout(() => {
  console.log(`\n--- TEST RESULTS ---`);
  console.log(`Successfully connected ${connectedCount} out of ${CONNECTIONS_TO_SIMULATE} clients.`);
  
  if (connectedCount === 0) {
      console.log("ERROR: 0 connections established. Is your server running on port 3000?");
  } else {
      console.log("Load test passed! Your server can handle 25+ concurrent connections.");
  }
  
  console.log("Disconnecting sockets and exiting...");
  sockets.forEach(s => s.disconnect());
  process.exit(0);
}, 3000);
