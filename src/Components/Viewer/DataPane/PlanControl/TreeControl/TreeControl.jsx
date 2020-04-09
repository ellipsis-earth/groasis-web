import React, { Component } from 'react';

import Collapse from '@material-ui/core/Collapse';
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
    };
  }

  handleDelete = (i) => {
  	let selectedTrees = this.props.selectedTrees;

  	selectedTrees.splice(i, 1);

  	this.props.setSelectedTrees(selectedTrees);
  }

  handleAdd = () => {
  	this.setState({add: !this.state.add})
  }

  handleConfirm = (input) => {
  	this.setState({add: !this.state.add}, () => {
  		let selectedTrees = this.props.selectedTrees;
  		selectedTrees.push(this.props.availableTrees.find(x=> x.name === input));

	  	this.props.setSelectedTrees(selectedTrees);
  	})
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
	          value={this.state.distance}
	          onChange={this.handleDistanceChange}
    			/>
    		</ListItem>
    		<List
    			dense
    			subheader={
    				<ListSubheader component="div" color='primary'>
		          Selected Trees
		        </ListSubheader>
		      }
	      >
    		{
    			this.props.selectedTrees.map((x, i) => {
    				return (<ListItem key={'treeItem_' + x.key + i}>
	      			<ListItemText primary={Object.values(x).join(' ')}/>
	      			<ListItemSecondaryAction>
	      				<IconButton edge='end' onClick={() => {this.handleDelete(i)}}>
	      					<DeleteIcon />
	      				</IconButton>
	      			</ListItemSecondaryAction>
	      		</ListItem>)
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
    	tree: '',
    };
  }

  handleChange = (e) => {
  	this.setState({tree: e.target.value});
  }

  handleConfirm = () => {
  	if (this.state.tree !== '')
  	{
	  	this.props.handleConfirm(this.state.tree);
	  	this.handleDeny();
  	}
  }

  handleDeny = () => {
  	this.setState({tree: ''},
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
				  <FormControl required key={'keyInput' + inputId} fullWidth>
		        <InputLabel id='newTreeInput'>Tree</InputLabel>
		        <Select
		          labelId='newTreeInput'
		          value={this.state.tree}
		          onChange={this.handleChange}
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
