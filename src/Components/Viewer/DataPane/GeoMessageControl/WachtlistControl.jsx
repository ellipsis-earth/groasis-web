import React, { PureComponent } from 'react';
import { GeoJSON } from 'react-leaflet';

import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  Collapse,
  IconButton,
  Input,
  Checkbox,
  ListItemText,
  InputLabel,
  FormControl
} from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';
import {  
  faTree
} from '@fortawesome/free-solid-svg-icons';

import ViewerUtility from '../../ViewerUtility';
import DataPaneUtility from '../DataPaneUtility';

import ApiManager from '../../../../ApiManager';

import './WatchlistControl.css';

class WatchListControl extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }

  render() {
    if (this.props.home) {
      return null;
    }

    let watchLists = this.props.groasisMaps.subatlases.map(x => {
      return (
        <WatchList
          user={this.props.user}
          map={this.props.groasisMaps[x]}
          onWatchlistClick={this.props.onWatchlistClick}
        />
      );
    })

    return (
      <div>
        {watchLists}
      </div>
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

    let elements = watchlist.map(x => {
      return (
        <Button
          className='watchlist-button'
          variant='outlined'
          color='secondary'
          onClick={() => this.props.onWatchlistClick(map.subatlas, x)}
        >
          <FontAwesomeIcon icon={faTree} />
          <span className='watchlist-button-span'>{x.elementId}</span>
        </Button>
      );
    });

    return (
      <div>
        <Card className='data-pane-card'>
          <CardHeader
            title={
              <Typography variant='h6' component='h2' className='no-text-transform'>
                {map.subatlas}
              </Typography>
            }
          />
          <CardContent className='data-pane-card-content'>
            {elements}
          </CardContent>
        </Card>
      </div>
    )
  }

}

export default WatchListControl;
