import { Characteristic, Peripheral, Service } from "@abandonware/noble";

import Debug = require("debug");
import { EventEmitter } from "events";
const debug = Debug("bledevice");

export class NobleDevice extends EventEmitter {
  private _noblePeripheral: Peripheral;

  private _uuid: string;

  private _characteristics: { [uuid: string]: Characteristic } = {};

  private _connected = false;
  private _connecting = false;

  constructor(device: any) {
    super();
    this._noblePeripheral = device;
    this._uuid = device.uuid;
    device.on("disconnect", () => {
      this._connecting = false;
      this._connected = false;
      this.emit("disconnect");
    });
  }

  public get uuid() {
    return this._uuid;
  }

  public get name() {
    return this._noblePeripheral.advertisement.localName;
  }

  public get connecting() {
    return this._connecting;
  }

  public get connected() {
    return this._connected;
  }

  public connect() {
    return new Promise<void>((resolve, reject) => {
      this._connecting = true;
      this._noblePeripheral.connect((err: string) => {
        if (err) {
          return reject(err);
        }

        this._connecting = false;
        this._connected = true;
        return resolve();
      });
    });
  }

  public disconnect() {
    return new Promise<void>((resolve) => {
      this._noblePeripheral.disconnect();
      this._connecting = false;
      this._connected = false;
      return resolve();
    });
  }

  public discoverCharacteristicsForService(uuid: string) {
    return new Promise<void>(async (discoverResolve, discoverReject) => {
      uuid = this._sanitizeUUID(uuid);
      this._noblePeripheral.discoverServices(
        [uuid],
        (err: string, services: Service[]) => {
          if (err) {
            return discoverReject(err);
          }
          debug("Service/characteristic discovery started");
          const servicePromises: Promise<void>[] = [];
          services.forEach((service) => {
            servicePromises.push(
              new Promise((resolve) => {
                service.discoverCharacteristics([], (_err, characteristics) => {
                  characteristics.forEach((characteristic) => {
                    this._characteristics[characteristic.uuid] = characteristic;
                  });
                  return resolve();
                });
              })
            );
          });

          Promise.all(servicePromises).then(() => {
            debug("Service/characteristic discovery finished");
            return discoverResolve();
          });
        }
      );
    });
  }

  public subscribeToCharacteristic(
    uuid: string,
    callback: (data: Buffer) => void
  ) {
    uuid = this._sanitizeUUID(uuid);
    this._characteristics[uuid].on("data", (data: Buffer) => {
      return callback(data);
    });
    this._characteristics[uuid].subscribe((err) => {
      if (err) {
        throw new Error(err);
      }
    });
  }

  public readFromCharacteristic(
    uuid: string,
    callback: (err: string | null, data: Buffer | null) => void
  ) {
    uuid = this._sanitizeUUID(uuid);
    this._characteristics[uuid].read((err: string, data: Buffer) => {
      return callback(err, data);
    });
  }

  public writeToCharacteristic(
    uuid: string,
    data: Buffer,
    writeWithoutReponse = false
  ) {
    return new Promise<void>((resolve, reject) => {
      uuid = this._sanitizeUUID(uuid);
      this._characteristics[uuid].write(data, writeWithoutReponse, (error) => {
        if (error) {
          return reject(error);
        }

        return resolve();
      });
    });
  }

  private _sanitizeUUID(uuid: string) {
    return uuid.replace(/-/g, "");
  }
}
