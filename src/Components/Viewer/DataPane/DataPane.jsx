import React, { PureComponent } from 'react';

import {
  Card,
  CardHeader,
  CardActions,
  Typography,
  Button,
  IconButton,
  CardContent
} from '@material-ui/core';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import './DataPane.css';
import ViewerUtility from '../ViewerUtility';

import LegendControl from './LegendControl/LegendControl';
import AnalyseControl from './AnalyseControl/AnalyseControl';
import GeoMessageControl from './GeoMessageControl/GeoMessageControl';
import CustomPolygonControl from './CustomPolygonControl/CustomPolygonControl';

import ApiManager from '../../../ApiManager';

class DataPane extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      home: true
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    let differentAction = this.props.action && prevProps.action !== this.props.action;

    if (differentAction && this.state.home) {
      this.setState({ home: false });
    }
    else if (prevProps.action && !this.props.action && !this.state.home) {
      this.setState({ home: true });
    }
  }

  goToAction = () => {
    this.setState({ home: false });
  }

  onFlyTo = () => {
    let action = this.props.action;

    if (action === ViewerUtility.dataPaneAction.feed) {
      this.props.onFlyTo({ type: ViewerUtility.flyToType.map });
    }
    else {
      this.props.onFlyTo({ type: ViewerUtility.flyToType.currentElement });
    }
  }

  render() {
    let style = {};
    if (!this.props.isOpen) {
      style = { display: 'none' };
    }

    let home = this.state.home;

    let user = this.props.user;
    let element = this.props.element;
    let action = this.props.action;
    let title = '';
    let idText = null;
    let homeElement = null;
    let actionControl = null;

    if (home) {
      title = 'Overview';
      let map = this.props.map;
      let legend = null;

      if (map) {
        title = 'Region'
        idText = map.subatlas;
        legend = (
          <LegendControl
            map={this.props.map}
          />
        );
      }

      homeElement = (
        <div>
          <Button
            className='geomessage-feed-button'
            variant='contained'
            color='primary'
            onClick={() => this.props.onDataPaneAction(ViewerUtility.dataPaneAction.feed)}
            disabled={user ? false : true}
          >
            Watchlist
          </Button>
          {legend}
        </div>
      );
    }
    else if (action === ViewerUtility.dataPaneAction.feed) {
      title = 'Watchlist';
    }
    else if (element) {
      if (element.type === ViewerUtility.standardTileLayerType) {
        title = 'Standard tile';
        idText = `${element.feature.properties.tileX}, ${element.feature.properties.tileY}, ${element.feature.properties.zoom}`;
      }
      else if (element.type === ViewerUtility.polygonLayerType) {
        title = 'Polygon';
        idText = element.feature.properties.id;
      }
      else if (element.type === ViewerUtility.customPolygonTileLayerType) {
        title = 'Custom polygon';
        idText = element.feature.properties.id;
      }
      else if (element.type === ViewerUtility.drawnPolygonLayerType) {
        title = 'Drawn polygon';
        idText = 'Drawn polygon';
      }
      else if (element.type === ViewerUtility.treeElementType) {
        title = 'Tree';
        idText = element.feature.properties.id;
      }
    }

    if (action === ViewerUtility.dataPaneAction.analyse) {
      actionControl = (
        <AnalyseControl
          user={this.props.user}
          map={this.props.map}
          element={this.props.element}
          home={home}
        />
      );
    }
    else if (action === ViewerUtility.dataPaneAction.geoMessage ||
      action === ViewerUtility.dataPaneAction.feed) {
      actionControl = (
        <GeoMessageControl
          user={this.props.user}
          groasisMaps={this.props.groasisMaps}
          map={this.props.map}
          timestampRange={this.props.timestampRange}
          geolocation={this.props.geolocation}
          element={this.props.element}
          isFeed={action === ViewerUtility.dataPaneAction.feed}
          jumpToMessage={this.props.jumpToMessage}
          home={home}
          onDataPaneAction={this.props.onDataPaneAction}
          onFlyTo={this.props.onFlyTo}
          onLayersChange={this.props.onLayersChange}
          onFeatureClick={this.props.onFeatureClick}
          onDeselect={this.props.onDeselect}
          onWatchlistClick={this.props.onWatchlistClick}
        />
      );
    }
    else if (action === ViewerUtility.dataPaneAction.createCustomPolygon ||
      action === ViewerUtility.dataPaneAction.editCustomPolygon) {
        actionControl = (
          <CustomPolygonControl
            user={this.props.user}
            map={this.props.map}
            timestampRange={this.props.timestampRange}
            element={this.props.element}
            isEdit={action === ViewerUtility.dataPaneAction.editCustomPolygon}
            home={home}
            onFlyTo={this.props.onFlyTo}
            onPolygonChange={this.props.onPolygonChange}
          />
        );
    }

    let dataPaneClassName = 'viewer-pane data-pane';
    if (action === ViewerUtility.dataPaneAction.feed) {
      dataPaneClassName += ' no-scroll';
    }

    let actionsClassName = 'data-pane-title-actions';
    if (home) {
      actionsClassName += ' data-pane-title-actions-right'
    }

    return (
      <div className={dataPaneClassName} style={style}>
        <Card className='data-pane-title-card'>
          <CardActions className={actionsClassName}>
            {
              !home || action ?
                <IconButton
                  className='data-pane-title-actions-button'
                  aria-label='Home'
                  onClick={() => this.setState({ home: !home })}
                >
                  {home ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
                </IconButton> : null
            }
          </CardActions>
          <CardHeader
            className='data-pane-title-header'
            title={
              <Typography
                variant="h6"
                component="h2"
                className='no-text-transform data-pane-title'
              >
                {title}
              </Typography>
            }
            subheader={
              idText ?
                <Button
                  onClick={this.onFlyTo}
                >
                  <div>
                    {idText}
                  </div>
                </Button> : null
            }
          />
        </Card>
        {homeElement}
        {actionControl}
      </div>
    );
  }
}

export default DataPane;
