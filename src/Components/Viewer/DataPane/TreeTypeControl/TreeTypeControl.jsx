import React, { Component } from 'react';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import ClearIcon from '@material-ui/icons/Clear';
import DeleteIcon from '@material-ui/icons/Delete';
import DoneIcon from '@material-ui/icons/Done';

import ApiManager from '../../../../ApiManager';
import GroasisUtility from '../../GroasisUtility';
import ViewerUtility from '../../ViewerUtility';

import './TreeTypeControl.css'

class TreeTypeControl extends Component {
	constructor(props, context) {
    super(props, context);

    this.state = {
    	treeAddOpen: false,
    	speciesName: '',
    	trees: (this.props.map && this.props.map.info && this.props.map.info.trees ? this.props.map.info.trees : []),
    }
  }

  componentDidUpdate = (prevProps) => {
  	if (prevProps.map && this.props.map && ((!prevProps.map.info && this.props.map && this.props.map.info) || (prevProps.map.info !== this.props.map.info))) {
  		this.setState({trees: this.props.map.info && this.props.map.info.trees ? this.props.map.info.trees : [], speciesName: '', treeAddOpen: false})
  	}
  }

  openTreeAdd = () => {
  	this.setState({treeAddOpen: true})
  }

  openTreeClose = () => {
  	this.setState({treeAddOpen: false})
  }

  setTrees = (trees) => {
		this.uploadTrees(this.props.map.info, trees);
  }

  handleTreeAdd = () => {
  	let speciesName = this.state.speciesName;

  	this.setState({treeAddOpen: false, speciesName: ''}, () => {
  		if (speciesName.length > 0)
	  	{
		  	let trees = this.props.map.info.trees ? this.props.map.info.trees : [];
		  	trees.push({name: speciesName})
		  	this.setTrees(trees);
	  	}
  	})
  }

  uploadTrees = (info, trees) => {
  	info.trees = trees;

  	let body = {
  		mapId: this.props.map.id,
  		mapInfo: info
  	};

  	ApiManager.post('/settings/projects/addMapInfo', body, this.props.user)
    .then(result => {
    	this.props.map.info.trees = trees;
    	this.setState({trees: trees})
    })
    .catch(err => {
    	console.error(err)
    })
  }

  changeSpeciesField = (e) => {
  	this.setState({speciesName: e.target.value})
  }

  treeDelete = (index) => {
  	let trees = this.state.trees;
  	trees.splice(index, 1);

  	this.setTrees(trees);
  }

	render = () => {
		if(this.props.map && this.props.map.info)
		{
			return (<Card className='data-pane-card treeTypeControl'>
	      <CardHeader title={<Typography variant='h6' component='h2' className='watchlist-title'>Species</Typography>}/>
	      <CardContent className='data-pane-card-content'>
      		<List dense className='treeTypeControl'>
			    	{
			    		this.state.trees.length > 0
			    		? this.state.trees.map((tree, i) => <ListItem key={tree.name + '_' + i}>
			    				<ListItemText primary={tree.name}/>
                  {
                    this.props.mode !== ViewerUtility.plantMode ? 
                      <ListItemSecondaryAction>
                        <IconButton size='small' edge='end' onClick={() => {this.treeDelete(i)}}>
                          <DeleteIcon/>
                        </IconButton>
                      </ListItemSecondaryAction> : null
                  }			    				
			    			</ListItem>)
			    		: <ListItem>
			    				<ListItemText primary='No tree species yet'/>
		    				</ListItem>
			    	}
            {
              this.props.mode !== ViewerUtility.plantMode ?
                <Collapse in={!this.state.treeAddOpen}>
                  <ListItem dense button onClick={this.openTreeAdd}>
                    <ListItemText primaryTypographyProps={{color: 'primary', align: 'center'}}>+ add species</ListItemText>
                  </ListItem>
                </Collapse> : null
            }		    		
  				</List>
  				<Collapse in={this.state.treeAddOpen}>
  					<List dense>
  						<ListItem>
  							<TextField label="Species Name" onChange={this.changeSpeciesField} fullWidth value={this.state.speciesName}/>
							</ListItem>
  						<ListItem>
  							<ListItemText primaryTypographyProps={{align:'right'}}>
	  							<IconButton onClick={this.openTreeClose}>
	  								<ClearIcon />
	  							</IconButton>
	  							<IconButton onClick={this.handleTreeAdd}>
	  								<DoneIcon />
	  							</IconButton>
  							</ListItemText>
  						</ListItem>
  					</List>
  				</Collapse>
	      </CardContent>
	    </Card>)
		}
		else
		{
			return null;
		}
	}
}

export default TreeTypeControl;
