export interface ITaskInfos {
	pid: number
	name: string
	started_abstime_ns: number
	interval_ns: number
	cputime_ns: number
	cputime_ms_per_s: number
	cputime_sample_ms_per_s: number
	cputime_userland_ratio: number
	intr_wakeups: number
	intr_wakeups_per_s: number
	idle_wakeups: number
	idle_wakeups_per_s: number
	timer_wakeups: {
		interval_ns: number
		wakeups: number
		wakeups_per_s: number
	}[]
	diskio_bytesread: number
	diskio_bytesread_per_s: number
	diskio_byteswritten: number
	diskio_byteswritten_per_s: number
	pageins: number
	pageins_per_s: number
	qos_disabled_ns: number
	qos_disabled_ms_per_s: number
	qos_maintenance_ns: number
	qos_maintenance_ms_per_s: number
	qos_background_ns: number
	qos_background_ms_per_s: number
	qos_utility_ns: number
	qos_utility_ms_per_s: number
	qos_default_ns: number
	qos_default_ms_per_s: number
	qos_user_initiated_ns: number
	qos_user_initiated_ms_per_s: number
	qos_user_interactive_ns: number
	qos_user_interactive_ms_per_s: number
	packets_received: number
	packets_received_per_s: number
	packets_sent: number
	packets_sent_per_s: number
	bytes_received: number
	bytes_received_per_s: number
	bytes_sent: number
	bytes_sent_per_s: number
	energy_impact: number
	energy_impact_per_s: number
}

export interface IProcessorOutputFormat {
	cpu_energy: number
	cpu_power: number
	gpu_energy: number
	gpu_power: number
	ane_energy: number
	ane_power: number
	combined_power: number
}

export interface IPowerMetricsOutputFormat {
	is_delta: boolean
	elapsed_ns: number
	hw_model: string
	kern_osversion: string
	kern_bootargs: string
	kern_boottime: string
	timestamp: Date
	tasks: ITaskInfos[]
	processor: IProcessorOutputFormat
}

export interface IPowerMetricsData {
	data: {
		is_delta: boolean
		elapsed_ns: number
		hw_model: string
		kern_osversion: string
		kern_bootargs: string
		kern_boottime: string
		timestamp: string
		tasks: ITaskInfos[]
		processor: IProcessorOutputFormat
	}
	timeDelta: string
}
