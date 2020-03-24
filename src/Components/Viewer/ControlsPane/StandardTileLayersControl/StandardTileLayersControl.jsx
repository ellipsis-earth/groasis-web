import React, { PureComponent } from 'react';
import { GeoJSON } from 'react-leaflet';

import Card from '@material-ui/core/Card';
import Checkbox from '@material-ui/core/Checkbox';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';

import './StandardTileLayersControl.css';

import ApiManager from '../../../../ApiManager';

const STANDARD_TILE_LAYER_DISPLAY_NAME = 'standard tiles';
const WMS_TILE_DISPLAY_NAME = 'correction mode';
const STANDARD_TILES_LAYER = {
  type: STANDARD_TILE_LAYER_DISPLAY_NAME,
  name: STANDARD_TILE_LAYER_DISPLAY_NAME
};
const WMS_TILE_LAYER = {
  type: WMS_TILE_DISPLAY_NAME,
  name: WMS_TILE_DISPLAY_NAME
};

const MAX_TILES = 500;

class StandardTileLayersControl extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      availableLayers: [],
      selectedLayers: [],
      geoJsonInfo: [],

      options: [],

      expanded: true,
    };
  }

  componentDidMount() {
    this.props.onLayersChange([]);
  }

  componentDidUpdate(prevProps) {
    if (!this.props.map || !this.props.timestampRange) {
      this.props.onLayersChange([]);
      return;
    }

    let differentMap = this.props.map !== prevProps.map;

    let differentTimestamp = !prevProps.timestampRange ||
      this.props.timestampRange.start !== prevProps.timestampRange.start ||
      this.props.timestampRange.end !== prevProps.timestampRange.end;

    let differentBounds = !prevProps.leafletMapViewport ||
      this.props.leafletMapViewport.bounds.xMin !== prevProps.leafletMapViewport.bounds.xMin ||
      this.props.leafletMapViewport.bounds.xMax !== prevProps.leafletMapViewport.bounds.xMax ||
      this.props.leafletMapViewport.bounds.yMin !== prevProps.leafletMapViewport.bounds.yMin ||
      this.props.leafletMapViewport.bounds.yMax !== prevProps.leafletMapViewport.bounds.yMax;

    if (differentMap || differentTimestamp || differentBounds) {

      let availableLayers = this.state.availableLayers;
      let selectedLayers = this.state.selectedLayers;

      if (differentMap) {
        availableLayers = [STANDARD_TILES_LAYER, WMS_TILE_LAYER];
        selectedLayers = [];

        this.setState({
          availableLayers: availableLayers,
          selectedLayers: selectedLayers
        });
      }

      this.prepareLayers(this.props.map, this.props.timestampRange, selectedLayers);
    }
  }

  createLayerCheckboxes = () => {
    let options = [];

    let availableLayers = this.state.availableLayers;
    let selectedLayers = this.state.selectedLayers;

    for (let i = 0; i < availableLayers.length; i++) {

      let availableLayer = availableLayers[i];
      let checked = selectedLayers.find(x => x === availableLayer) ? true : false;
      let layerGeoJsonInfo = this.state.geoJsonInfo.find(x => x.name === availableLayer.name);

      let counter = null;
      if (checked && layerGeoJsonInfo) {
        let className = '';
        let downloadButton = null;

        if (layerGeoJsonInfo.count > MAX_TILES) {
          className = 'geometry-limit-exceeded';
        }
        else {
          downloadButton = (
            <IconButton
              className='download-geometry-button'
              onClick={() => this.onDownload(availableLayer.name)}
            >
              <SaveAlt className='download-geometry-button-icon'/>
            </IconButton>
          );
        }

        let checkboxLabel = (
          <span>
            <span className={className}>{layerGeoJsonInfo.count}</span>
            <span>/{MAX_TILES}</span>
          </span>
        );

        if (availableLayer === WMS_TILE_LAYER && layerGeoJsonInfo.count > MAX_TILES) {
          checkboxLabel = <span className={className}>zoom in further</span>
        }

        counter = (
          <span className='geometry-counter'>
            {checkboxLabel}
            {downloadButton}
          </span>
        );
      }

      let option = (
        <div key={availableLayer.name} className='layer-checkboxes'>
          <Checkbox
            key={availableLayer.name}
            classes={{ root: 'layers-control-checkbox' }}
            color='primary'
            value={availableLayer.name}
            name={availableLayer.name}
            onChange={this.onLayerChange}
            checked={checked}
          />
          <span>
            {availableLayer.name}
          </span>
          {counter}
        </div>
      )

      options.push(option);
    }

    return options;
  }

  prepareLayers = (map, timestampRange, selectedLayers) => {
    let promises = [];

    if (selectedLayers.includes(STANDARD_TILES_LAYER)) {
      promises.push(this.prepareStandardTilesLayer(map, timestampRange));
    }

    if (selectedLayers.includes(WMS_TILE_LAYER)) {
      promises.push(this.prepareWmsTileLayer(map));
    }

    Promise.all(promises)
      .then(results => {
        let leafletElements = results.map(x => x.geoJsonElement);
        this.props.onLayersChange(leafletElements);
        this.setState({ geoJsonInfo: results });
      });
  }

  prepareStandardTilesLayer = async (map, timestampRange) => {
    let bounds = this.props.leafletMapViewport.bounds;

    let timestampNumber = timestampRange ?
      map.timestamps[timestampRange.end].timestamp :
      map.timestamps[map.timestamps.length - 1].timestamp

    let body = {
      mapId: map.id,
      type: ViewerUtility.standardTileLayerType,
      timestamp: timestampNumber,
      xMin: bounds.xMin,
      xMax: bounds.xMax,
      yMin: bounds.yMin,
      yMax: bounds.yMax,
      zoom: map.aggregationZoom,
      limit: MAX_TILES
    };

    return await ApiManager.post('/geometry/ids', body, this.props.user)
      .then(async standardTileIds => {

        let result = {
          name: STANDARD_TILE_LAYER_DISPLAY_NAME,
          count: standardTileIds.count,
          bounds: bounds,
          geoJson: null,
          geoJsonElement: null
        };

        if (result.count === 0 || result.count > MAX_TILES) {
          return result;
        }

        body = {
          mapId: map.id,
          type: ViewerUtility.standardTileLayerType,
          timestamp: map.timestamps[timestampRange.end].timestamp,
          elementIds: standardTileIds.ids
        };

        result.geoJson = await ApiManager.post('/geometry/get', body, this.props.user);
        result.geoJsonElement = (
          <GeoJSON
            key={Math.random()}
            data={result.geoJson}
            style={ViewerUtility.createGeoJsonLayerStyle('cornflowerblue')}
            zIndex={ViewerUtility.standardTileLayerZIndex}
            onEachFeature={(feature, layer) => layer.on({ click: () => this.onFeatureClick(feature) })}
          />
        );

        return result;
      });
  }

  prepareWmsTileLayer = async (map) => {
    let bounds = this.props.leafletMapViewport.bounds;
    let zoom = map.zoom;

    let tileBounds = calculateTileBounds(bounds, zoom);

    let result = {
      name: WMS_TILE_DISPLAY_NAME,
      count: tileBounds.count,
      bounds: bounds,
      geoJson: null,
      geoJsonElement: null
    };

    if (result.count > MAX_TILES) {
      return result;
    }

    result.geoJson = tileBoundsToGeoJson(tileBounds, zoom);
    result.geoJsonElement = (
      <GeoJSON
        key={Math.random()}
        data={result.geoJson}
        style={ViewerUtility.createGeoJsonLayerStyle('cornflowerblue')}
        zIndex={ViewerUtility.standardTileLayerZIndex + 1}
        onEachFeature={(feature, layer) => layer.on({ click: () => this.onFeatureClick(feature) })}
      />
    );

    return result;
  }

  onLayerChange = (e) => {
    let layerName = e.target.value;
    let checked = e.target.checked;

    let isSelected = this.state.selectedLayers.find(x => x.name === layerName);

    let newSelectedLayers = null;
    let changed = false;

    if (checked && !isSelected) {
      let availableLayer = this.state.availableLayers.find(x => x.name === layerName);

      newSelectedLayers = [...this.state.selectedLayers, availableLayer];

      changed = true;
    }
    else if (!checked && isSelected) {
      newSelectedLayers = Utility.arrayRemove(this.state.selectedLayers, isSelected);

      newSelectedLayers = [...newSelectedLayers];

      changed = true;
    }

    if (changed) {
      this.setState({ selectedLayers: newSelectedLayers });
      this.prepareLayers(this.props.map, this.props.timestampRange, newSelectedLayers);
    }
  }

  onExpandClick = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  onFeatureClick = (feature) => {
    this.props.onFeatureClick(feature);
  }

  onDownload = (layerName) => {
    let layerGeoJsonInfo = this.state.geoJsonInfo.find(x => x.name === layerName);

    if (!layerGeoJsonInfo) {
      return;
    }

    let bounds = layerGeoJsonInfo.bounds;

    let decimals = 4;

    let nameComponents = [
      this.props.map.name,
      'tiles',
      bounds.xMin.toFixed(decimals),
      bounds.xMax.toFixed(decimals),
      bounds.yMin.toFixed(decimals),
      bounds.yMax.toFixed(decimals)
    ];

    let fileName = nameComponents.join('_') + '.geojson';

    ViewerUtility.download(fileName, JSON.stringify(layerGeoJsonInfo.geoJson), 'application/json');
  }

  render() {
    if (!this.props.map || this.state.availableLayers.length === 0) {
      return null;
    }

    return (
      <Card className='layers-control'>
        <CardHeader
          className='material-card-header'
          title={
            <Typography gutterBottom variant="h6" component="h2">
              {'Standard tiles'}
            </Typography>
          }
          action={
            <IconButton
              className={this.state.expanded ? 'expand-icon expanded' : 'expand-icon'}
              onClick={this.onExpandClick}
              aria-expanded={this.state.expanded}
              aria-label='Show'
            >
              <ExpandMoreIcon />
            </IconButton>
          }
        />
        <Collapse in={this.state.expanded}>
          <CardContent
            className={'card-content'}
          >
            {
              !this.props.override ?
                this.createLayerCheckboxes() :
                <div className='controls-pane-background-text'>Controlled by feed</div>
            }
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

function calculateTileBounds(bounds, zoom) {
  let pi = Math.PI;
  let zoomComp = Math.pow(2, zoom);

  let comp1 = zoomComp / 360;
  let comp2 = 2 * pi;
  let comp3 = pi / 4;

  let tileXMin = Math.floor((bounds.xMin + 180) * comp1);
  let tileYMin = Math.floor(zoomComp / comp2 * (pi - Math.log(Math.tan(comp3 + bounds.yMax / 360 * pi))));

  let tileXMax = Math.floor((bounds.xMax + 180 ) * comp1 + 1);
  let tileYMax = Math.floor(zoomComp / comp2 * (pi - Math.log(Math.tan(comp3 + bounds.yMin / 360 * pi))) + 1);

  return {
    tileXMin: tileXMin,
    tileYMin: tileYMin,

    tileXMax: tileXMax,
    tileYMax: tileYMax,
    count: (tileXMax - tileXMin) * (tileYMax - tileYMin)
  };
}

function tileBoundsToGeoJson(tileBounds, zoom) {
  let result = {
    type: 'FeatureCollection',
    count: tileBounds.count,
    features: []
  };

  for (let tileY = tileBounds.tileYMin; tileY < tileBounds.tileYMax; tileY++) {
    for (let tileX = tileBounds.tileXMin; tileX < tileBounds.tileXMax; tileX++) {
      let tile = {
        tileX: tileX,
        tileY: tileY,
        zoom: zoom
      };

      let tileCoord = calculateTileCoords(tile, zoom);

      let coords = [[
        [tileCoord.xMin, tileCoord.yMin],
        [tileCoord.xMax, tileCoord.yMin],
        [tileCoord.xMax, tileCoord.yMax],
        [tileCoord.xMin, tileCoord.yMax],
        [tileCoord.xMin, tileCoord.yMin]
      ]];

      let feature = {
        id: result.features.length,
        type: "Feature",
        properties: {
          type: ViewerUtility.wmsTileLayerType,
          tileX: tile.tileX,
          tileY: tile.tileY,
          zoom: tile.zoom
        },
        geometry: {
          type: 'Polygon',
          coordinates: coords
        }
      };

      result.features.push(feature);
    }
  }

  return result;
}

const comp1 = (360 / (2 * Math.PI));
const comp3 = Math.PI / 2;

function calculateTileCoords(tile) {
  let pi = Math.PI;

  let tileX = tile.tileX;
  let tileY = tile.tileY;
  let zoom = tile.zoom;

  let comp2 = Math.pow(2, zoom);

  let xMin = ((tileX * 360) / comp2) - 180;
  let xMax = ((tileX + 1) * 360 / comp2) - 180;
  let yMin = comp1 * (2 * (Math.atan(Math.exp(-2 * (pi * (tileY + 1)) / comp2 + pi))) - comp3);
  let yMax = comp1 * (2 * (Math.atan(Math.exp(-2 * (pi * tileY) / comp2 + pi))) - comp3);

  return {
    xMin: xMin,
    xMax: xMax,
    yMin: yMin,
    yMax: yMax
  };
}

export default StandardTileLayersControl;
