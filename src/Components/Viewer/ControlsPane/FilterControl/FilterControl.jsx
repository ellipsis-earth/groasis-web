import React, { PureComponent } from 'react';
import { GeoJSON } from 'react-leaflet';

import Papa from 'papaparse';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Checkbox from '@material-ui/core/Checkbox';
import Collapse from '@material-ui/core/Collapse';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';
import GroasisUtility from '../../GroasisUtility';

import './FilterControl.css';

import ApiManager from '../../../../ApiManager';

const STANDARD_TILE_LAYER_DISPLAY_NAME = 'standard tiles';
const STANDARD_TILES_LAYER = {
	type: STANDARD_TILE_LAYER_DISPLAY_NAME,
	name: STANDARD_TILE_LAYER_DISPLAY_NAME
};

const MAX_TILES = 500;

class FilterControl extends PureComponent {
	constructor(props, context) {
		super(props, context);

		this.state = {
			availableLayers: [],
			selectedLayers: [],
			geoJsonInfo: [],

			expanded: true,
			filterForm: [],
			filterData: {},
			count: null
		};
	}

	componentDidMount() {
		this.props.onLayersChange([]);
		this.createFilterForm();
	}

	componentDidUpdate(prevProps) {
		if (!this.props.map || !this.props.timestampRange) {
			this.props.onLayersChange([]);
			return;
		}

		let differentMap = this.props.map !== prevProps.map;

		let differentTimestamp = !prevProps.timestampRange ||
			this.props.timestampRange.start !== prevProps.timestampRange.start ||
			this.props.timestampRange.end !== prevProps.timestampRange.end;

		let differentBounds = !prevProps.leafletMapViewport ||
			this.props.leafletMapViewport.bounds.xMin !== prevProps.leafletMapViewport.bounds.xMin ||
			this.props.leafletMapViewport.bounds.xMax !== prevProps.leafletMapViewport.bounds.xMax ||
			this.props.leafletMapViewport.bounds.yMin !== prevProps.leafletMapViewport.bounds.yMin ||
			this.props.leafletMapViewport.bounds.yMax !== prevProps.leafletMapViewport.bounds.yMax;

		if (differentMap || differentTimestamp || differentBounds) {

			let availableLayers = this.state.availableLayers;
			let selectedLayers = this.state.selectedLayers;

			if (differentMap) {
				availableLayers = [STANDARD_TILES_LAYER];
				selectedLayers = [];

				this.setState({
					availableLayers: availableLayers,
					selectedLayers: selectedLayers
				});
			}

			this.prepareLayers(this.props.map, this.props.timestampRange, selectedLayers);
		}
	}

	makeMarks = (min, max, unit) => {
		let marks = [];

		let amount = 4;

		for (let i = 0; i <= amount; i++)
		{
			let value = min + i * max / amount;
			let mark = {
				value: value,
				label: value.toString() + unit,
			};

			marks.push(mark)
		}

		return marks;
	}

	filterChange = (e, value, valueName, category) => {
		let stateObj = this.state.filterData;

		if (!stateObj[category])
		{
			stateObj[category] = {};
		}

		if(stateObj[category][valueName] !== value)
		{
			stateObj[category][valueName] = value;
			this.setState({filterData: stateObj});
		}
	}

	makeInput = (form) => {
		let input = [];
		input.push(<Typography gutterBottom key={form.title + 'Title'}>
			{form.title}
		</Typography>);

		let marks = form.marks ? form.marks : this.makeMarks(form.min, form.max, form.unit);

		input.push(<Slider
			defaultValue={[form.min, form.max]}
			valueLabelDisplay="auto"
			step={form.step}
			marks={marks}
			min={form.min}
			max={form.max}
			key={form.title + 'Slider'}
			onChange={(e, value) => {this.filterChange(e, value, form.valueName, form.category)}}
		/>);

		return input;
	}

	createFilterForm = () => {
		let form = [
			{
				title: 'Average precipitation per year',
				step: 5,
				min: 0,
				max: 1000,
				unit: ' mm',
				category: 'soil',
				valueName: 'precipitation'
			},
			{
				title: 'Organic Content on 0m',
				step: 5,
				min: 0,
				max: 1000,
				unit: ' g/kg',
				category: 'soil',
				valueName: 'organic'
			},
			{
				title: 'Clay Content on 0m in mass percentage',
				step: 5,
				min: 0,
				max: 100,
				unit: ' %',
				category: 'soil',
				valueName: 'clay'
			},
			{
				title: 'Moisture content by NDVI',
				step: 0.1,
				min: -1,
				max: 1,
				unit: ' ',
				category: 'indices',
				valueName: 'moisture',
				marks: [
					{
						value: -1,
						label: 'Very Dry'
					},
					{
						value: -0.5,
						label: 'Dry'
					},
					{
						value: 0,
						label: 'Normal'
					},
					{
						value: 0.5,
						label: 'Moist'
					},
					{
						value: 1,
						label: 'Very Moist'
					}
				]
			}
		];

		let inputs = [];

		for (let i = 0; i < form.length; i++)
		{
			inputs.push(this.makeInput(form[i]));
		}

		this.setState({ filterForm: inputs });
	}

	filterSubmit = (e) => {
		e.preventDefault();
		this.onLayerChange({target: {value: 'standard tiles', checked: true}}, true);
	}

	prepareLayers = (map, timestampRange, selectedLayers) => {
		let promises = [];

		let layers = null;

		if (selectedLayers.includes(STANDARD_TILES_LAYER)) {
			layers = this.prepareStandardTilesLayer(map, timestampRange);
			promises.push(layers);
		}

		Promise.all(promises)
			.then(results => {
				let leafletElements = results.map(x => x.geoJsonElement);
				this.props.onLayersChange(leafletElements);

				let count = [];
				let temp = results && results[0] ? [<span className='red' key='count'>{results[0].count}</span>, <span key='message'>/{MAX_TILES}. Zoom in further.</span>] : null;

				this.setState({ geoJsonInfo: results, count: results && results[0] && results[0].count > MAX_TILES ? temp : null});
			});
	}

	prepareStandardTilesLayer = async (map, timestampRange) => {
		let bounds = this.props.leafletMapViewport.bounds;

		let timestampNumber = timestampRange ?
			map.referenceMap.timestamps[timestampRange.end].timestampNumber :
			map.referenceMap.timestamps[map.timestamps.length - 1].timestampNumber

		let body = {
			mapId: map.referenceMap.id,
			type: ViewerUtility.standardTileLayerType,
			timestamp: timestampNumber,
			xMin: bounds.xMin,
			xMax: bounds.xMax,
			yMin: bounds.yMin,
			yMax: bounds.yMax,
			zoom: map.referenceMap.aggregationZoom,
		};

		return await ApiManager.post('/geometry/ids', body, this.props.user)
			.then(async standardTileIds => {
				let result = {
					name: STANDARD_TILE_LAYER_DISPLAY_NAME,
					count: standardTileIds.count,
					bounds: bounds,
					geoJson: null,
					geoJsonElement: null
				};

				let filterDataKeys = Object.keys(this.state.filterData);
				if (result.count === 0 || (result.count > MAX_TILES && filterDataKeys === 0))
				{
					return result;
				}

				if (filterDataKeys.length !== 0)
				{
					let filteredIds = [];

					for (let i = 0; i < filterDataKeys.length; i++)
					{
						let requestBody = {
				      type: ViewerUtility.standardTileLayerType,
				      dataType: ViewerUtility.dataType.meanMeasurement,
				    	elementIds: standardTileIds.ids,
				    };

						if (filterDataKeys[i] === 'indices')
						{
							requestBody.mapId = this.props.map[GroasisUtility.types.lowRes].id;
				      requestBody.timestamp = map.referenceMap.timestamps[timestampRange.end].timestampNumber;
						}
						else if (filterDataKeys[i] === 'soil')
						{
							requestBody.mapId = this.props.map[GroasisUtility.types.soil].id;
							requestBody.timestamp = 0;
						}


						let filterData = await ApiManager.post('/data/ids', requestBody, this.props.user);
						filterData = Papa.parse(filterData, {header: true, fastMode: true, dynamicTyping: true, skipEmptyLines: true}).data;

						let category = filterDataKeys[i];

						for (var j = 0; j < filterData.length; j++)
						{
							for(let key in this.state.filterData[category])
							{
								if (key === 'precipitation')
								{
									let keys = ['precipitation jan 2011', 'precipitation feb 2011', 'precipitation mar 2011', 'precipitation apr 2011', 'precipitation may 2011', 'precipitation jun 2011', 'precipitation jul 2011', 'precipitation aug 2011', 'precipitation sept 2011', 'precipitation oct 2011', 'precipitation nov 2011', 'precipitation dec 2011'];
									let precipitation = 0;

									for (let k = 0; k < keys.length; k++)
									{
										precipitation = precipitation + filterData[j][keys[k]];
									}

									if (precipitation < this.state.filterData[category][key][0] || precipitation > this.state.filterData[category][key][1])
									{
										filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
										delete filterData[j];
									}
								}
								else if (key === 'organic')
								{
									if (filterData[j]['organic content g/kg 0m'] < this.state.filterData[category][key][0] || filterData[j]['organic content g/kg 0m'] > this.state.filterData[category][key][1])
									{
										filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
										delete filterData[j];
									}
								}
								else if (key === 'clay')
								{
									if (filterData[j]['clay content mass percentage 0m'] < this.state.filterData[category][key][0] || filterData[j]['clay content mass percentage 0m'] > this.state.filterData[category][key][1])
									{
										filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
										delete filterData[j];
									}
								}
								else if (key === 'moisture')
								{
									if (filterData[j]['ndvi'] < this.state.filterData[category][key][0] || filterData[j]['ndvi'] > this.state.filterData[category][key][1])
									{
										filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
										delete filterData[j];
									}
								}
							}
						}

						for (let k = filteredIds.length - 1; k >= 0; k--)
						{
							for (let j = standardTileIds.ids.length - 1; j >= 0; j--)
							{
								if (standardTileIds.ids[j] && filteredIds[k].tileX === standardTileIds.ids[j].tileX && filteredIds[k].tileY === standardTileIds.ids[j].tileY)
								{
									standardTileIds.count = standardTileIds.count - 1;
									standardTileIds.ids.splice(j, 1);
								}
							}
						}
					}
				}

				result = {
					name: STANDARD_TILE_LAYER_DISPLAY_NAME,
					count: standardTileIds.count,
					bounds: bounds,
					geoJson: null,
					geoJsonElement: null
				};

				if (result.count === 0 || result.count > MAX_TILES)
				{
					return result;
				}

				body = {
					mapId: map.referenceMap.id,
					type: ViewerUtility.standardTileLayerType,
					timestamp: map.referenceMap.timestamps[timestampRange.end].timestampNumber,
					elementIds: standardTileIds.ids
				};

				result.geoJson = await ApiManager.post('/geometry/get', body, this.props.user);
				result.geoJsonElement = (
					<GeoJSON
						key={Math.random()}
						data={result.geoJson}
						style={ViewerUtility.createGeoJsonLayerStyle('cornflowerblue', 1, 0.5)}
						zIndex={ViewerUtility.standardTileLayerZIndex}
						onEachFeature={(feature, layer) => layer.on({ click: () => this.onFeatureClick(feature) })}
					/>
				);

				return result;
			});
	}

	onLayerChange = (e, override = false) => {
		let newSelectedLayers = null;
		let changed = false;

		if (!override)
		{
			let layerName = e.target.value;
			let checked = e.target.checked;

			let isSelected = this.state.selectedLayers.find(x => x.name === layerName);


			if (checked && !isSelected) {
				let availableLayer = this.state.availableLayers.find(x => x.name === layerName);

				newSelectedLayers = [...this.state.selectedLayers, availableLayer];

				changed = true;
			}
			else if (!checked && isSelected) {
				newSelectedLayers = Utility.arrayRemove(this.state.selectedLayers, isSelected);

				newSelectedLayers = [...newSelectedLayers];

				changed = true;
			}
		}

		if (changed || override)
		{
			this.setState({ selectedLayers: newSelectedLayers ? newSelectedLayers : [STANDARD_TILES_LAYER] });
			this.prepareLayers(this.props.map, this.props.timestampRange, newSelectedLayers ? newSelectedLayers : this.state.selectedLayers);
		}
	}

	onExpandClick = () => {
		this.setState({ expanded: !this.state.expanded });
	}

	onFeatureClick = (feature) => {
		this.props.onFeatureClick(feature);
	}

	onDownload = (layerName) => {
		let layerGeoJsonInfo = this.state.geoJsonInfo.find(x => x.name === layerName);

		if (!layerGeoJsonInfo) {
			return;
		}

		let bounds = layerGeoJsonInfo.bounds;

		let decimals = 4;

		let nameComponents = [
			this.props.map.name,
			'tiles',
			bounds.xMin.toFixed(decimals),
			bounds.xMax.toFixed(decimals),
			bounds.yMin.toFixed(decimals),
			bounds.yMax.toFixed(decimals)
		];

		let fileName = nameComponents.join('_') + '.geojson';

		ViewerUtility.download(fileName, JSON.stringify(layerGeoJsonInfo.geoJson), 'application/json');
	}

	render() {
		if (!this.props.map || this.state.availableLayers.length === 0) {
			return null;
		}

		return (
			<Card className='layers-contol'>
				<CardHeader
					className='material-card-header'
					title={
						<Typography gutterBottom variant="h6" component="h2">
							Filter
						</Typography>
					}
					action={
						<IconButton
							className={this.state.expanded ? 'expand-icon expanded' : 'expand-icon'}
							onClick={this.onExpandClick}
							aria-expanded={this.state.expanded}
							aria-label='Show'
						>
							<ExpandMoreIcon />
						</IconButton>
					}
				/>
				<Collapse in={this.state.expanded}>
					<CardContent
						className={'card-content'}
					>
						{this.state.filterForm}
						<div className='button_count'>
							<Button key='submit' variant='contained' color='primary' onClick={this.filterSubmit}>Filter</Button>
							<span key={this.state.count}>{this.state.count}</span>
						</div>
					</CardContent>
				</Collapse>
			</Card>
		);
	}
}

/*function calculateTileBounds(bounds, zoom) {
	let pi = Math.PI;
	let zoomComp = Math.pow(2, zoom);

	let comp1 = zoomComp / 360;
	let comp2 = 2 * pi;
	let comp3 = pi / 4;

	let tileXMin = Math.floor((bounds.xMin + 180) * comp1);
	let tileYMin = Math.floor(zoomComp / comp2 * (pi - Math.log(Math.tan(comp3 + bounds.yMax / 360 * pi))));

	let tileXMax = Math.floor((bounds.xMax + 180 ) * comp1 + 1);
	let tileYMax = Math.floor(zoomComp / comp2 * (pi - Math.log(Math.tan(comp3 + bounds.yMin / 360 * pi))) + 1);

	return {
		tileXMin: tileXMin,
		tileYMin: tileYMin,

		tileXMax: tileXMax,
		tileYMax: tileYMax,
		count: (tileXMax - tileXMin) * (tileYMax - tileYMin)
	};
}

function tileBoundsToGeoJson(tileBounds, zoom) {
	let result = {
		type: 'FeatureCollection',
		count: tileBounds.count,
		features: []
	};

	for (let tileY = tileBounds.tileYMin; tileY < tileBounds.tileYMax; tileY++) {
		for (let tileX = tileBounds.tileXMin; tileX < tileBounds.tileXMax; tileX++) {
			let tile = {
				tileX: tileX,
				tileY: tileY,
				zoom: zoom
			};

			let tileCoord = calculateTileCoords(tile, zoom);

			let coords = [[
				[tileCoord.xMin, tileCoord.yMin],
				[tileCoord.xMax, tileCoord.yMin],
				[tileCoord.xMax, tileCoord.yMax],
				[tileCoord.xMin, tileCoord.yMax],
				[tileCoord.xMin, tileCoord.yMin]
			]];

			let feature = {
				id: result.features.length,
				type: "Feature",
				properties: {
					type: ViewerUtility.wmsTileLayerType,
					tileX: tile.tileX,
					tileY: tile.tileY,
					zoom: tile.zoom
				},
				geometry: {
					type: 'Polygon',
					coordinates: coords
				}
			};

			result.features.push(feature);
		}
	}

	return result;
}

const comp1 = (360 / (2 * Math.PI));
const comp3 = Math.PI / 2;

function calculateTileCoords(tile) {
	let pi = Math.PI;

	let tileX = tile.tileX;
	let tileY = tile.tileY;
	let zoom = tile.zoom;

	let comp2 = Math.pow(2, zoom);

	let xMin = ((tileX * 360) / comp2) - 180;
	let xMax = ((tileX + 1) * 360 / comp2) - 180;
	let yMin = comp1 * (2 * (Math.atan(Math.exp(-2 * (pi * (tileY + 1)) / comp2 + pi))) - comp3);
	let yMax = comp1 * (2 * (Math.atan(Math.exp(-2 * (pi * tileY) / comp2 + pi))) - comp3);

	return {
		xMin: xMin,
		xMax: xMax,
		yMin: yMin,
		yMax: yMax
	};
}*/

export default FilterControl;
