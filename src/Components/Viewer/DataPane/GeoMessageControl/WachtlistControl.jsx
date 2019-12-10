import React, { PureComponent } from 'react';

import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
} from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTree } from '@fortawesome/free-solid-svg-icons';

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
      for (var i = 0; i < this.props.groasisMaps.subatlases.length; i++)
      {
        let subatlas = this.props.groasisMaps.subatlases[i];
        let map = this.props.groasisMaps[subatlas];

        if (mode === 'update' && this.props.groasisMaps.subatlases[i] === data.map.subatlas)
        {
          subatlas = data.map.subatlas;
          map = data.map;
        }

        if (map.watchlist.length > 0)
        {
           watchlists.push(<WatchList
            key={'WatchList_' + subatlas}
            user={this.props.user}
            map={map}
            onWatchlistClick={this.props.onWatchlistClick}
          />)
        }

        count = count + map.watchlist.length;
      }
    }

    return({list: watchlists, count: count})
  }

  render() {
    if (this.props.home || !this.props.groasisMaps) {
      return null;
    }

    return (
      <Card className='data-pane-card watchList'>
        <CardHeader
          title={
            <Typography variant='h6' component='h2' className='watchlist-title'>
              Watchlist
            </Typography>
          }
        />
        <CardContent className='data-pane-card-content' key={this.state.count}>
          {this.state.watchlists && this.state.watchlists.length > 0 ? this.state.watchlists : 'no trees to watch'}
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
    let watchlist = map.watchlist;

    if (watchlist.length === 0) {
      return null;
    }

    watchlist.sort((a, b) => {
      if (a.elementId > b.elementId) {
        return 1;
      }
      else if (a.elementId < b.elementId) {
        return -1;
      }
      else {
        return 0;
      }
    });

    let elements = watchlist.map(x => {
      return (
        <Button
          className='watchlist-button'
          variant='outlined'
          color='secondary'
          onClick={() => this.props.onWatchlistClick(map.subatlas, x)}
          key={map.subatlas + '_' + x.elementId}
        >
          <FontAwesomeIcon icon={faTree} style={{ color: 'green' }}/>
          <span className='watchlist-button-span'>{x.elementId}</span>
        </Button>
      );
    });

    return (
      <div className="watchlistSubatlas">
        <h3>{map.subatlas}</h3>
        <div className="buttonContainer">
          {elements}
        </div>
      </div>
    )
  }

}

export default WatchListControl;
