import React, { PureComponent } from 'react';

import { GeoJSON } from 'react-leaflet';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';

import ApiManager from '../../../../ApiManager';
import GroasisUtility from '../../GroasisUtility';
import ViewerUtility from '../../ViewerUtility';

import './MultiplyControl.css';

class MultiplyControl extends PureComponent {
	constructor(props, context) {
    super(props, context);

    this.state = {
      distance: null,
      initialPosition: null,
    };
  }

  componentDidMount = (e) => {
  	this.props.leafletMap.current.leafletElement.on('mouseup', this.handleMouseUp);
  	this.props.leafletMap.current.leafletElement.on('mousemove', this.handleMouseMove);
  }

  componentWillUnmount = () => {
  	this.props.leafletMap.current.leafletElement.off('mouseup', this.handleMouseUp);
		this.props.leafletMap.current.leafletElement.off('mousemove', this.handleMouseMove);
		this.props.onLayersChange(null, true);
  }

	handleChange = (e) => {
		this.setState({distance: e.target.value, initialPosition: null})
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

      this.props.onLayersChange(linesObject, true);
		}
	}

	handleMouseUp = (e) => {
		if (this.state.initialPosition && this.state.distance)
		{
			this.props.leafletMap.current.leafletElement.off('mouseup', this.handleMouseUp);
  		this.props.leafletMap.current.leafletElement.off('mousemove', this.handleMouseMove);

			let lines = this.createLines(e);

			let linesObject = <GeoJSON
        key={Math.random()}
        data={lines}
        style={ViewerUtility.createGeoJsonLayerStyle('#87cef3', 3)}
        name={'Lines'}
        zIndex={1011}
      />

			this.setState({initialPosition: null, lines: lines}, () => {this.props.onLayersChange(linesObject, true)});
		}
		else if(this.state.distance)
		{
			this.setState({initialPosition: e.latlng});
		}
	}

	createLines = (e) => {
		let lines = [];

		let mouseDistance = e.latlng.distanceTo(this.state.initialPosition);
		let amount = Math.floor(mouseDistance / this.state.distance);
				amount = amount > 50 ? 50 : amount;

		let addAmount = {lat: (e.latlng.lat - this.state.initialPosition.lat) / amount, lng: (e.latlng.lng - this.state.initialPosition.lng) / amount}

		let coordinates = this.props.element.feature.geometry.coordinates;

		for (let i = 1; i < amount + 1; i++)
		{
			let line = [];
			for (var j = 0; j < coordinates.length; j++)
			{
				line.push([coordinates[j][0] + (i * addAmount.lng), coordinates[j][1] + (i * addAmount.lat)])
			}

			lines.push({"type" : "Feature", properties: this.props.element.feature.properties, geometry: {type: "LineString", coordinates: line}});
		}

		return {
			"type" : "FeatureCollection",
			"features" : lines
		};
	}

	confirm = () => {
		let lines = this.state.lines;
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
			body.feature.geometry = lines.features[i].geometry;

			promises.push(ApiManager.post('/geometry/add', body, this.props.user)
	      .then((result) => {
	      	return result
	      })
	      .catch(err => {
	        console.error(err);
	      })
      );
		}

		Promise.all(promises)
		.then((values) => {
			console.log(values)
		});
	}

	deny = () => {
		this.props.leafletMap.current.leafletElement.on('mouseup', this.handleMouseUp);
		this.props.leafletMap.current.leafletElement.on('mousemove', this.handleMouseMove);

		this.props.onLayersChange(null, true);
		this.setState({initialPosition: null, lines: null});
	}

	stopDraw = () => {
		this.props.leafletMap.current.leafletElement.off('mouseup', this.handleMouseUp);
		this.props.leafletMap.current.leafletElement.off('mousemove', this.handleMouseMove);

		this.props.onLayersChange(null, true);
		this.setState({initialPosition: null, lines: null});
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
		else if (this.state.lines)
		{
			message = <p><Button color='secondary' onClick={this.confirm}>Confirm</Button> or <Button onClick={this.deny}>Deny</Button></p>;
		}

		return (
	  	<Card className='data-pane-title-card multiplyControl'>
		  	<CardContent>
		  		{!this.state.distance ? <p>Start by filling in the distance between lines below</p> : null}
		      <TextField
					  label="Distance between lines"
					  fullWidth
					  onChange={this.handleChange}
					  InputProps={{
					    endAdornment: <InputAdornment position="end">m</InputAdornment>,
					  }}
					/>
				</CardContent>
				<CardActions>
					{message}
				</CardActions>
			</Card>
    )
	}
}

export default MultiplyControl;