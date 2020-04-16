import React, { Component } from 'react';

import L from 'leaflet';
import { GeoJSON } from 'react-leaflet';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';

import CheckIcon from '@material-ui/icons/Check';


import TreeControl from './TreeControl/TreeControl';

import ApiManager from '../../../../ApiManager';
import GroasisUtility from '../../GroasisUtility';
import ViewerUtility from '../../ViewerUtility';

import './PlanControl.css';

class PlanControl extends Component {
	constructor(props, context) {
    super(props, context);

    this.state = {
    	availableTrees: GroasisUtility.species.map(x => {return {name: x}}),
    	selectedTrees: [],
    	distance: '',

    	loading: false,
    };

    this.treeControl = React.createRef();
  }

	setSelectedTrees = (selectedTrees) => {
  	this.setState({selectedTrees: selectedTrees}, async () => {
  		this.treeControl.current.setListLength(selectedTrees.length);
      /*if(selectedTrees.length > 0 && this.state.distance > 0)
      {
        this.props.onLayersChange(await this.treesToGeoJSON(), true);
      }*/
  	});
  }

  setDistance = (distance) => {
  	this.setState({distance: distance}/*, async () => {
      if(this.state.selectedTrees.length > 0 && distance > 0)
      {
        this.props.onLayersChange(await this.treesToGeoJSON(), true);
      }
    }*/);
  }

  getSpeciesList = () => {
  	if (this.state.selectedTrees.length > 1)
  	{
  		let treeList = [];
	  	for (let i = 0; i < this.state.selectedTrees.length; i++)
	  	{
	  		for (let j = 0; j < this.state.selectedTrees[i].ratio; j++)
	  		{
	  			treeList.push(this.state.selectedTrees[i].name)
	  		}
	  	}

  		return treeList;
  	}
  	else
  	{
  		return [this.state.selectedTrees[0].name];
  	}
  }

  getRandomTreeSpecies = (list) => {
  	if (list.length > 1)
  	{
  		return list[Math.floor(Math.random() * list.length)];
  	}
  	else
  	{
  		return list[0];
  	}
  }

  treesToGeoJSON = async () => {
    let icon = ViewerUtility.returnMarker('#388e3cff', 2, 'RoomTwoTone', 0.5);

    let treeFeatures = await this.planTrees();
    console.log(treeFeatures);
    let geoJson =  <GeoJSON
        key={Math.random()}
        data={await this.planTrees()}
        pointToLayer={(geoJsonPoint, latlng) => this.markerReturn(latlng, icon)}
        name='tree preview'
        zIndex={1001}
      />;

    return geoJson;
  }

  markerReturn = (latlng, icon) => {
    return L.marker(latlng, {icon: icon, pane: 'overlayPane'});
  }

  planTrees = async () => {
  	let treeSpecies = this.getSpeciesList();

  	let a = this.state.distance;
  	let treeFeatures = [];

    let plantingLines = [];

    if(this.props.element.type === ViewerUtility.plantingSiteElementType)
    {
      let body = {
        mapId: this.props.map.id,
        type: ViewerUtility.polygonLayerType,
        layer: GroasisUtility.layers.polygon.plantingLines,
        filters: [{key: 'Planting site id', value: this.props.selectedPlantingSite, operator: '='}]
      };

      plantingLines = await ApiManager.post('/geometry/ids', body, this.props.user)
      .then(polygonIds => {
        body = {
          mapId: this.props.map.id,
          type: ViewerUtility.polygonLayerType,
          elementIds: polygonIds.ids,
        };

        return ApiManager.post('/geometry/get', body, this.props.user)
        .then(polygonElements => {
          return polygonElements.features;
        })
        .catch(err => {
          console.error(err);
        })
      })
      .catch(err => {
        console.error(err);
      });
    }
    else
    {
      plantingLines.push(this.props.element.feature);
    }

    for (let i = 0; i < plantingLines.length; i++)
    {
    	let coordinates = JSON.parse(JSON.stringify(plantingLines[i].geometry.coordinates));
    	let rest = 0;

    	for (let j = 0; j < coordinates.length - 1; j++)
    	{
    		let c1 = coordinates[j];
    		let c2 = coordinates[j + 1];
    		let d = L.latLng(c1).distanceTo(L.latLng(c2));

    		c1[0] = c1[0] + ((c2[0] - c1[0]) / d) * rest;
    		c1[1] = c1[1] + ((c2[1] - c1[1]) / d) * rest;

    		for (let k = 0; k < Math.floor(((d - rest) / a) + 1); k++)
    		{
    			let x = c1[0] + ((c2[0] - c1[0]) / d) * a * k;
    			let y = c1[1] + ((c2[1] - c1[1]) / d) * a * k;

    			let treeGeoJSON = {type: 'Feature', properties: {
  		      [GroasisUtility.treeProperties.species]: this.getRandomTreeSpecies(treeSpecies),
  		      'Planting site id': this.props.selectedPlantingSite,
  		      'Planting line id': parseInt(plantingLines[i].id),
  		    }, geometry: {type: 'Point', coordinates: [x, y]}};

  		    treeFeatures.push(treeGeoJSON);
    		}

    		rest = (d - rest) % a;
    	}
    }

  	return treeFeatures
  }

  trackAdd = (trackingId) => {
    let body = {
      mapId: this.props.map.id,
      trackingId: trackingId
    };

    let trackFunc = () => {
      ApiManager.post('/geometry/track', body, this.props.user)
        .then(trackingInfo => {
          if (!trackingInfo.added) {
            setTimeout(trackFunc, 1000);
            return;
          }
          else
          {
          	this.setState({loading: false}, () => {
              this.props.updatePolygons();
			      	this.props.onDeselect();
			      	this.props.onLayersChange(null, true);
			      });
          }
    })};

    trackFunc();
  }

  confirmTrees = async () => {
    let treeFeatures = await this.planTrees();

  	let treePromises = [];

  	for (let i = 0; i < treeFeatures.length; i++) {
  		let body = {
	      mapId: this.props.map.id,
	      timestamp: 0,
	      layer: GroasisUtility.layers.polygon.trees,
	      feature: GroasisUtility.markerToTreePolygon(treeFeatures[i])
	    };

	    treePromises.push(ApiManager.post('/geometry/add', body, this.props.user)
      .catch(err => {console.error(err)}));
  	}

  	Promise.all(treePromises)
  	.then(trackingInfo => {
  		this.trackAdd(trackingInfo[trackingInfo.length - 1].trackingId)
    })
    .catch(err => {console.error(err)})
  }

	render = () => {
		return (
	  	<Card className='data-pane-card plantControl'>
		  	<CardHeader
			  	title={
			  		<Typography
		          variant="h6"
		          component="h2"
		          className='no-text-transform data-pane-title'
		        >
		          Automatic Planning
		        </Typography>
					}
		  	/>
		  	<CardContent>
		  		<TreeControl
		  			layer={this.props.layer}
		  			availableTrees={this.state.availableTrees}
		  			selectedTrees={this.state.selectedTrees}
		  			distance={this.state.distance}
		  			setSelectedTrees={this.setSelectedTrees}
		  			setDistance={this.setDistance}
		  			ref={this.treeControl}
		  		/>
				</CardContent>
				<CardActions>
					<Button
						key={'planButton_' + this.state.selectedTrees.length + '_' + this.state.distance === '' ? '-' : this.state.distance + '_' + this.state.loading}
		        variant="contained"
		        color="secondary"
		        startIcon={this.state.loading ? <CircularProgress size='20px' /> : <CheckIcon />}
		        className='plantButton'
		        onClick={() => {this.setState({loading: true}, this.confirmTrees)}}
		        disabled={this.state.distance === '' || this.state.selectedTrees.length === 0 || this.state.loading}
		      >
		        Plan Trees
		      </Button>
				</CardActions>
			</Card>
    )
	}
}

export default PlanControl;