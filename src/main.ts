/*
 * Created with @iobroker/create-adapter v2.1.1
 */

import * as utils from "@iobroker/adapter-core";
import { isObject } from "alcalzone-shared/typeguards";

import axios from "axios";
import { computeDeviceId, computeSensorId, getStateRole } from "./lib/utils";

class Sensebox extends utils.Adapter {
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "sensebox",
		});
		this.on("ready", this.onReady.bind(this));
		// this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	private nextQuery: ioBroker.Timeout | undefined;

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		this.nextQuery = this.setTimeout(() => this.query(), 0);
	}

	private async query(): Promise<void> {
		this.nextQuery = undefined;

		this.log.debug(`Querying ${this.config.boxes.length} boxes...`);
		for (const boxId of this.config.boxes) {
			await this.queryBox(boxId);
		}

		this.nextQuery = this.setTimeout(
			() => this.query(),
			// Change the interval randomly between 85% and 115% of the configured time
			// to avoid hitting the API too regularly
			this.config.queryInterval * (0.85 + 0.3 * Math.random()),
		);
	}

	private async queryBox(boxId: string): Promise<void> {
		const url = `https://api.opensensemap.org/boxes/${boxId}`;
		let box: SenseBox;
		try {
			this.log.debug(`Querying box ${boxId}...`);
			({ data: box } = await axios.get<SenseBox>(url, {
				timeout: 60000,
				headers: { "User-Agent": `ioBroker.sensebox ${this.version}` },
			}));
			this.log.debug(`success!`);
		} catch (e) {
			let message = `Error querying box ${boxId}. ${
				(e as Error).message
			}`;
			let level: ioBroker.LogLevel = "error";
			if (axios.isAxiosError(e) && e.response) {
				if (
					isObject(e.response.data) &&
					typeof e.response.data.message === "string"
				) {
					message += `: ${e.response.data.message}`;
				}

				if (e.response.status >= 500) {
					// This is nothing the user messed up
					level = "warn";
				}
			}

			this.log[level](message);
			return;
		}

		// Create an object for each box
		const deviceId = computeDeviceId(this, boxId);
		await this.setObjectNotExistsAsync(deviceId, {
			type: "device",
			common: {
				name: box.name,
			},
			native: {
				exposure: box.exposure,
				model: box.model,
			},
		});

		for (const sensor of box.sensors) {
			const stateId = computeSensorId(this, boxId, sensor);
			await this.setObjectNotExistsAsync(stateId, {
				type: "state",
				common: {
					type: "number",
					role: getStateRole(sensor),
					read: true,
					write: false,
					unit: sensor.unit,
					name: sensor.title,
				},
				native: {
					id: sensor._id,
					type: sensor.sensorType,
				},
			});

			await this.setStateAsync(stateId, {
				val: parseFloat(sensor.lastMeasurement.value),
				ack: true,
				ts: new Date(sensor.lastMeasurement.createdAt).getTime(),
			});
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			if (this.nextQuery) this.clearTimeout(this.nextQuery);
			this.nextQuery = undefined;
			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  */
	// private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	// /**
	//  * Is called if a subscribed state changes
	//  */
	// private onStateChange(
	// 	id: string,
	// 	state: ioBroker.State | null | undefined,
	// ): void {
	// 	if (state) {
	// 		// The state was changed
	// 		this.log.info(
	// 			`state ${id} changed: ${state.val} (ack = ${state.ack})`,
	// 		);
	// 	} else {
	// 		// The state was deleted
	// 		this.log.info(`state ${id} deleted`);
	// 	}
	// }

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  */
	// private onMessage(obj: ioBroker.Message): void {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) =>
		new Sensebox(options);
} else {
	// otherwise start the instance directly
	(() => new Sensebox())();
}
