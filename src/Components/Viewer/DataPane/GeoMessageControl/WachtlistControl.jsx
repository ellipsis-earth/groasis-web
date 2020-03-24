import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Collapse from '@material-ui/core/Collapse';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTree } from '@fortawesome/free-solid-svg-icons';

import GroasisUtility from '../../GroasisUtility';

import './WatchlistControl.css';

class WatchListControl extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      watchlists: [],
      count: 0
    };
  }

  componentDidMount() {
    /*let list = this.prepareWatchlist();
    this.setState({watchlists: list.list, count: list.count});*/
  }

  /*updateWatchlist = (data) =>
  {
    let list = this.prepareWatchlist('update', data);
    this.setState({watchlists: list.list, count: list.count});
  }*/

  prepareWatchlist = (mode = 'normal', data) => {
    let watchlists = [];

    if (this.props.groasisMaps)
    {
      watchlists.push(<WatchList
        key={'WatchList'}
        user={this.props.user}
        groasisMaps={this.props.groasisMaps}
        map={this.props.map}
        onWatchlistClick={this.props.onWatchlistClick}
        onPlantingSiteClick={this.props.onPlantingSiteClick}
      />)
    }

    /*return({list: watchlists})*/

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
        <CardContent className='data-pane-card-content' key={this.props.groasisMaps.areas.length}>
          {watchlist && watchlist.length > 0 ? watchlist : message}
        </CardContent>
      </Card>
    );
  }
}

class WatchList extends PureComponent {
  componentDidMount() {
  }

  componentDidUpdate(prevProps) {

  }

  render() {
    let groasisMaps = this.props.groasisMaps;
    let areas = groasisMaps.areas;


    if (areas.length === 0) {
      return null;
    }

    /*areas.sort((a, b) => {
      if (a.elementId > b.elementId) {
        return 1;
      }
      else if (a.elementId < b.elementId) {
        return -1;
      }
      else {
        return 0;
      }
    });*/

    let elements = areas.map(x => {
      let returnItem = [];
      let selected = this.props.map && x.id === this.props.map.id;
      let plantingSites = selected && this.props.map.plantingSites ? this.props.map.plantingSites.find(y => y.props.type === 'plantingSite').props.data.features : false;

      returnItem.push(<ListItem key={x.name + '_' + selected} button selected={selected} onClick={() => this.props.onWatchlistClick({properties: {mapId: x.id}})}>
          <ListItemText primary={x.name} />
        </ListItem>);

      if (plantingSites)
      {
        let plantingSitesElements = plantingSites.map(z => {
          return (<ListItem button key={z.id} onClick={() => this.props.onPlantingSiteClick(z)}>
              <ListItemIcon>
                <FontAwesomeIcon icon={faTree} style={{ color: 'green' }}/>
              </ListItemIcon>
              <ListItemText primary={z.properties.name} />
            </ListItem>);
        })
        returnItem.push(<Collapse in={selected && plantingSites ? true : false} key={x.name + '_collapse'}>
          <List component="div" disablePadding className='nestedWatchlist' dense={true}>
            {plantingSitesElements}
          </List>
        </Collapse>);
      };

      return returnItem;
    });

    return (
      <List>
        {elements}
      </List>
    )
  }

}

export default WatchListControl;
