# **@highflying/circuit-cube** - A Javascript module to interface with Circuit Cubes.

### Announcements

- v1.0.0 First release

```javascript
const { PoweredUP } = require("../src");

const poweredUP = new PoweredUP();

poweredUP.on("discover", async (hub) => {
  // Wait to discover a Hub
  console.log(`Discovered ${hub.name}!`);

  await hub.connect(); // Connect to the Hub
  console.log("Connected");

  console.log("name", await hub.getName());
  await hub.setName("GWR");
  console.log("name", await hub.getName());
  console.log("battery level", hub.batteryLevel);

  console.log("voltage", await hub.getVoltage());
  await hub.setPower([250, undefined, -250]);
  await hub.sleep(500);
  await hub.stopAll();
  await hub.sleep(500);
});

poweredUP.scan(); // Start scanning for Hubs
console.log("Scanning for Hubs...");
```

### Documentation

### Node.js Installation

Node.js v12.0+ required.

```javascript
npm install @highflying/circuit-cube --save
```

node-poweredup uses the Noble BLE library by Sandeep Mistry. On macOS everything should function out of the box. On Linux and Windows there are [certain dependencies which may need installed first](https://github.com/abandonware/noble#prerequisites).

Note: node-poweredup has been tested on macOS 11.0 and Debian/Raspbian on the Raspberry Pi 4 Model B.

### Known Issues and Limitations

- On most Unix systems, you need root permissions to access Bluetooth devices. You may want to [grant the node executable access to the Bluetooth adapter](https://github.com/abandonware/noble#running-without-rootsudo-linux-specific)

### Credits

Thanks go to Nathan Kellenicki ([@nathankellenicki](https://github.com/nathankellenicki)) for node-powered on which this code was originally based.
