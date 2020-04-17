import React, { PureComponent } from 'react';
import { Pane, GeoJSON } from 'react-leaflet';
import L from 'leaflet';

import Card from '@material-ui/core/Card';
import Checkbox from '@material-ui/core/Checkbox';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import GroasisUtility from '../../GroasisUtility';
import ViewerUtility from '../../ViewerUtility';

import './PolygonLayersControl.css';

import ApiManager from '../../../../ApiManager';

const MAX_POLYGONS = 500;

const IDENTIFICATION_LAYERS = [{name: GroasisUtility.request.layer}];

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

    let differentMode = prevProps.mode !== this.props.mode;
    let differentPlantingSite = this.props.selectedPlantingSite !== prevProps.selectedPlantingSite;
    let differentPlantingLine = this.props.selectedPlantingLine !== prevProps.selectedPlantingLine;

    if (differentMap || differentTimestamp || differentBounds || differentSelectedLayers || differentMode || differentPlantingSite || differentPlantingLine) {
      let availableLayers = this.props.map.layers ? this.props.map.layers.polygon : [];
      if(this.props.mode === ViewerUtility.identificationMode && this.props.map.type !== 'area')
      {
        availableLayers = IDENTIFICATION_LAYERS;
      }
      else if(this.props.mode === ViewerUtility.identificationMode)
      {
        availableLayers = [...IDENTIFICATION_LAYERS, ...[{name: GroasisUtility.layers.polygon.plantingSites}]];
      }
      else if(this.props.mode === ViewerUtility.plannerMode)
      {
        let newLayers = [];
        for (let key in GroasisUtility.layers.polygon)
        {
          newLayers.push({name: GroasisUtility.layers.polygon[key]})
        }

        availableLayers = [...IDENTIFICATION_LAYERS, ...newLayers];
      }

      if (differentMap || differentMode) {
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
          <FormControlLabel
            margin='dense'
            control={
              <Checkbox
                key={availableLayer.name}
                classes={{ root: 'layers-control-checkbox' }}
                color='primary'
                value={availableLayer.name}
                name={availableLayer.name}
                onChange={this.onLayerChange}
                checked={checked}
              />
            }
            label={availableLayer.name}
          />
          {counter}
        </div>
      )

      options.push(option);
    }

    return options;
  }

  prepareLayers = async (availableLayers) => {
    //availableLayers = availableLayers[ViewerUtility.polygonLayerType] ? availableLayers[ViewerUtility.polygonLayerType] : availableLayers;
    let map = this.props.map.referenceMap ? this.props.map.referenceMap : this.props.map;
    let selectedLayers = this.props.selectedLayers[ViewerUtility.polygonLayerType];
    let promises = [];

    for (let i = 0; i < availableLayers.length; i++) {

      let polygonLayer = availableLayers[i];

      if (!selectedLayers.find(x => x === polygonLayer.name)) {
        continue;
      }

      if(this.props.mode !== ViewerUtility.identificationMode)
      {
        polygonLayer = map.layers.polygon.find(x => x.name === availableLayers[i].name);
        if(polygonLayer)
        {
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

          let polygonIds;

          if (this.props.mode === ViewerUtility.plannerMode && this.props.selectedPlantingSite)
          {
            if (polygonLayer.name === GroasisUtility.layers.polygon.plantingLines || polygonLayer.name === GroasisUtility.layers.polygon.trees)
            {
              body.filters = [{key: 'Planting site id', value: this.props.selectedPlantingSite, operator: '='}]
            }
          }

          if (this.props.mode === ViewerUtility.plannerMode && this.props.selectedPlantingLine)
          {
            if(polygonLayer.name === GroasisUtility.layers.polygon.trees)
            {
              body.filters.push({key: 'Planting line id', value: this.props.selectedPlantingLine, operator: '='})
            }
          }


          if (polygonLayer.name === GroasisUtility.layers.polygon.plantingSites && this.props.mode === ViewerUtility.plannerMode && this.props.selectedPlantingSite)
          {
            polygonIds = {count: 1, ids: [this.props.selectedPlantingSite]};
          }
          else if (polygonLayer.name === GroasisUtility.layers.polygon.plantingLines && this.props.mode === ViewerUtility.plannerMode && this.props.selectedPlantingLine)
          {
            polygonIds = {count: 1, ids: [this.props.selectedPlantingLine]};
          }
          else
          {
            polygonIds = await ApiManager.post('/geometry/ids', body, this.props.user);
          }

          let count = {
            ...this.state.count,
          };

          count[polygonLayer.name] = polygonIds.count;

          this.setState({ count: count });

          if (!polygonIds || polygonIds.count === 0 || polygonIds.count > MAX_POLYGONS) {
            this.layerGeoJsons[polygonLayer.name] = null;
            continue;
          }

          body = {
            mapId: map.id,
            type: ViewerUtility.polygonLayerType,
            elementIds: polygonIds.ids,
          };

          let leafletGeojsonLayerPromise = await ApiManager.post('/geometry/get', body, this.props.user)
            .then(polygonsGeoJson => {
              if (!polygonsGeoJson || !polygonsGeoJson.features) {
                this.layerGeoJsons[polygonLayer.name] = null;
                return null;
              }

              this.layerGeoJsons[polygonLayer.name] = {
                geoJson: polygonsGeoJson,
                bounds: bounds
              };

              let icon = ViewerUtility.returnMarker(`#${polygonLayer.color}`, 2, 'RoomTwoTone');

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

                feature.properties.mapId = map.id;


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

                let onEachFeature = null;

                if (this.props.mode === ViewerUtility.plannerMode && polygonLayer.name !== GroasisUtility.layers.polygon.plantingSites && polygonLayer.name !== GroasisUtility.request.layer)
                {
                  onEachFeature = (feature, layer) => {layer.on({
                    click: () => this.props.onFeatureClick(elementType, feature, polygonLayer.hasAggregatedData)
                  })};
                }

                let zIndex = ViewerUtility.polygonLayerZIndex[polygonLayer.name] ? ViewerUtility.polygonLayerZIndex[polygonLayer.name] : ViewerUtility.polygonLayerZIndex.base + i;
              return (<Pane zIndex={zIndex} key={Math.random()} name={polygonLayer.name.replace(' ', '-').toLowerCase()}>
                [<GeoJSON
                  key={Math.random()}
                  data={polygonsGeoJson}
                  style={ViewerUtility.createGeoJsonLayerStyle(`#${polygonLayer.color}`, null, null, zIndex)}
                  onEachFeature={onEachFeature}
                  pointToLayer={(geoJsonPoint, latlng) => this.markerReturn(latlng, icon)}
                  name={polygonLayer.name}
                  zIndex={ViewerUtility.polygonLayerZIndex[polygonLayer.name]}
                  className={!onEachFeature ? 'noClick' : ''}
                />,
                <GeoJSON
                  key={Math.random()}
                  data={linesCollection}
                  style={ViewerUtility.createGeoJsonLayerStyle(`#${polygonLayer.color}`, 3, null, zIndex)}
                  onEachFeature={onEachFeature}
                  name={polygonLayer.name}
                  zIndex={ViewerUtility.polygonLayerZIndex[polygonLayer.name]}
                  className={!onEachFeature ? 'noClick' : ''}
                />]
              </Pane>);
            });

          promises.push(leafletGeojsonLayerPromise);
        }
        else
        {
          if(selectedLayers.includes(GroasisUtility.request.layer))
          {
            let zIndex = ViewerUtility.polygonLayerZIndex[GroasisUtility.request.layer];
            let data = this.props.map.type === 'area' ? {type: 'FeatureCollection', features: [this.props.map.geoJson]} : this.props.map.geoJson;
            promises.push(Promise.resolve(
              <Pane zIndex={zIndex} key={Math.random()} name={GroasisUtility.request.layer.replace(' ', '-').toLowerCase()}>
                <GeoJSON
                  key={Math.random()}
                  data={data}
                  style={this.props.map.type === 'area' ? ViewerUtility.createGeoJsonLayerStyle('#87cef3', 3, null, zIndex) : ViewerUtility.createGeoJsonLayerStyle('#48ac3e', 3, null, zIndex)}
                  /*onEachFeature={(feature, layer) => {layer.on({
                    click: () => {this.props.onWatchlistClick(feature)}
                  })}}*/
                  className='noClick'
                  name={GroasisUtility.request.layer}
                  zIndex={zIndex}
                />
              </Pane>)
            );
          }
        }
      }
    }

    let JSONlayers = await Promise.all(promises);
    let leafletGeoJsonLayers = [...JSONlayers];

    if(this.props.mode === ViewerUtility.identificationMode)
    {
      if(selectedLayers.includes(GroasisUtility.request.layer))
      {
        let zIndex = ViewerUtility.polygonLayerZIndex[GroasisUtility.request.layer];

        let data = this.props.map.type === 'area' ? {type: 'FeatureCollection', features: [this.props.map.geoJson]} : this.props.map.geoJson;
        leafletGeoJsonLayers.push(
          <Pane zIndex={zIndex} key={Math.random()} name={GroasisUtility.request.layer.replace(' ', '-').toLowerCase()}>
            <GeoJSON
              key={Math.random()}
              data={data}
              style={ViewerUtility.createGeoJsonLayerStyle('#87cef3', 3, null, zIndex)}
              name={GroasisUtility.request.layer}
              /*onEachFeature={(feature, layer) => {layer.on({
                click: () => {this.props.onWatchlistClick(feature)}
              })}}*/
              className='noClick'
            />
          </Pane>
        )
      }

      if(selectedLayers.includes(GroasisUtility.layers.polygon.plantingSites))
      {
        leafletGeoJsonLayers.push(this.props.map.plantingSites);
      }
    }

    this.props.onLayersChange(leafletGeoJsonLayers);
  }

  changeWeight = (feature, layer) => {
    if (feature.geometry.type === 'LineString')
    {
      console.log(layer)
    }
  }

  markerReturn = (latlng, icon) => {
    return L.marker(latlng, {icon: icon, pane: 'markerPane'});
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
      <Card className='layers-control'>
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
            {this.createLayerCheckboxes()}
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

export default PolygonLayersControl;
