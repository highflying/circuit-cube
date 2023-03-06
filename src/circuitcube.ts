import { Peripheral } from "@abandonware/noble";
import { EventEmitter } from "events";
import * as Consts from "./consts";

import Debug = require("debug");
import { NobleDevice } from "./nobleabstraction";
const debug = Debug("circuitcube:hub");

type PowerLevels = [number | undefined, number | undefined, number | undefined];

export interface CircuitCubeDevice {
  setPower: (power: number | undefined) => Promise<void>;
  brake: () => Promise<void>;
  stop: () => Promise<void>;
}

export class CircuitCube extends EventEmitter {
  private _timer: NodeJS.Timeout | undefined;
  protected _name = "";
  protected _batteryLevel = 100;
  protected _bleDevice: NobleDevice;
  private _levels: PowerLevels = [undefined, undefined, undefined];

  public static IsCircuitCube(peripheral: Peripheral) {
    return (
      peripheral.advertisement &&
      peripheral.advertisement.serviceUuids &&
      peripheral.advertisement.serviceUuids.indexOf(
        Consts.BLEService.CIRCUIT_CUBE_1.replace(/-/g, "")
      ) >= 0
    );
  }

  protected _currentPort = 0x3b;

  constructor(bleDevice: NobleDevice) {
    super();
    this._bleDevice = bleDevice;
    bleDevice.on("disconnect", () => {
      this.emit("disconnect");
    });
    debug("Discovered Circuit Cube");
  }

  public get name() {
    return this._bleDevice.name;
  }

  public get connected() {
    return this._bleDevice.connected;
  }

  public get connecting() {
    return this._bleDevice.connecting;
  }

  public get uuid() {
    return this._bleDevice.uuid;
  }

  public get batteryLevel() {
    return this._batteryLevel;
  }

  public sleep(delay: number) {
    return new Promise((resolve) => {
      global.setTimeout(resolve, delay);
    });
  }

  public async connect() {
    debug("Connecting to Circuit Cube");

    if (this._bleDevice.connecting) {
      throw new Error("Already connecting");
    } else if (this._bleDevice.connected) {
      throw new Error("Already connected");
    }

    await this._bleDevice.connect();

    await this._bleDevice.discoverCharacteristicsForService(
      Consts.BLEService.CIRCUIT_CUBE_1
    );
    await this._bleDevice.discoverCharacteristicsForService(
      Consts.BLEService.CIRCUIT_CUBE_2
    );
    this._bleDevice.subscribeToCharacteristic(
      Consts.BLECharacteristic.CIRCUITCUBE_1_NOTIFY,
      this._parseMessage.bind(this)
    );

    const setupTimeout = (ms: number) => {
      this._timer = setTimeout(async () => {
        await this.getVoltage();
        setupTimeout(10_000);
      }, ms);
    };

    setupTimeout(1_000);

    debug("Connect completed");
  }

  public disconnect() {
    if (this._timer) {
      clearTimeout(this._timer);
    }

    return this._bleDevice.disconnect();
  }

  private _parseMessage(data?: Buffer) {
    // console.log('message', data, data?.toString('ascii'));
    if (!data) {
      return;
    }

    if (data.byteLength === 1) {
      // "n?" should return a single byte 00 (success) or 01 (error)
      // "0" seems to also return a single byte 00
      if (data.readInt8() === 0) {
        this.getName();
      }
    } else if (data.byteLength === 4) {
      const level = Number(data.toString("utf-8"));
      if (!isNaN(level)) {
        this._batteryLevel = level;
      }
    } else {
      // should be the device name
      this._name = data.toString("ascii");
    }
  }

  public getDeviceAtPort(port: "A" | "B" | "C"): CircuitCubeDevice {
    const stop = () => {
      const newLevels: PowerLevels = [
        port === "A" ? undefined : this._levels[0],
        port === "B" ? undefined : this._levels[1],
        port === "C" ? undefined : this._levels[2],
      ];
      return this.setPower(newLevels);
    };

    return {
      setPower: (power: number) => {
        const newLevels: PowerLevels = [
          port === "A" ? power : this._levels[0],
          port === "B" ? power : this._levels[1],
          port === "C" ? power : this._levels[2],
        ];
        return this.setPower(newLevels);
      },
      brake: stop,
      stop,
    };
  }

  public async setPower(
    levels: [number | undefined, number | undefined, number | undefined]
  ) {
    this._levels = [levels[0], levels[1], levels[2]];

    const msg = levels
      .map((level, index) => {
        return level !== undefined
          ? level < 0
            ? `${level}${levelMap[index]}`
            : `+${level}${levelMap[index]}`
          : undefined;
      })
      .filter((cmd) => cmd !== undefined)
      .join("");

    const data = Buffer.from(msg, "utf-8");
    return this._bleDevice.writeToCharacteristic(
      Consts.BLECharacteristic.CIRCUITCUBE_2_MULTI_2,
      data,
      true
    );
  }

  public async stopAll() {
    const data = Buffer.from("0", "utf-8");
    return this._bleDevice.writeToCharacteristic(
      Consts.BLECharacteristic.CIRCUITCUBE_2_MULTI_2,
      data,
      true
    );
  }

  public async getVoltage() {
    const data = Buffer.from("b", "utf-8");
    return this._bleDevice.writeToCharacteristic(
      Consts.BLECharacteristic.CIRCUITCUBE_2_MULTI_1,
      data,
      false
    );
  }

  public async getName() {
    const data = Buffer.from("n?", "utf-8");
    return this._bleDevice.writeToCharacteristic(
      Consts.BLECharacteristic.CIRCUITCUBE_2_MULTI_1,
      data,
      true
    );
  }

  // this is following the protocol but does not seem to work
  public async setName(name: string) {
    if (name.length < 1 || name.length > 20) {
      throw new Error("name too long");
    }

    const data = Buffer.concat([
      Buffer.from("n", "utf-8"),
      Buffer.from(name, "utf-8"),
      Buffer.from("\r\n", "utf-8"),
    ]);
    return this._bleDevice.writeToCharacteristic(
      Consts.BLECharacteristic.CIRCUITCUBE_2_MULTI_1,
      data,
      true
    );
  }
}

const levelMap = ["a", "b", "c"];
