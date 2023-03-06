const { CircuitCubeDiscoverer } = require("../src");

const cc = new CircuitCubeDiscoverer();

cc.on("discover", async (hub) => {
  await hub.connect(); // Connect to the Hub

  console.log("Name:", hub.name);

  await hub.setPower([250, undefined, -250]);
  await hub.sleep(500);
  await hub.stopAll();
  await hub.sleep(5_000);
  console.log("Battery level:", hub.batteryLevel);

  process.exit(0);
});

cc.scan(); // Start scanning for Hubs
console.log("Scanning for Hubs...");
