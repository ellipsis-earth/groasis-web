import React, { Component } from 'react';

import Collapse from '@material-ui/core/Collapse';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import DeleteIcon from '@material-ui/icons/Delete';

import './TreeControl.css';

class TreeControl extends Component {
	constructor(props, context) {
    super(props, context);

    this.state = {
    	add: false,
    	listLength: 0,
    }
  }

  handleDelete = (i) => {
  	let selectedTrees = this.props.selectedTrees;
  	selectedTrees.splice(i, 1);
  	this.props.setSelectedTrees(selectedTrees);
  	this.setState({add: false})
  }

  handleAdd = () => {
  	this.setState({add: !this.state.add})
  }

  handleConfirm = (input) => {
  	this.setState({add: !this.state.add}, () => {
  		let selectedTrees = this.props.selectedTrees;
  		selectedTrees.push(input);
	  	this.props.setSelectedTrees(selectedTrees);
  	})
  }

  setListLength = (input) => {
  	this.setState({listLength: input})
  }

  handleDeny = () => {
  	this.setState({add: false})
  }

 	handleDistanceChange = (e) => {
 		this.props.setDistance(parseInt(e.target.value))
 	}

	render = () => {
		return (
    	<List dense className='treeControl'>
    		<ListItem>
    			<TextField
    				fullWidth
    				type="number"
    				label="Distance between trees"
    				InputProps={{
    					inputProps: {min: 1, step: 1},
	            endAdornment: <InputAdornment position="end">m</InputAdornment>,
	          }}
	          className='distanceInput'
	          value={this.props.distance}
	          onChange={this.handleDistanceChange}
    			/>
    		</ListItem>
    		<List
    			dense
    			key={'treeList_' + this.state.listLength}
    			subheader={
    				<ListSubheader component="div" color='primary'>
    					<Grid container spacing={3}>
      					<Grid item xs>Selected Trees</Grid>
      					<Grid item xs className='ratioSubheader'>Ratio</Grid>
      				</Grid>
		        </ListSubheader>
		      }
	      >
    		{
    			this.props.selectedTrees.map((x, i) => {
    				if(x)
    				{
	    				return (<ListItem key={'treeItem_' + x.name + i}>
		      			<ListItemText primary={<Grid container spacing={3}>
		      					<Grid item xs>{x.name}</Grid>
		      					<Grid item xs className='ratioItem'>{x.ratio}</Grid>
		      				</Grid>}/>
		      			<ListItemSecondaryAction>
		      				<IconButton edge='end' onClick={() => {this.handleDelete(i)}}>
		      					<DeleteIcon />
		      				</IconButton>
		      			</ListItemSecondaryAction>
		      		</ListItem>)
						}
						else
						{
							return;
						}
  				})
    		}
    		</List>
  			<Collapse in={this.state.add}>
					<TreeInput
						availableTrees={this.props.availableTrees}
						selectedTrees={this.props.selectedTrees}
						handleConfirm={this.handleConfirm}
						handleDeny={this.handleDeny}
						key={'treeInputComponent' + this.props.selectedTrees.length}
					/>
    		</Collapse>
    		<Collapse in={!this.state.add && this.props.selectedTrees.length !== this.props.availableTrees.length}>
	      	<ListItem>
	      		<ListItemText className='addListOption' onClick={this.handleAdd}>+ add tree</ListItemText>
	    		</ListItem>
    		</Collapse>
    	</List>
  	)
	}
}

export default TreeControl;

class TreeInput extends Component {
	constructor(props, context) {
    super(props, context);

    this.state = {
    	name: '',
    	ratio: 1,
    };
  }

  handleTreeChange = (e) => {
  	this.setState({name: e.target.value});
  }

  handleRatioChange = (e) => {
  	let value = parseInt(e.target.value);
  	if (value >= 1)
  	{
  		this.setState({ratio: value});
  	}
  	else
  	{
  		this.setState({ratio: 1});
  	}
  }

  handleConfirm = () => {
  	if (this.state.name !== '' && this.state.ratio !== '')
  	{
	  	this.props.handleConfirm(this.state);
	  	this.handleDeny();
  	}
  }

  handleDeny = () => {
  	this.setState({name: '', ratio: 1},
    () => {
  		this.props.handleDeny();
    });
  }

	render = () =>
	{
		let inputId = 'newTree';
		return (
      <List dense>
	      <ListItem>
	      	<Grid container spacing={3}>
  					<Grid item xs>
  						<FormControl required key={'keyInput' + inputId} fullWidth>
				        <Select
				          labelId='newTreeInput'
				          value={this.state.name}
				          onChange={this.handleTreeChange}
				          fullWidth
				        >
				        	{
				        		this.props.availableTrees.map(x => {
				        			if(!this.props.selectedTrees.find(y => y.name === x.name))
				        			{
				        				return(<MenuItem key={inputId + '_menuItem_' + x.name} value={x.name}>{x.name}</MenuItem>)
				        			}
			        				return;
				        		})
				        	}
				        </Select>
				      </FormControl>
  					</Grid>
  					<Grid item xs>
  						<TextField
		    				fullWidth
		    				type="number"
		    				InputLabelProps={{shrink: true}}
		    				InputProps={{inputProps: {min: 1, max: 100, step: 1}}}
			          className='ratioInput'
			          value={this.state.ratio}
			          onChange={this.handleRatioChange}
		    			/>
  					</Grid>
  				</Grid>
		  	</ListItem>
		  	<ListItem className='treeAddHandlingButtonsContainer' key={'buttons' + inputId}>
					<IconButton
						color='primary'
						className='confirmButton'
						onClick={this.handleConfirm}
					>
						<CheckIcon />
					</IconButton>
					<IconButton onClick={this.handleDeny}>
						<ClearIcon />
					</IconButton>
				</ListItem>
			</List>
		)
	}
}
