export function computeDeviceId(self: ioBroker.Adapter, boxId: string): string {
	return `${self.namespace}.${boxId}`;
}

export function computeSensorId(
	self: ioBroker.Adapter,
	boxId: string,
	sensor: Sensor,
): string {
	// Try to determine a readable but unique name for the sensor.
	// Box ID:    629dd1ed87a60b001c00f2d8
	// Sensor ID: 629dd1ed87a60b001c00f2dc
	// Distinct (min. 4 chars):       ^^^^
	// Result: Temperatur_HDC1080_f2dc

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

export function getStateRole(sensor: Sensor): string {
	if (sensor.icon === "osem-thermometer") return "value.temperature";
	if (sensor.icon === "osem-humidity") return "value.humidity";
	// TODO: add others
	return "value";
}
