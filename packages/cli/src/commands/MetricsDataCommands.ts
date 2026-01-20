import { LoggerHelper, UnifiedPath, MetricsDataCollection, NanoSeconds_BigInt } from '@oaklean/profiler-core'
import { program } from 'commander'

export default class MetricsDataCommands {
	constructor() {
		const baseCommand = program
			.command('metrics-data')
			.alias('md')
			.description('commands to convert or inspect the metrics data collection format')

		baseCommand
			.command('show')
			.description('Displays the metrics data collection as a table')
			.argument('<input>', 'input file path')
			.option('-c, --csv', 'output as csv')
			.action(this.show.bind(this))
	}

	static init() {
		return new MetricsDataCommands()
	}

	async show(
		input: string,
		options: {
			csv?: string
		}
	) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		const outputAsCSV = options.csv !== undefined

		const data = MetricsDataCollection.loadFromFile(inputPath)

		if (data) {
			const pid = data.pid
			const values: {
				processEnergy: string
				systemEnergy: string
				energyPortionOfProcess: string
				duration: NanoSeconds_BigInt
			}[] = []

			if (outputAsCSV) {
				LoggerHelper.log(['process (mJ)', 'system (mJ)', 'portion', 'duration (ns)'].join(','))
			}

			for (const item of data.items) {
				if (item.processIsPresent(pid)) {
					const energyPortionOfProcess = item.energyPortionOfProcess(pid)
					const systemEnergy = item.cpuEnergy()
					const processEnergy = energyPortionOfProcess * systemEnergy

					const data = {
						processEnergy: processEnergy.toFixed(3),
						systemEnergy: systemEnergy.toFixed(3),
						energyPortionOfProcess: energyPortionOfProcess.toFixed(2),
						duration: item.duration
					}

					values.push(data)

					if (outputAsCSV) {
						LoggerHelper.log(
							[data.processEnergy, data.systemEnergy, data.energyPortionOfProcess, data.duration].join(',')
						)
					}
				}
			}

			if (!outputAsCSV) {
				LoggerHelper.table(
					values.map((value) => {
						return {
							'process (mJ)': value.processEnergy,
							'system (mJ)': value.systemEnergy,
							portion: value.energyPortionOfProcess,
							'duration (ns)': value.duration
						}
					}),
					['process (mJ)', 'system (mJ)', 'portion', 'duration (ns)']
				)
			}
		}
	}
}
