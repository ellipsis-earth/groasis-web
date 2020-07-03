import React, { PureComponent } from 'react';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import './DataPane.css';
import ViewerUtility from '../ViewerUtility';

import LegendControl from './LegendControl/LegendControl';
import TreeTypeControl from './TreeTypeControl/TreeTypeControl';
import AnalyseControl from './AnalyseControl/AnalyseControl';
import CustomPolygonControl from './CustomPolygonControl/CustomPolygonControl';
import GeoMessageControl from './GeoMessageControl/GeoMessageControl';
import PlanControl from './PlanControl/PlanControl';
import MultiplyControl from './MultiplyControl/MultiplyControl';

import WachtlistControl from './GeoMessageControl/WachtlistControl';


class DataPane extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      home: true
    };

    this.watchlist = React.createRef();
    this.multiplyControl = React.createRef();
    this.plantControl = React.createRef();
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

  goToHome = () => {
    this.setState({ home: true });
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

    /*let user = this.props.user;*/
    let element = this.props.element;
    let action = this.props.action;
    let title = '';
    let idText = null;
    let homeElement = null;
    let actionControl = null;

    if (home) {
      title = 'Overview';
      let map = this.props.map;

      if (map) {
        title = 'Region'
        idText = map.subatlas;
      }

      homeElement = [
        <WachtlistControl
          user={this.props.user}
          groasisMaps={this.props.groasisMaps}
          map={this.props.map}
          home={this.props.home}
          onWatchlistClick={this.props.onWatchlistClick}
          onPlantingSiteClick={this.props.onPlantingSiteClick}
          key={this.props.groasisMaps ? this.props.groasisMaps.areas.join('_') : 'default'}
          watchlistRefresh={this.props.watchlistRefresh}
          selectedPlantingSite={this.props.selectedPlantingSite}
          onFeatureClick={this.props.onFeatureClick}
          ref={this.watchlist}
        />,
        <LegendControl
          selectedLayers={this.props.selectedLayers}
          map={this.props.map}
          key='LegendControl'
        />,
        <TreeTypeControl
          key='TreeTypeControl'
          map={this.props.map}
          user={this.props.user}
        />
      ];
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
    else if (action === ViewerUtility.dataPaneAction.multiply && !this.state.home)
    {
      actionControl = (
        <MultiplyControl
          user={this.props.user}
          map={this.props.map}
          selectedPlantingSite={this.props.selectedPlantingSite}
          element={this.props.element}
          leafletMap={this.props.leafletMap}
          onLayersChange={this.props.onLayersChange}
          updatePolygons={this.props.updatePolygons}
          onDeselect={this.props.onDeselect}
          ref={this.multiplyControl}
        />
      );
    }
    else if (action === ViewerUtility.dataPaneAction.planTrees && !this.state.home)
    {
      actionControl = (
        <PlanControl
          user={this.props.user}
          map={this.props.map}
          selectedPlantingSite={this.props.selectedPlantingSite}
          selectedPlantingLine={this.props.selectedPlantingLine}
          element={this.props.element}
          leafletMap={this.props.leafletMap}
          onLayersChange={this.props.onLayersChange}
          updatePolygons={this.props.updatePolygons}
          onDeselect={this.props.onDeselect}
          ref={this.plantControl}
          setHome={this.goToHome}
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
      {
        action != ViewerUtility.dataPaneAction.planTrees ? <Card className='data-pane-title-card'>
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
        </Card> : null
      }
        {homeElement}
        {actionControl}
      </div>
    );
  }
}

export default DataPane;
