import React, { Component } from 'react';

import Collapse from '@material-ui/core/Collapse';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
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
import EditIcon from '@material-ui/icons/Edit';

import './TreeControl.css';

class TreeControl extends Component {
	constructor(props, context) {
    super(props, context);

    this.state = {
    	add: false,
    	listLength: 0,
      edit: -1,
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

  handleEdit = (i) => {
  	this.setState({add: true, edit: i})
  }

  handleConfirm = (input, edit) => {
  	this.setState({add: !this.state.add, edit: -1}, () => {
  		let selectedTrees = this.props.selectedTrees;
      if (edit >= 0)
      {
        selectedTrees[edit] = input;
      }
      else
      {
  		  selectedTrees.push(input);
      }

	  	this.props.setSelectedTrees(selectedTrees);
  	})
  }

  setListLength = (input) => {
  	this.setState({listLength: input})
  }

  handleDeny = () => {
  	this.setState({add: false, edit: -1})
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
                {
                 this.props.selectedTrees.length > 1 ? <Grid item xs className='ratioSubheader'>Ratio</Grid> : null
                }
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
		      					{
                       this.props.selectedTrees.length > 1 ? <Grid item xs className='ratioItem'>{x.ratio}</Grid> : null
                    }
		      				</Grid>}/>
		      			<ListItemSecondaryAction>
                  {
                    this.props.selectedTrees.length > 1 ? <IconButton size='small' onClick={() => {this.handleEdit(i)}}>
                      <EditIcon />
                    </IconButton> : null
                  }
		      				<IconButton size='small' edge='end' onClick={() => {this.handleDelete(i)}}>
		      					<DeleteIcon />
		      				</IconButton>
		      			</ListItemSecondaryAction>
		      		</ListItem>)
						}

						return null;
  				})
    		}
    		</List>
  			<Collapse in={this.state.add}>
					<TreeInput
						availableTrees={this.props.availableTrees}
						selectedTrees={this.props.selectedTrees}
						handleConfirm={this.handleConfirm}
						handleDeny={this.handleDeny}
            edit={this.state.edit}
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

  componentDidUpdate = (prevProps) => {
    if (prevProps.edit !== this.props.edit && this.props.edit >= 0)
    {
      this.setState({name: this.props.selectedTrees[this.props.edit].name, ratio: this.props.selectedTrees[this.props.edit].ratio})
    }
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
      if(this.props.edit >= 0)
      {
        this.props.handleConfirm(this.state, this.props.edit);
      }
      else
	  	{
        this.props.handleConfirm(this.state);
      }
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
				        			if(!this.props.selectedTrees.find(y => y.name === x.name) || (this.props.edit >= 0 && this.props.selectedTrees[this.props.edit].name === x.name))
				        			{
				        				return(<MenuItem key={inputId + '_menuItem_' + x.name} value={x.name}>{x.name}</MenuItem>)
				        			}

			        				return null;
				        		})
				        	}
				        </Select>
				      </FormControl>
  					</Grid>
  					{
              this.props.edit >= 0 ? <Grid item xs>
                <TextField
                  fullWidth
                  type="number"
                  InputLabelProps={{shrink: true}}
                  InputProps={{inputProps: {min: 1, max: 100, step: 1}}}
                  className='ratioInput'
                  value={this.state.ratio}
                  onChange={this.handleRatioChange}
                />
              </Grid> : null
            }
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
