<!-- TABLE OF CONTENTS -->
<details>
	<summary>Table of Contents</summary>
	<ol>
	 <li>
			<a href="#why-oaklean">Why oaklean?</a>
		</li>
		<li>
			<a href="#getting-started">Getting Started</a>
		</li>
	</ol>
</details>

## Why Oaklean?
Oaklean is a groundbreaking software solution that helps developers visualize and optimize the energy consumption of NodeJS applications. Through an innovative VSCode extension and an integration into test frameworks, the system identifies energy-intensive code sections and suggests eco-friendly alternatives. The goal is to raise awareness of responsible resource management in software development, aiming to achieve both ecological and economic benefits.

## Getting Started
The `@oaklean` suite consists mainly of three components that help you to measure your javascript/typescript applications.

1. The `@oaklean/profiler` package helps you to measure your whole application or only some parts of it.
You can find a detailed description of how to use it [here](./packages/profiler/README.md)

2. The `@oaklean/profiler-jest-environment` package allows you to fully automate the energy measurements during your jest tests. This allows comparing changes in energy consumption across multiple development stages and between releases.
You can find a detailed description of how to use it [here](./packages/profiler-jest-environment/README.md)

3. The `Oaklean` VSCode Extension lets you to interpret the measurements. It integrates the energy measurements directly into your IDE.

	**You can find it here:**
	- <a href="https://github.com/hitabisgmbh/oaklean-vscode" target="_blank">Github</a>
	- <a href="https://marketplace.visualstudio.com/items?itemName=HitabisGmbH.oaklean" target="_blank">VS Code Extension</a>

	**Features**
	By using code highlighting it points out which source code locations consume the most energy:
		<br>
		<img src="./images/vscode-code-highlighting.png" width="800px">
		<br>
		Additionally it also provides multiple features to determine the components that consume the most energy, including node modules:
		<br>
		<img src="./images/vscode-explorer.png" width="300px">
		<br>