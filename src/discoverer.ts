import { Peripheral } from "@abandonware/noble";

import { NobleDevice } from "./nobleabstraction";

import * as Consts from "./consts";

import { EventEmitter } from "events";

import Debug = require("debug");
const debug = Debug("circuitcube:discoverer");
import noble = require("@abandonware/noble");
import { CircuitCube } from "./circuitcube";

let ready = false;
let wantScan = false;

const startScanning = () =>
  noble.startScanningAsync([
    Consts.BLEService.CIRCUIT_CUBE_1,
    // so that node-powered up still works
    "00001523-1212-efde-1523-785feabcd123",
    "000015231212efde1523785feabcd123",
    "00001623-1212-efde-1623-785feabcd123",
    "000016231212efde1623785feabcd123",
  ]);

noble.on("stateChange", (state: string) => {
  ready = state === "poweredOn";
  if (ready) {
    if (wantScan) {
      debug("Scanning started");
      startScanning();
    }
    noble.on("scanStop", () => {
      setTimeout(() => {
        startScanning();
      }, 1000);
    });
  } else {
    noble.stopScanning();
  }
});

export class CircuitCubeDiscoverer extends EventEmitter {
  private _connectedHubs: { [uuid: string]: CircuitCube } = {};

  constructor() {
    super();
    this._discoveryEventHandler = this._discoveryEventHandler.bind(this);
  }

  public async scan() {
    wantScan = true;
    noble.on("discover", this._discoveryEventHandler);

    if (ready) {
      debug("Scanning started");
      startScanning();
    }

    return true;
  }

  public stop() {
    wantScan = false;
    noble.removeListener("discover", this._discoveryEventHandler);
    noble.stopScanning();
  }

  public getHubs() {
    return Object.values(this._connectedHubs);
  }

  public getHubByUUID(uuid: string) {
    return this._connectedHubs[uuid];
  }

  private async _discoveryEventHandler(peripheral: Peripheral) {
    peripheral.removeAllListeners();
    const device = new NobleDevice(peripheral);

    let hub: CircuitCube;

    if (CircuitCube.IsCircuitCube(peripheral)) {
      hub = new CircuitCube(device);
    } else {
      return;
    }

    hub.on("connect", () => {
      debug(`Hub ${hub.uuid} connected`);
      this._connectedHubs[hub.uuid] = hub;
    });

    hub.on("disconnect", () => {
      debug(`Hub ${hub.uuid} disconnected`);
      delete this._connectedHubs[hub.uuid];

      if (wantScan) {
        startScanning();
      }
    });

    debug(`Hub ${hub.uuid} discovered`);

    this.emit("discover", hub);
  }
}
