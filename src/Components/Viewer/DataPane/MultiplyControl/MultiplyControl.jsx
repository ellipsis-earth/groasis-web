import React, { PureComponent } from 'react';

import { GeoJSON } from 'react-leaflet';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';

import ApiManager from '../../../../ApiManager';
import GroasisUtility from '../../GroasisUtility';
import ViewerUtility from '../../ViewerUtility';

import './MultiplyControl.css';

const MAX_LINES = 50;

class MultiplyControl extends PureComponent {
	constructor(props, context) {
    super(props, context);

    this.state = {
      distance: null,
      initialPosition: null,
      amount: 0,
      loading: false,
    };

    this.lastPosition = {};
    this.timer = null;
  }

  componentDidMount = (e) => {
  	this.props.leafletMap.current.leafletElement.on('click', this.handleMouseUp);
  	this.props.leafletMap.current.leafletElement.on('mousemove', this.handleMouseMove);
  }

  componentWillUnmount = () => {
  	this.props.leafletMap.current.leafletElement.off('click', this.handleMouseUp);
		this.props.leafletMap.current.leafletElement.off('mousemove', this.handleMouseMove);
		this.props.onLayersChange(null, true);
    clearTimeout(this.timer);
    this.timer = null;
  }

	handleChange = (e) => {
		let cb = () => {};

		if (e.target.value === '')
		{

		}
		else if (this.state.lines)
		{
			cb = () => {this.handleMouseUp(this.lastPosition)};
		}
		else
		{
			cb = () => {this.handleMouseMove(this.lastPosition)};
		}

		this.setState({distance: e.target.value}, cb)
	}

	handleMouseMove = (e) => {
		if (this.state.initialPosition && this.state.distance)
		{
			let lines = this.createLines(e);

			let linesObject = <GeoJSON
        key={Math.random()}
        data={lines}
        style={ViewerUtility.createGeoJsonLayerStyle('#87cef3', 3, null, null, 0.5)}
        name={'Preview lines'}
        zIndex={1010}
      />

      this.lastPosition.last = e;

      this.props.onLayersChange(linesObject, true);
		}
	}

	handleMouseUp = (e) => {
		if ((this.state.initialPosition && this.state.distance) ||( e.last && e.start))
		{
			this.props.leafletMap.current.leafletElement.off('click', this.handleMouseUp);
  		this.props.leafletMap.current.leafletElement.off('mousemove', this.handleMouseMove);

  		let lines = null;

  		if (e.last && e.start)
  		{
				lines = this.createLines(e.last, e.start);
  		}
  		else
  		{
				lines = this.createLines(e);
  		}

			let linesObject = <GeoJSON
        key={Math.random()}
        data={lines}
        style={ViewerUtility.createGeoJsonLayerStyle('#87cef3', 3)}
        name={'Lines'}
        zIndex={1011}
      />

			this.setState({initialPosition: null, lines: lines}, () => {this.props.onLayersChange(linesObject, true)});
		}
		else if(this.state.distance && !this.state.initialPosition)
		{
			this.lastPosition.start = e.latlng;
			this.setState({initialPosition: e.latlng});
		}
	}

	createLines = (e, initialPosition = this.state.initialPosition) => {
		let lines = [];

		if(e.latlng)
		{
			let mouseDistance = e.latlng.distanceTo(initialPosition);
			let amount = Math.floor(mouseDistance / this.state.distance);
					amount = amount > MAX_LINES ? MAX_LINES : amount;

			let addAmount = {lat: (e.latlng.lat - initialPosition.lat) / amount, lng: (e.latlng.lng - initialPosition.lng) / amount}

			let coordinates = this.props.element.feature.geometry.coordinates;

			for (let i = 1; i < amount + 1; i++)
			{
				let line = [];
				for (var j = 0; j < coordinates.length; j++)
				{
					line.push([coordinates[j][0] + (i * addAmount.lng), coordinates[j][1] + (i * addAmount.lat)])
				}

				lines.push({
					"type" : "Feature",
					properties: this.props.element.feature.properties,
					geometry: {type: "LineString", coordinates: line}});
			}

			this.setState({amount: Math.floor(mouseDistance / this.state.distance)});

			return {
				"type" : "FeatureCollection",
				"features" : lines
			};
		}
	}

	confirm = () => {
		this.setState({loading: true}, async () => {
			let lines = this.state.lines;
			let plantingSite = this.props.map.plantingSites.props.data.features.find(x => parseInt(x.id) === this.props.selectedPlantingSite)
			let feature = {type: 'Feature', properties: {'Planting site id': this.props.selectedPlantingSite}}

	    let body = {
	      mapId: this.props.map.id,
	      timestamp: 0,
	      layer: GroasisUtility.layers.polygon.plantingLines,
	      feature: feature,
	    };

	    let promises = [];

			for (let i = 0; i < lines.features.length; i++)
			{
				let clippedLine = await GroasisUtility.clippingUtil(lines.features[i].geometry.coordinates, plantingSite);

				if (clippedLine && clippedLine.geometry)
				{
					body.feature.geometry = clippedLine.geometry;
				}
				else
				{
					continue;
				}

				promises.push(ApiManager.post('/geometry/add', body, this.props.user)
		      .catch(err => {
		        console.error(err);
		      })
	      );
			}


			Promise.all(promises)
			.then(() => {
				this.timer = setTimeout(() => {
					this.stopDraw();
					this.props.onDeselect();
					this.props.updatePolygons();
				}, 3000)
			});
		})
	}

	deny = () => {
		this.props.leafletMap.current.leafletElement.on('click', this.handleMouseUp);
		this.props.leafletMap.current.leafletElement.on('mousemove', this.handleMouseMove);

		this.lastPosition = {};
		this.props.onLayersChange(null, true);
		this.setState({initialPosition: null, lines: null, amount: 0});
	}

	stopDraw = () => {
		this.props.leafletMap.current.leafletElement.off('click', this.handleMouseUp);
		this.props.leafletMap.current.leafletElement.off('mousemove', this.handleMouseMove);

		this.lastPosition = {};
		this.props.onLayersChange(null, true);
		this.setState({initialPosition: null, lines: null, amount: 0, loading: false});
	}

	render = () => {
		let message = null;

		if (this.state.distance && this.state.initialPosition && !this.state.lines)
		{
			message = <p>Select the end point</p>
		}
		else if (this.state.distance && !this.state.initialPosition && !this.state.lines)
		{
			message = <p>Click on the line to create the anchorpoint</p>;
		}
		else if (this.state.lines && !this.state.loading)
		{
			message = <p><Button color='secondary' onClick={this.confirm}>Confirm</Button> or <Button onClick={this.deny}>Deny</Button></p>;
		}
		else if (this.state.lines && this.state.loading)
		{
			message = <p><Button color='secondary' disabled startIcon={<CircularProgress size={12} />} onClick={this.confirm}>Confirm</Button> or <Button disabled onClick={this.deny}>Deny</Button></p>;
		}

		return (
	  	<Card className='data-pane-title-card multiplyControl'>
		  	<CardContent>
		  		{!this.state.distance ? <p>Start by filling in the distance between lines below</p> : null}
		      <TextField
					  label="Distance between lines"
					  fullWidth
					  onChange={this.handleChange}
					  type="number"
					  InputProps={{
					  	inputProps: { min: 1 },
					    endAdornment: <InputAdornment position="end">m</InputAdornment>,
					  }}
					/>

					<p><span className={this.state.amount > MAX_LINES ? 'geometry-limit-exceeded' : ''}>{this.state.amount}</span>/{MAX_LINES}</p>
				</CardContent>
				<CardActions>
					{message}
				</CardActions>
			</Card>
    )
	}
}

export default MultiplyControl;