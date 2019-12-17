import React, { PureComponent } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';


import {
  Card,
  Checkbox,
  CardHeader,
  CardContent,
  Collapse,
  IconButton,
  Typography
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import GroasisUtility from '../../GroasisUtility';
import ViewerUtility from '../../ViewerUtility';

import './PolygonLayersControl.css';

import ApiManager from '../../../../ApiManager';

const MAX_POLYGONS = 500;

class PolygonLayersControl extends PureComponent {

  layerGeoJsons = {}

  constructor(props, context) {
    super(props, context);

    this.state = {
      availableLayers: [],

      options: [],

      expanded: true,

      count: {}
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    if (!this.props.map || !this.props.timestampRange) {
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

    let prevSelectedLayers = prevProps.selectedLayers[ViewerUtility.polygonLayerType];
    let curSelectedLayers = this.props.selectedLayers[ViewerUtility.polygonLayerType];

    let differentSelectedLayers = prevSelectedLayers.length !== curSelectedLayers.length;
    if (!differentSelectedLayers) {
      for (let i = 0; i < prevSelectedLayers.length; i++) {
        if (prevSelectedLayers[i] !== curSelectedLayers[i]) {
          differentSelectedLayers = true;
          break;
        }        
      }
    }

    if (differentMap || differentTimestamp || differentBounds || differentSelectedLayers) {
      let availableLayers = this.state.availableLayers;

      if (differentMap) {
        if (this.props.mode === ViewerUtility.plannerMode && !this.props.map.referenceMap)
        {
          availableLayers = this.props.map.layers;
        }
        else
        {
          let referenceMap = this.props.map.referenceMap;
          let polygonLayers = referenceMap.layers.polygon;

          let groasisPolygonLayers = GroasisUtility.layers.polygon;

          availableLayers = [
            polygonLayers.find(x => x.name === groasisPolygonLayers.trees),
            polygonLayers.find(x => x.name === groasisPolygonLayers.objectOfInterest),
            polygonLayers.find(x => x.name === groasisPolygonLayers.plantingLines)
          ];
        }

        this.layerGeoJsons = {};

        this.setState({
          availableLayers: availableLayers,
          count: {}
        });
      }

      this.prepareLayers(availableLayers);
    }
  }

  refresh = () => {
    this.prepareLayers(this.state.availableLayers);
  }

  createLayerCheckboxes = () => {
    let options = [];

    let availableLayers = this.state.availableLayers;
    let selectedLayers = this.props.selectedLayers[ViewerUtility.polygonLayerType];

    for (let i = 0; i < availableLayers.length; i++) {

      let availableLayer = availableLayers[i];
      let checked = selectedLayers.find(x => x === availableLayer.name) ? true : false;

      let counter = null;
      let count = this.state.count[availableLayer.name];
      if (checked && count !== undefined) {
        let className = '';
        let downloadButton = null;

        if (count > MAX_POLYGONS) {
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

        counter = (
          <span className='geometry-counter'>
            <span className={className}>{count}</span>
            <span>/{MAX_POLYGONS}</span>
            {downloadButton}
          </span>
        )
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

  prepareLayers = async (availableLayers) => {
    let map = this.props.map.referenceMap ? this.props.map.referenceMap : this.props.map;
    let selectedLayers = this.props.selectedLayers[ViewerUtility.polygonLayerType];
    let promises = [];

    for (let i = 0; i < availableLayers.length; i++) {

      let polygonLayer = availableLayers[i];

      if (!selectedLayers.find(x => x === polygonLayer.name)) {
        continue;
      }

      let bounds = this.props.leafletMapViewport.bounds;

      let body = {
        mapId: map.id,
        type: ViewerUtility.polygonLayerType,
        layer: polygonLayer.name,
        xMin: bounds.xMin,
        xMax: bounds.xMax,
        yMin: bounds.yMin,
        yMax: bounds.yMax,
        limit: MAX_POLYGONS
      };

      let leafletGeojsonLayerPromise = ApiManager.post('/geometry/ids', body, this.props.user)
        .then(polygonIds => {
          let count = {
            ...this.state.count,
          };
          count[polygonLayer.name] = polygonIds.count;

          this.setState({ count: count });

          if (!polygonIds || polygonIds.count === 0 || polygonIds.count > MAX_POLYGONS) {
            this.layerGeoJsons[polygonLayer.name] = null;
            return null;
          }

          body = {
            mapId: map.id,
            type: ViewerUtility.polygonLayerType,
            elementIds: polygonIds.ids
          };

          return ApiManager.post('/geometry/get', body, this.props.user);
        })
        .then(polygonsGeoJson => {
          if (!polygonsGeoJson) {
            this.layerGeoJsons[polygonLayer.name] = null;
            return null;
          }

          this.layerGeoJsons[polygonLayer.name] = {
            geoJson: polygonsGeoJson,
            bounds: bounds
          };

          let icon = ViewerUtility.returnMarker(`#${polygonLayer.color}`, this.props.markerSize, 'RoomTwoTone');          

          let geometryCollection = {
            type: 'FeatureCollection',
            features: []
          };

          let linesCollection = {
            type: 'FeatureCollection',
            features: []
          };

          for (let i = 0; i < polygonsGeoJson.features.length; i++) {
            let feature = polygonsGeoJson.features[i];
            let geometry = feature.geometry;

            if (geometry.type === 'LineString') {
              linesCollection.features.push(feature);
            }
            else {
              if (polygonLayer.name === GroasisUtility.layers.polygon.trees && geometry.type === 'Polygon') {
                let treeBounds = ViewerUtility.getBounds(geometry.coordinates);

                if (treeBounds === null) {
                  continue;
                }

                let center = [
                  treeBounds.xMin + (treeBounds.xMax - treeBounds.xMin) / 2,
                  treeBounds.yMin + (treeBounds.yMax - treeBounds.yMin) / 2
                ];

                let pointGeometry = {
                  type: 'Point',
                  coordinates: center
                };

                feature.originalGeometry = feature.geometry;
                feature.geometry = pointGeometry;
              } 

              geometryCollection.features.push(feature);
            }
          }

          geometryCollection.count = geometryCollection.features.length;
          linesCollection.count = linesCollection.features.length;

          let elementType = polygonLayer.name === GroasisUtility.layers.polygon.trees ?
            ViewerUtility.treeElementType : ViewerUtility.polygonLayerType;

          return (
            [<GeoJSON
              key={Math.random()}
              data={polygonsGeoJson}
              style={ViewerUtility.createGeoJsonLayerStyle(`#${polygonLayer.color}`)}
              zIndex={ViewerUtility.polygonLayerZIndex + i}
              onEachFeature={(feature, layer) => {layer.on({ 
                click: () => this.props.onFeatureClick(elementType, feature, polygonLayer.hasAggregatedData) 
              })}}
              pointToLayer={(geoJsonPoint, latlng) => this.markerReturn(latlng, icon)}
              name={polygonLayer.name}
            />,
            <GeoJSON
              key={Math.random()}
              data={linesCollection}
              style={ViewerUtility.createGeoJsonLayerStyle(`#${polygonLayer.color}`, 3)}
              zIndex={ViewerUtility.polygonLayerZIndex + i}
              onEachFeature={(feature, layer) => {layer.on({ 
                click: () => this.props.onFeatureClick(elementType, feature, polygonLayer.hasAggregatedData) 
              })}}
              name={polygonLayer.name}
            />
            ]
          );
        });

      promises.push(leafletGeojsonLayerPromise);
    }

    let leafletGeoJsonLayers = await Promise.all(promises);

    this.props.onLayersChange(leafletGeoJsonLayers);
  }

  changeWeight = (feature, layer) => {
    if (feature.geometry.type === 'LineString')
    {
      console.log(layer)
    }
  }

  markerReturn = (latlng, icon) => {
    return L.marker(latlng, {icon: icon, pane: 'overlayPane'});
  }

  onLayerChange = (e) => {
    let layerName = e.target.value;
    let checked = e.target.checked;

    let layerChanges = [{
      name: layerName,
      add: checked
    }];

    this.props.onSelectedLayersChange(ViewerUtility.polygonLayerType, layerChanges, false);
  }

  onExpandClick = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  onDownload = (layerName) => {
    let data = this.layerGeoJsons[layerName];

    if (!data) {
      return;
    }

    let bounds = data.bounds;

    let decimals = 4;

    let nameComponents = [
      this.props.map.referenceMap.name,
      'polygons',
      layerName,
      bounds.xMin.toFixed(decimals),
      bounds.xMax.toFixed(decimals),
      bounds.yMin.toFixed(decimals),
      bounds.yMax.toFixed(decimals)
    ];

    let fileName = nameComponents.join('_').replace(' ', '_') + '.geojson';

    ViewerUtility.download(fileName, JSON.stringify(data.geoJson), 'application/json');
  }

  render() {
    if (!this.props.map || this.state.availableLayers.length === 0) {
      return null;
    }

    return (
      <Card className='layers-contol'>
        <CardHeader
          className='material-card-header'
          title={
            <Typography gutterBottom variant="h6" component="h2">
              {'Polygons'}
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

export default PolygonLayersControl;
