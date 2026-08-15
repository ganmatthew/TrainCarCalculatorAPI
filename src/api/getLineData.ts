import LRT1 from '../../data/LRT1.json';
import LRT2 from '../../data/LRT2.json';
import MRT3 from '../../data/MRT3.json';

import type { LineData } from '../api/types';

const trainData: LineData[] = [
	LRT1[0] as LineData,
	LRT2[0] as LineData,
	MRT3[0] as LineData
];

const trainDataMap: Record<string, LineData> = {};

for (const lineData of trainData) {
	trainDataMap[lineData.line] = lineData;

	for (const alias of lineData.aliases) {
		trainDataMap[alias] = lineData;
	}
}

function getLineData(line: string) {
	return trainDataMap[line.toUpperCase().trim()];
}

function getLineValues() {
	// Returns both the line name and aliases
	return trainData.flatMap((line) => [
		line.line,
		...line.aliases
	])
}

export { getLineData, getLineValues }