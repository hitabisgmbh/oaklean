import { UnifiedPath } from '../system'

export class ExportAssetHelper {
	_outputDir: UnifiedPath

	constructor(outputDir: UnifiedPath) {
		this._outputDir = outputDir
	}

	outputDir(): UnifiedPath {
		return this._outputDir
	}

	outputReportPath(title: string): UnifiedPath {
		return this.outputDir().join(`${title}.oak`)
	}

	outputMetricCollectionPath(title: string): UnifiedPath {
		return this.outputDir().join(`${title}.mcollection`)
	}

	outputProfilePath(title: string): UnifiedPath {
		return this.outputDir().join(`${title}.cpuprofile`)
	}

	outputExternalResourceHelperPath(title: string): UnifiedPath {
		return this.outputDir().join(`${title}.resources.json`)
	}

	outputPerformancePath(): UnifiedPath {
		return this.outputDir().join('performance.json')
	}
}