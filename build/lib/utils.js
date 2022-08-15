"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var utils_exports = {};
__export(utils_exports, {
  computeDeviceId: () => computeDeviceId,
  computeSensorId: () => computeSensorId,
  getStateRole: () => getStateRole
});
module.exports = __toCommonJS(utils_exports);
function computeDeviceId(self, boxId) {
  return `${self.namespace}.${boxId}`;
}
function computeSensorId(self, boxId, sensor) {
  let distinctChars = boxId.length;
  for (let i = 1; i <= boxId.length - 4; i++) {
    if (boxId[i] === sensor._id[i]) {
      distinctChars--;
    } else {
      break;
    }
  }
  const suffix = sensor._id.slice(-distinctChars);
  const escapedName = sensor.title.replace(/[\.\s]+/g, "_");
  const escapedSensorType = sensor.sensorType.replace(/[\.\s]+/g, "");
  return `${self.namespace}.${boxId}.${escapedName}_${escapedSensorType}_${suffix}`;
}
function getStateRole(sensor) {
  if (sensor.icon === "osem-thermometer")
    return "value.temperature";
  if (sensor.icon === "osem-humidity")
    return "value.humidity";
  return "value";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  computeDeviceId,
  computeSensorId,
  getStateRole
});
//# sourceMappingURL=utils.js.map
