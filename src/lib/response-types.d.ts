type SensorExposure = "indoor" | "outdoor" | "mobile";

interface Sensor {
	_id: string;
	title: string;
	unit: string;
	sensorType: string;
	icon: string;
	lastMeasurement: {
		value: string;
		createdAt: string;
	};
}

interface SenseBox {
	_id: string;
	createdAt: string;
	updatedAt: string;
	name: string;
	exposure: SensorExposure;
	model: string;
	lastMeasurementAt: string;
	sensors: Sensor[];
}
