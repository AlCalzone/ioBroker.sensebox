"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_typeguards = require("alcalzone-shared/typeguards");
var import_axios = __toESM(require("axios"));
var import_utils = require("./lib/utils");
class Sensebox extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "sensebox"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  async onReady() {
    this.nextQuery = this.setTimeout(() => this.query(), 0);
  }
  async query() {
    this.nextQuery = void 0;
    this.log.debug(`Querying ${this.config.boxes.length} boxes...`);
    for (const boxId of this.config.boxes) {
      await this.queryBox(boxId);
    }
    this.nextQuery = this.setTimeout(
      () => this.query(),
      this.config.queryInterval * (0.85 + 0.3 * Math.random())
    );
  }
  async queryBox(boxId) {
    const url = `https://api.opensensemap.org/boxes/${boxId}`;
    let box;
    try {
      this.log.debug(`Querying box ${boxId}...`);
      ({ data: box } = await import_axios.default.get(url, {
        timeout: 6e4,
        headers: { "User-Agent": `ioBroker.sensebox ${this.version}` }
      }));
      this.log.debug(`success!`);
    } catch (e) {
      let message = `Error querying box ${boxId}. ${e.message}`;
      if (e.response && (0, import_typeguards.isObject)(e.response.data) && typeof e.response.data.message === "string") {
        message += `: ${e.response.data.message}`;
      }
      this.log.error(message);
      return;
    }
    const deviceId = (0, import_utils.computeDeviceId)(this, boxId);
    await this.setObjectNotExistsAsync(deviceId, {
      type: "device",
      common: {
        name: box.name
      },
      native: {
        exposure: box.exposure,
        model: box.model
      }
    });
    for (const sensor of box.sensors) {
      const stateId = (0, import_utils.computeSensorId)(this, boxId, sensor);
      await this.setObjectNotExistsAsync(stateId, {
        type: "state",
        common: {
          type: "number",
          role: (0, import_utils.getStateRole)(sensor),
          read: true,
          write: false,
          unit: sensor.unit,
          name: sensor.title
        },
        native: {
          id: sensor._id,
          type: sensor.sensorType
        }
      });
      await this.setStateAsync(stateId, {
        val: parseFloat(sensor.lastMeasurement.value),
        ack: true,
        ts: new Date(sensor.lastMeasurement.createdAt).getTime()
      });
    }
  }
  onUnload(callback) {
    try {
      if (this.nextQuery)
        this.clearTimeout(this.nextQuery);
      callback();
    } catch (e) {
      callback();
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Sensebox(options);
} else {
  (() => new Sensebox())();
}
//# sourceMappingURL=main.js.map
