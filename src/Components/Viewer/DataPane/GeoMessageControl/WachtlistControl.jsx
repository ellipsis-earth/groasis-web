import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
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
    let list = this.prepareWatchlist();
    this.setState({watchlists: list.list, count: list.count});
  }

  updateWatchlist = (data) =>
  {
    let list = this.prepareWatchlist('update', data);
    this.setState({watchlists: list.list, count: list.count});
  }

  prepareWatchlist = (mode = 'normal', data) => {
    let watchlists = [];
    let count = 0;

    if (this.props.groasisMaps)
    {
      watchlists.push(<WatchList
        key={'WatchList'}
        user={this.props.user}
        map={this.props.groasisMaps}
        onWatchlistClick={this.props.onWatchlistClick}
      />)
    }

    return({list: watchlists})
  }

  render() {
    if (this.props.home || !this.props.groasisMaps) {
      return null;
    }

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
          {this.state.watchlists && this.state.watchlists.length > 0 ? this.state.watchlists : message}
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
    let map = this.props.map;
    let areas = map.areas;

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
      return (
        <ListItem button key={x.name} onClick={() => this.props.onWatchlistClick(x.id)}>
          <ListItemIcon>
            <FontAwesomeIcon icon={faTree} style={{ color: 'green' }}/>
          </ListItemIcon>
          <ListItemText primary={x.name} />
        </ListItem>
      );
    });

    return (
      <List>
        {elements}
      </List>
    )
  }

}

export default WatchListControl;
