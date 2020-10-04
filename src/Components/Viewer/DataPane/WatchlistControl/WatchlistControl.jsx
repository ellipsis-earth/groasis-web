import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

import EditIcon from '@material-ui/icons/Edit';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTree } from '@fortawesome/free-solid-svg-icons';

import GroasisUtility from '../../GroasisUtility';
import ViewerUtility from '../../ViewerUtility';

import './WatchlistControl.css';

class WatchlistControl extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      watchlists: [],
      count: this.props.map && this.props.map.plantingSites && this.props.map.plantingSites.props.data.features.length ? this.props.map.plantingSites.props.data.features.length : -1,
    };
  }

  componentDidUpdate = (prevProps) => {
    let newCount = this.props.map && this.props.map.plantingSites && this.props.map.plantingSites.props && this.props.map.plantingSites.props.data.features.length ? this.props.map.plantingSites.props.data.features.length : -1
    if (newCount !== this.state.count)
    {
      this.setState({count: newCount});
    }
  }

  prepareWatchlist = (mode = 'normal', data) => {
    let watchlists = [];

    if (this.props.groasisMaps)
    {
      watchlists.push(<WatchList
        mode={this.props.mode}
        user={this.props.user}
        groasisMaps={this.props.groasisMaps}
        map={this.props.map}
        onWatchlistClick={this.props.onWatchlistClick}
        onPlantingSiteClick={this.props.onPlantingSiteClick}
        selectedPlantingSite={this.props.selectedPlantingSite}
        onFeatureClick={this.props.onFeatureClick}
        key={'watchlists' + this.props.groasisMaps.length}
      />)
    }

    return watchlists;
  }

  render() {
    if (this.props.home || !this.props.groasisMaps || !this.props.user) {
      return null;
    }

    let watchlist = this.prepareWatchlist();

    let message = this.props.user ? 'no areas' : 'please login';

    return (
      <Card className='data-pane-card watchList'>
        <CardHeader
          title={
            <Typography variant='h6' component='h2' className='watchlist-title'>
              {GroasisUtility.request.layer}
            </Typography>
          }
        />
        <CardContent className='data-pane-card-content' key={'watchlist_' + this.props.groasisMaps.areas.length + '_' + this.state.count}>
          {watchlist ? watchlist : message}
        </CardContent>
      </Card>
    );
  }
}

class WatchList extends PureComponent {
  render() {
    let groasisMaps = this.props.groasisMaps;
    let areas = groasisMaps.areas;

    if (areas.length === 0) {
      return null;
    }

    if(this.props.map && this.props.map.plantingSites && this.props.map.plantingSites.props){console.log(this.props.map.plantingSites.props.data.features)}

    let elements = areas.map(x => {
      if (this.props.mode === ViewerUtility.plannerMode && x.name === 'Bahrein') {
        return null;
      }

      let returnItem = [];
      let selected = this.props.map && x.id === this.props.map.id;
      let plantingSites = selected && this.props.map.plantingSites && this.props.map.plantingSites.props ? this.props.map.plantingSites.props.data.features : false;

      returnItem.push(<ListItem key={x.name + '_' + selected} button selected={selected} onClick={() => this.props.onWatchlistClick({properties: {mapId: x.id}})}>
          <ListItemText primary={x.info && x.info.displayName ? x.info.displayName : x.name} />
          {
            this.props.map && x.accessLevel >= 800 && selected && this.props.mode !== ViewerUtility.plantMode && this.props.mode !== ViewerUtility.plannerMode ?
            <ListItemSecondaryAction>
              <IconButton edge="end" size='small' onClick={() => {this.props.onWatchlistClick({properties: {mapId: x.id}}, ViewerUtility.dataPaneAction.editIdentificationZoneName)}}>
                <EditIcon />
              </IconButton>
            </ListItemSecondaryAction> : null
          }
        </ListItem>);

      if (plantingSites)
      {
        let plantingSitesElements = plantingSites.map(z => {
          let selectedPlantingSite = parseInt(z.id) === this.props.selectedPlantingSite;
          return (<ListItem button key={z.id + '_' + selectedPlantingSite} onClick={() => {this.props.onPlantingSiteClick(z)}} selected={selectedPlantingSite}>
              <ListItemIcon>
                <FontAwesomeIcon icon={faTree} style={{ color: 'green' }}/>
              </ListItemIcon>
              <ListItemText primary={z.properties.name} />
              {
                this.props.map.accessLevel >= 900 && selectedPlantingSite && this.props.mode !== ViewerUtility.plantMode  && this.props.mode !== ViewerUtility.plannerMode ?
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="edit planting site" size='small' onClick={() => {this.props.onFeatureClick(ViewerUtility.plantingSiteElementType, z)}}>
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction> : null
              }
            </ListItem>);
        })

        returnItem.push(<List key={'list_' + x.name + plantingSitesElements.length} component="div" disablePadding className='nestedWatchlist' dense={true}>
          {plantingSitesElements}
        </List>);
      };

      return returnItem;
    });

    if (elements.length > 0)
    {
      return (
        <List>
          {elements}
        </List>
      )
    }

    return null;
  }

}

export default WatchlistControl;
