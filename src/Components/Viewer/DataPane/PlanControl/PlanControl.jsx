import React, { PureComponent } from 'react';

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

class PlanControl extends PureComponent {
	constructor(props, context) {
    super(props, context);

    this.state = {
    	availableTrees: [
    		{
    			name: 'Douglas',
    		},
    		{
    			name: 'Oak',
    		},
    		{
    			name: 'Willow',
    		}
    	],
    	selectedTrees: [
	    	{
	    		name: 'Douglas',
	    	}
    	],
    	distance: '',

    	loading: false,
    };

    this.treeControl = React.createRef();
  }

	setSelectedTrees = (selectedTrees) => {
  	this.setState({selectedTrees: selectedTrees});
  }

  setDistance = (distance) => {
  	this.setState({distance: distance});
  }

  planTrees = () => {
  	console.log('planTrees');

  	let a = this.state.distance;
  	let coordinates = this.props.element.feature.geometry.coordinates;
  	let rest = 0;

  	for (let i = 0; i < coordinates.length - 1; i++)
  	{
  		let currentCoordinate = coordinates[i];
  		let nextCoordinate = coordinates[i + 1];
  		let d = L.latLng(currentCoordinate).distanceTo(L.latLng(nextCoordinate));

  		let currentCoordinate[0] = currentCoordinate[0] + ((nextCoordinate[0] - currentCoordinate[0]) / d) * rest;
  		let currentCoordinate[1] = currentCoordinate[1] + ((nextCoordinate[1] - currentCoordinate[1]) / d) * rest;

  		for (let j = 0; j < Math.Floor((d - rest) / a); j++)
  		{
  			/*let x = x1 +*/
  		}
  	}

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
		  			setSelectedTrees={this.setSelectedTrees}
		  			setDistance={this.setDistance}
		  			ref={this.treeControl}
		  		/>
				</CardContent>
				<CardActions>
					<Button
		        variant="contained"
		        color="secondary"
		        startIcon={this.state.loading ? <CircularProgress size='20px' /> : <CheckIcon />}
		        className='plantButton'
		        onClick={() => {this.setState({loading: true}, this.planTrees)}}
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