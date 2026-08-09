import React from 'react';
import type { StationTableProps, Station } from "../api/types"


function formatAliases(aliases: string[]) {
	if (!aliases || aliases.length === 0) {
		return '-';
	}
	return aliases.join(', ');
}

function formatExitValues(exits: string[]) {
	if (!exits || exits.length === 0) {
		return '-';
	}
	return exits.map((exit, index) => (
  	<React.Fragment key={index}>
			<code>{index}</code>: {exit} {index < exits.length - 1 && ( <> <br /> <br /> </> )}
		</React.Fragment>
	));
}

function formatDirectionMap(dirMap: number[]) {
	if (!dirMap || dirMap.length === 0) {
		return "-"
	}
  	return JSON.stringify(dirMap);
}

export default function StationTable({ lineData }: StationTableProps) {
	const directionA = lineData.directions[0];
	const directionB = lineData.directions[1];

	return (
		<>
			<ul>
				<li>
					<strong>Line:</strong> {lineData.line}
				</li>
				<li>
					<strong>Directions:</strong>{' '}
					{lineData.directions.map((direction: string, index: number) => (
						<React.Fragment key={index}>
							<code>{direction}</code>
							{index < lineData.directions.length - 1 ? ', ' : ''}
						</React.Fragment>
					))}
				</li>
				<li>
					<strong>Car configs:</strong>{' '}
					{lineData.numberOfCars.map((config: number, index: number) => (
						<React.Fragment key={index}>
							<code>{config}</code>
							{index < lineData.numberOfCars.length - 1 ? ', ' : ''}
						</React.Fragment>
					))}
				</li>
			</ul>

			<table>
				<thead>
					<tr>
						<th rowSpan={2}>Index</th>
						<th rowSpan={2}>Station</th>
						<th rowSpan={2}>Aliases</th>
						<th rowSpan={2}>Platform</th>
						<th rowSpan={2}>Exits</th>
						<th colSpan={2}>Exit Map</th>
					</tr>
					<tr>
						<th>{directionA}</th>
						<th>{directionB}</th>
					</tr>
				</thead>
				<tbody>
					{lineData.stations.map((station: Station, stationIndex: number) => {
						const exits = station.exits ?? [];
						const directionMapA = station.exitMap?.[directionA]?.[0];
						const directionMapB = station.exitMap?.[directionB]?.[0];
						return (
							<tr key={`${station.name}-${stationIndex}`}>
								<td>{stationIndex}</td>
								<td>{station.name}</td>
								<td>{formatAliases(station.aliases)}</td>
								<td>{station.platformType}</td>
								<td>{formatExitValues(exits)}</td>
								<td>{formatDirectionMap(directionMapA)}</td>
								<td>{formatDirectionMap(directionMapB)}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</>
  	);
}