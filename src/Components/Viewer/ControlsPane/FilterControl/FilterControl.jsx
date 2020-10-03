import React, { Component } from 'react';
import { GeoJSON } from 'react-leaflet';

import Papa from 'papaparse';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Slider from '@material-ui/core/Slider';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Zoom from '@material-ui/core/Zoom';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import InfoIcon from '@material-ui/icons/Info';

import Utility from '../../../../Utility';
import GroasisUtility from '../../GroasisUtility';
import ViewerUtility from '../../ViewerUtility';

import './FilterControl.css';

import ApiManager from '../../../../ApiManager';

const STANDARD_TILE_LAYER_DISPLAY_NAME = 'standard tiles';
const STANDARD_TILES_LAYER = {
	type: STANDARD_TILE_LAYER_DISPLAY_NAME,
	name: STANDARD_TILE_LAYER_DISPLAY_NAME
};

const MAX_TILES = 3000;

class FilterControl extends Component {
	constructor(props, context) {
		super(props, context);

		this.state = {
			availableLayers: [STANDARD_TILES_LAYER],
			selectedLayers: [],
			geoJsonInfo: [],

			expanded: true,
			filterForm: [],
			filterData: {},
			count: null,

			loading: false,

			open: [],
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

		let differentBounds = !prevProps.leafletMapViewport ||
			this.props.leafletMapViewport.bounds.xMin !== prevProps.leafletMapViewport.bounds.xMin ||
			this.props.leafletMapViewport.bounds.xMax !== prevProps.leafletMapViewport.bounds.xMax ||
			this.props.leafletMapViewport.bounds.yMin !== prevProps.leafletMapViewport.bounds.yMin ||
			this.props.leafletMapViewport.bounds.yMax !== prevProps.leafletMapViewport.bounds.yMax;

		if (differentMap || differentBounds) {

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

	handleChange = (e) => {
		this.setState({ loading: true }, this.onLayerChange({target: {value: 'standard tiles', checked: e.target.checked}}));
	}

	getSoilLayerData = async (layerName) => {
    let dataPromises = [];
    let url = GroasisUtility.getSoilUrl(GroasisUtility.getGroasisNameFromAnalyse(layerName));

    if(url)
    {
      dataPromises.push(fetch(url, {
        method: 'GET'
      })
      .then(result => {
        if (result.status === 200 && result.ok)
        {
          return result.json()
        }
      }))
    }

    let gottenData = await Promise.all(dataPromises)
    .then(results => {
      let returnData = {};
      for (let i = 0; i < results.length; i++)
      {
        let x = results[i];
        let name = GroasisUtility.getSoilName(x.StyledLayerDescriptor.NamedLayer.Name);
        let colors = x.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle.Rule.RasterSymbolizer.ColorMap.ColorMapEntry;
        let unit = x.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle.Rule.RasterSymbolizer.Geometry.PropertyName.split(' - ')[0];
        returnData[name] = {colors: colors, unit: unit};
      }

      return returnData;
    })
    .catch(err => console.error(err));

    return gottenData;
  }

	filterChange = (e, value, valueName, category) => {

		let stateObj = this.state.filterData;

		if (!stateObj[category])
		{
			stateObj[category] = {};
		}

		if (!stateObj[category][valueName])
		{
			stateObj[category][valueName] = {};
		}

		if(category === 'moisture'){
			stateObj[category][valueName].value = value
		}else{
			stateObj[category][valueName].value = value.map(x => x*stateObj[category][valueName].offset);
		}
		stateObj[category][valueName].checked = true;

		this.setState({filterData: stateObj});
	}

	filterSelectionChange = async (e, checked, valueName, category) => {
		let stateObj = this.state.filterData;

		if (!stateObj[category])
		{
			stateObj[category] = {};
		}

		if (!stateObj[category][valueName])
		{
			stateObj[category][valueName] = {};
		}

		if (category === 'soil' && GroasisUtility.soilLayers[valueName.toLowerCase()])
		{
			let soilLayerName = GroasisUtility.soilLayers[valueName.toLowerCase()]
      let soilData = this.props.map.metadata && this.props.map.metadata.soilLayers ? this.props.map.metadata.soilLayers : {};
			let name = Object.keys(soilData).find(x => x === soilLayerName);

      if (!name)
      {
        let gottenData = await this.getSoilLayerData(soilLayerName);
        soilData = {...soilData, ...gottenData};
        name = Object.keys(soilData).find(x => x === soilLayerName);
      }

	    let units = GroasisUtility.getUnit(soilData[name].unit);
			stateObj[category][valueName].offset = units.value;
		}

		if(stateObj[category][valueName].checked !== checked)
		{
			stateObj[category][valueName].checked = checked;

			this.setState({filterData: stateObj});
		}
	}

	changeOpen = (input) => {
		let open = this.state.open;

		let index = open.indexOf(input);

		if (index !== -1)
		{
			open.splice(index, 1);
		}
		else
		{
			open.push(input);
		}

		this.setState({open: open});
	}

	createFilterForm = () => {
		let form = [
			{
				name: 'soil',
				filters: [
					{
						title: GroasisUtility.soilLayers.organic,
						step: 0.1,
						min: 0,
						max: 20,
						unit: '%',
						category: 'soil',
						valueName: 'organic',
						text: 'Measured on 0.3m in %'
					},
					{
						title: GroasisUtility.soilLayers.clay,
						step: 0.1,
						min: 0,
						max: 20,
						unit: ' %',
						category: 'soil',
						valueName: 'clay',
						text: 'Measured on 0.3m in %'
					},
					{
						title: GroasisUtility.soilLayers.coarse,
						step: 0.1,
						min: 0,
						max: 20,
						unit: '%',
						category: 'soil',
						valueName: 'coarse',
						text: 'Measured on 0.3m in %'
					},
					{
						title: GroasisUtility.soilLayers.sand,
						step: 0.1,
						min: 0,
						max: 20,
						unit: '%',
						category: 'soil',
						valueName: 'sand',
						text: 'Measured on 0.3m in %'
					},
					{
						title: GroasisUtility.soilLayers.ph,
						step: 0.1,
						min: 0,
						max: 14,
						unit: '',
						category: 'soil',
						valueName: 'pH',
						text: 'Measured on 0.3m'
					},
					{
						title: 'Moisture content',
						step: 0.1,
						min: -1,
						max: 1,
						unit: '',
						category: 'moisture',
						valueName: 'mi',
						marks: [
							{ value: -1, 		label: 'Very Dry'},
							{ value: -0.5, 	label: 'Dry'},
							{ value: 0, 		label: 'Normal'},
							{ value: 0.5, 	label: 'Moist'},
							{ value: 1, 		label: 'Very Moist'}
						],
						text: 'Measured by MI'
					},
					{
						title: 'Slope',
						step: 1,
						min: 0,
						max: 90,
						unit: '°',
						category: 'altitude',
						valueName: 'slope',
						text: 'Measured in degrees'
					},
				]
			}/*,
			{
				name: 'climate',
				filters: [
					{
						title: 'Precipitation',
						step: 5,
						min: 0,
						max: 1000,
						unit: ' mm',
						category: 'soil',
						valueName: 'precipitation',
						text: 'Average precipitation per year'
					},
					{
						title: 'Temperature Range',
						step: 5,
						min: -25,
						max: 50,
						unit: ' °C',
						category: 'soil',
						valueName: 'temperature',
						text: 'Maximum and minimum temperature in selected area'
					},
					{
						title: 'Cloud Cover',
						step: 5,
						min: 0,
						max: 100,
						unit: ' %',
						category: 'soil',
						valueName: 'cloud_cover',
						text: 'Percentage of selected area covered by cloud'
					},
				],
			},*/
		]

		let filterForm = [];

		for (let i = 0; i < form.length; i++)
		{
			let inputs = [];

			for (let j = 0; j < form[i].filters.length; j++)
			{
				inputs.push(
      		<FilterInput
      			key={form[i].filters[j].title + '_FilterInputComponent'}
      			form={form[i].filters[j]}
      			filterSelectionChange={this.filterSelectionChange}
      			filterChange={this.filterChange}
    			/>);
			}

			filterForm.push({name: form[i].name, inputs: <List dense disablePadding>{inputs}</List>});
		}

		this.setState({ filterForm: filterForm });
	}

	filterSubmit = (e) => {
		e.preventDefault();
		this.setState({loading: true}, () => {
			this.onLayerChange({target: {value: 'standard tiles', checked: true}}, true);
		})
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
				let leafletElements = results.map(x => {if(x){return x.geoJsonElement} return null});
				this.props.onLayersChange(leafletElements);

				let countMessage = null;

				if (typeof results === 'object' && results.length === 0)
				{
					countMessage = [<span key='count'>0</span>, <span key='message'>/{MAX_TILES}</span>];
				}
				else if (results[0] && (results[0].count || results[0].count === 0))
				{
					if (results[0].count > MAX_TILES)
					{
						countMessage = [<div key={'countDiv' + results[0].count}><span className='red' key='count'>{results[0].count}</span><span>/{MAX_TILES}</span></div>, <span key='message'> <p style={{'color':'red'}}>Zoom in further or change filters.</p></span>];
					}
					else
					{
						countMessage = [<span key='count'>{results[0].count}</span>, <span key='message'>/{MAX_TILES}</span>];
					}
				}

				this.setState({ geoJsonInfo: results, loading: false, count: countMessage});
			})
			.catch(error => {
				console.error(error)
				this.setState({loading: false});
			});
	}

	prepareStandardTilesLayer = async (map, timestampRange) => {
		let bounds = this.props.leafletMapViewport.bounds;
		let soilMap = this.props.map.maps.find(x => x.dataSource.id === "ce6650f0-91b8-481c-bc17-7a38f12658a1");
		let lowResMap = this.props.map.maps.find(x => ["4c450c42-1bf6-11e9-96ea-f0038c0f0121", "48d31d14-8cdd-401e-84a0-42941ad19dd6"].includes(x.dataSource.id));
		let altitudeMap = this.props.map.maps.find(x => x.dataSource.id === "bcf28bab-33e2-4259-a64f-466368efdc8d")
		let timestampNumber = lowResMap.timestamps[lowResMap.timestamps.length - 1].timestamp;


		let body = {
			mapId: soilMap.id,
			type: ViewerUtility.standardTileLayerType,
			timestamp: 0,
			xMin: bounds.xMin,
			xMax: bounds.xMax,
			yMin: bounds.yMin,
			yMax: bounds.yMax,
			zoom: soilMap.aggregationZoom,
			limit: MAX_TILES
		};

		return await ApiManager.post('/geometry/ids', body, this.props.user)
			.then(async standardTileIds => {
				let result = {
					name: STANDARD_TILE_LAYER_DISPLAY_NAME,
					count: standardTileIds.count ? standardTileIds.count : 0,
					bounds: bounds,
					geoJson: null,
					geoJsonElement: null,
				};


				if(result.count >=3000 || result.count ===0){
					return result
				}
				let nonDataIds = [];

				let filterDataKeys = Object.keys(this.state.filterData);


				if (filterDataKeys.length !== 0 && standardTileIds.ids.length !== 0)
				{
					let filteredIds = [];

					for (let i = 0; i < filterDataKeys.length; i++)
					{
						let requestBody = {
							type: ViewerUtility.standardTileLayerType,
							dataType: ViewerUtility.dataType.meanMeasurement,
							elementIds: standardTileIds.ids,
						};
						if (filterDataKeys[i] === 'moisture')
						{
							requestBody.mapId = lowResMap.id;
							requestBody.timestamp = 0;
						}
						else if (filterDataKeys[i] === 'soil')
						{
							requestBody.mapId = soilMap.id;
							requestBody.timestamp = 0;
						}
						else if(filterDataKeys[i] === 'altitude')
						{
							requestBody.mapId = altitudeMap.id;
							requestBody.timestamp = 0;
						}

						if(standardTileIds.ids.length > 0)
						{
							let filterData = await ApiManager.post('/data/ids', requestBody, this.props.user);

							filterData = Papa.parse(filterData, {header: true, dynamicTyping: true}).data;

							if(standardTileIds.ids.length > filterData.length)
							{
								for(let j = standardTileIds.count - 1; j >= 0; j--)
								{
									let filterNonData = filterData.find(x => x.tileX === standardTileIds.ids[j].tileX && x.tileY === standardTileIds.ids[j].tileY);
									if (!filterNonData)
									{
										filteredIds.push({tileX: standardTileIds.ids[j].tileX, tileY: standardTileIds.ids[j].tileY});
									}
								}
							}

							let category = filterDataKeys[i];
							let keys = Object.keys(filterData[0]);
							for (let j = filterData.length - 1; j >= 0; j--)
							{
								for(let key in this.state.filterData[category])
								{
										console.log(key)
									if (key === 'precipitation' && filterData[j])
									{
										let precipitationKeys = keys.filter(x => x.includes('precipitation'));
										//['precipitation jan 2011', 'precipitation feb 2011', 'precipitation mar 2011', 'precipitation apr 2011', 'precipitation may 2011', 'precipitation jun 2011', 'precipitation jul 2011', 'precipitation aug 2011', 'precipitation sept 2011', 'precipitation oct 2011', 'precipitation nov 2011', 'precipitation dec 2011']
										let precipitation = 0;

										for (let k = 0; k < precipitationKeys.length; k++)
										{
											precipitation = precipitation + filterData[j][precipitationKeys[k]];
										}

										if (this.state.filterData[category][key].checked && this.state.filterData[category][key].value)
										{
											if(precipitation < this.state.filterData[category][key].value[0] || precipitation > this.state.filterData[category][key].value[1])
											{
												filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
												delete filterData[j];
											}
										}
									}
									else if (key === 'temperature')
									{
										if (this.state.filterData[category][key].checked && this.state.filterData[category][key].value && filterData[j])
										{
											let tempKeys = keys.filter(x => x.includes('temp'));
											let max = -100000;
											let min = 100000;

											for (var l = 0; l < tempKeys.length; l++)
											{
												if(filterData[j][tempKeys[l]] > max)
												{
													max = filterData[j][tempKeys[l]];
												}

												if(filterData[j][tempKeys[l]] < min)
												{
													min = filterData[j][tempKeys[l]];
												}
											}

											let minInput = this.state.filterData[category][key].value[0];
											let maxInput = this.state.filterData[category][key].value[1];

											if(min < minInput || max > maxInput || min > maxInput || max < minInput)
											{
												filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
												delete filterData[j];
											}
										}
									}
									else if (key === 'cloud_cover')
									{
										if (this.state.filterData[category][key].checked && this.state.filterData[category][key].value)
										{
											if(!filterData[j] || (!filterData[j]['cloud_cover'] && filterData[j]['cloud_cover'] !== 0) || !(filterData[j]['cloud_cover'] >= this.state.filterData[category][key].value[0] && filterData[j]['cloud_cover'] <= this.state.filterData[category][key].value[1]))
											{
												filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
												delete filterData[j];
											}
										}
									}
									else if (key === 'organic')
									{
										if (this.state.filterData[category][key].checked && this.state.filterData[category][key].value)
										{
											if(!filterData[j] || (!filterData[j]['Soil organic carbon content 15-30cm'] && filterData[j]['Soil organic carbon content 15-30cm'] !== 0) || !(filterData[j]['Soil organic carbon content 15-30cm'] >= this.state.filterData[category][key].value[0] && filterData[j]['Soil organic carbon content 15-30cm'] <= this.state.filterData[category][key].value[1]))
											{
												filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
												delete filterData[j];
											}
										}
									}
									else if (key === 'clay')
									{
										if (this.state.filterData[category][key].checked && this.state.filterData[category][key].value)
										{
											if(!filterData[j] || (!filterData[j]['clay 15-30cm'] && filterData[j]['clay 15-30cm'] !== 0) || !(filterData[j]['clay 15-30cm'] >= this.state.filterData[category][key].value[0] && filterData[j]['clay 15-30cm'] <= this.state.filterData[category][key].value[1]))
											{
												filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
												delete filterData[j];
											}
										}
									}
									else if (key === 'sand')
									{
										if (this.state.filterData[category][key].checked && this.state.filterData[category][key].value)
										{
											if(!filterData[j] || (!filterData[j]['sand 15-30cm'] && filterData[j]['sand 15-30cm'] !== 0) || !(filterData[j]['sand 15-30cm'] >= this.state.filterData[category][key].value[0] && filterData[j]['sand 15-30cm'] <= this.state.filterData[category][key].value[1]))
											{
												filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
												delete filterData[j];
											}
										}
									}
									else if (key === 'pH')
									{
										if (this.state.filterData[category][key].checked && this.state.filterData[category][key].value)
										{
											if(!filterData[j] || (!filterData[j]['ph 15-30cm'] && filterData[j]['ph 15-30cm'] !== 0) || !(filterData[j]['ph 15-30cm'] >= this.state.filterData[category][key].value[0] && filterData[j]['ph 15-30cm'] <= this.state.filterData[category][key].value[1]))
											{
												filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
												delete filterData[j];
											}
										}
									}
									else if (key === 'mi')
									{
										console.log(filterData[j]['mi'])
										console.log(this.state.filterData)
										if (this.state.filterData[category][key].checked && this.state.filterData[category][key].value)
										{
											if(!filterData[j] || (!filterData[j]['mi'] && filterData[j]['mi'] !== 0) || !(filterData[j]['mi'] >= this.state.filterData[category][key].value[0] && filterData[j]['mi'] <= this.state.filterData[category][key].value[1]))
											{
												filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
												delete filterData[j];
											}
										}
									}
									else if (key === 'altitude')
									{
										if (this.state.filterData[category][key].checked && this.state.filterData[category][key].value)
										{
											if(!filterData[j] || (!filterData[j]['slope'] && filterData[j]['slope'] !== 0) || !((Math.atan(1/ filterData[j]['slope']) * 180 / Math.PI) >= this.state.filterData[category][key].value[0] && (Math.atan(filterData[j]['slope']) * 180 / Math.PI) <= this.state.filterData[category][key].value[1]))
											{
												filteredIds.push({tileX: filterData[j].tileX, tileY: filterData[j].tileY});
												delete filterData[j];
											}
										}
									}
								}
							}
						}

						for (let k = filteredIds.length - 1; k >= 0; k--)
						{
							for (let j = standardTileIds.ids.length - 1; j >= 0; j--)
							{
								if ((standardTileIds.ids[j] && filteredIds[k].tileX === standardTileIds.ids[j].tileX && filteredIds[k].tileY === standardTileIds.ids[j].tileY) || !standardTileIds.ids[j].tileX)
								{
									standardTileIds.count = standardTileIds.count - 1;
									standardTileIds.ids.splice(j, 1);
								}
							}
						}
					}
				}

				for (let i = nonDataIds.length - 1; i >= 0; i--)
				{
					for (let j = standardTileIds.ids.length - 1; j >= 0; j--)
					{
						if (standardTileIds.ids[j] && nonDataIds[i].tileX === standardTileIds.ids[j].tileX && nonDataIds[i].tileY === standardTileIds.ids[j].tileY)
						{
							standardTileIds.count = standardTileIds.count - 1;
							standardTileIds.ids.splice(j, 1);
						}
					}
				}

				result = {
					name: STANDARD_TILE_LAYER_DISPLAY_NAME,
					count: standardTileIds.count ? standardTileIds.count : 0,
					bounds: bounds,
					geoJson: null,
					geoJsonElement: null
				};

				if (result.count === 0 || result.count > MAX_TILES)
				{
					return result;
				}

				body = {
					mapId: map.id,
					type: ViewerUtility.standardTileLayerType,
					timestamp: 0,
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

				if(this.state.selectedLayers.length > 0)
				{
					return result;
				}
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
			this.setState({ selectedLayers: newSelectedLayers ? newSelectedLayers : [STANDARD_TILES_LAYER] },
				() => {this.prepareLayers(this.props.map, this.props.timestampRange, this.state.selectedLayers)});
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

    debugger
    
    if (this.props.mode === ViewerUtility.plantMode) {
      return null;
    }

		return (
			<Card className='filter-control'>
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
					<CardContent className={'card-content'}>
			      <List dense disablePadding>
							<ListItem
				        button
				        dense
				        name="filter"
				        value="filter"
				        onClick={this.handleChange}
				        key={'filterControlShowTiles'}
			      	>
				        <ListItemIcon>
				          <Checkbox
				            color='primary'
				            checked={this.state.selectedLayers.includes(STANDARD_TILES_LAYER)}
				            disabled={this.state.loading}
				            edge="start"
				            disableRipple
				          />
				        </ListItemIcon>
				        <ListItemText primary='Show tiles' secondary={this.state.selectedLayers.includes(STANDARD_TILES_LAYER) ? this.state.count : null}/>
				        {
				        	this.state.loading
				        	? <ListItemSecondaryAction>
				        			<CircularProgress size={20} />
			        			</ListItemSecondaryAction>
				        	: null
			        	}
				      </ListItem>
						{
							this.state.filterForm.length > 1
							? this.state.filterForm.map(x => {
								let open = this.state.open.includes(x.name)
								return(<React.Fragment key={'filterList_' + x.name}>
				       		<ListItem
									  button
									  dense
									  disableGutters
									  onClick={() => {this.changeOpen(x.name)}}
					      	>
					      		<ListItemText primary={<ListSubheader component={Typography} color='primary'>{ViewerUtility.capitalize(x.name)}</ListSubheader>}/>
					      		<ListItemSecondaryAction>
					      			<IconButton edge="end" color='secondary' onClick={() => {this.changeOpen(x.name)}}>
					      				{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
				      				</IconButton>
					      		</ListItemSecondaryAction>
						    	</ListItem>
						    	<ListItem dense disableGutters>
							    	<Collapse in={this.state.open.includes(x.name)} className='filterFormItemCollapse'>
								    	{x.inputs}
							    	</Collapse>
						    	</ListItem>
				    		</React.Fragment>)})
				    	: (this.state.filterForm[0] ? <React.Fragment><Divider/>{this.state.filterForm[0].inputs}</React.Fragment> : null)
						}
			      </List>     
						<div className='button_count'>
							<Button
								key={'submit' + this.state.loading}
								disabled={this.state.loading}
								variant='contained'
								color='primary'
								onClick={this.filterSubmit}
								startIcon={this.state.loading ? <CircularProgress size={20} /> : null}
							>
								Filter
							</Button>
						</div>
					</CardContent>
				</Collapse>
			</Card>
		);
	}
}

export default FilterControl;

class FilterInput extends Component {
	constructor(props, context) {
		super(props, context);

		this.state = {
			checked: false,
			tooltipOpen: false,
		};
	}

	makeMarks = (min, max, unit) => {
		let marks = [];

		let amount = 4;

		let valueStep = (max - min) / amount;

		for (let i = 0; i <= amount; i++)
		{
			let value = min + i * valueStep;

			let handledUnit = '';

			if (typeof unit !== 'string')
			{
				for (let j = 0; j < unit.length; j++)
				{
					if(typeof unit[j] !== 'string')
					{
						if (unit[j].type === 'sup' && unit[j].value === '3')
						{
							handledUnit = handledUnit + '³';
						}
					}
					else
					{
						handledUnit = handledUnit + unit[j];
					}
				}
			}
			else
			{
				handledUnit = unit;
			}

			let mark = {
				value: value,
				label: value.toString() + handledUnit,
			};

			marks.push(mark)
		}

		return marks;
	}

	render = () => {
		let form = this.props.form;
		let marks = form.marks ? form.marks : this.makeMarks(form.min, form.max, form.unit);

		let labelId = `checkbox-list-label-${form.title.replace(' ', '-')}`;

		return ([<ListItem
    	className='MuiListItem-secondaryAction filterItem'
    	dense
    	button
    	key={form.title + 'listItem'}
    	onClick={(e, checked) => {this.setState({checked: !this.state.checked}, () => this.props.filterSelectionChange(e, checked, form.valueName, form.category))}}
  	>
	    <ListItemIcon>
	      <Checkbox
	        edge="start"
	        color='primary'
	       	checked={this.state.checked}
	        tabIndex={-1}
	        disableRipple
	        onChange={(e, checked) => {this.setState({checked: !this.state.checked}, () => this.props.filterSelectionChange(e, checked, form.valueName, form.category))}}
	        inputProps={{ 'aria-labelledby': labelId }}
	      />
	    </ListItemIcon>
	    <ListItemText id={labelId} primary={form.title} className='filterInputText'/>
	    {
	    	form.text ? <ListItemSecondaryAction>
  		    <Tooltip
  		    	TransitionComponent={Zoom}
  		    	title={form.text}
  		    	placement="right"
  		    	leaveDelay={500}
  		    	interactive
  		    	arrow
  		    	open={this.state.tooltipOpen}
  		    	onClose={() => {this.setState({tooltipOpen: false})}}
  		    	onClick={() => {this.setState({tooltipOpen: !this.state.tooltipOpen})}}
  	    	>
  				  <IconButton edge="end" aria-label="filter information">
  		        <InfoIcon />
  		      </IconButton>
  				</Tooltip>
  	    </ListItemSecondaryAction> : null
  	  }
    </ListItem>,
    <Collapse in={this.state.checked} key={form.title + 'collapse'} className='filterInputCollapse'>
			<Slider
				defaultValue={[form.min, form.max]}
				valueLabelDisplay="auto"
				step={form.step}
				marks={marks}
				min={form.min}
				max={form.max}
				key={form.title + 'Slider'}
				onChange={(e, value) => {
					if(this.state.checked)
					{
						this.props.filterChange(e, value, form.valueName, form.category);
					}
					else {
						this.setState({checked: true}, () => this.props.filterChange(e, value, form.valueName, form.category))
					}
				}}
			/>
		</Collapse>])
	}
}
