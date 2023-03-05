const { PoweredUP } =require( "../src");

const poweredUP = new PoweredUP();

poweredUP.on("discover", async (hub) => { // Wait to discover a Hub
    console.log(`Discovered ${hub.name}!`);

    await hub.connect(); // Connect to the Hub
    console.log("Connected");

    console.log('name', await hub.getName());
    await hub.setName('GWR');
    console.log('name', await hub.getName());
    console.log('battery level', hub.batteryLevel);

    console.log('voltage', await hub.getVoltage());
    await hub.setPower([250, undefined, -250])
    await hub.sleep(500); 
    await hub.stopAll();
    await hub.sleep(500); 
});

poweredUP.scan(); // Start scanning for Hubs
console.log("Scanning for Hubs...");
