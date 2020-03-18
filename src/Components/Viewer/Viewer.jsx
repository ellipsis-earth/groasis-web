import React, { PureComponent } from 'react';
import { Map, Marker, GeoJSON } from 'react-leaflet';
import 'leaflet-draw';
import L from 'leaflet';

import ApiManager from '../../ApiManager';

import Utility from '../../Utility';
import ViewerUtility from './ViewerUtility';
import GroasisUtility from './GroasisUtility';

import TimestampSelector from './TimestampSelector/TimestampSelector';
import MapHeader from './MapHeader/MapHeader';
import MapControl from './MapControl/MapControl';

import ControlsPane from './ControlsPane/ControlsPane';
import DataPane from './DataPane/DataPane';
import SelectionPane from './SelectionPane/SelectionPane';
import TabMenu from './TabMenu/TabMenu';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import './Viewer.css';

const markerSize = GroasisUtility.markerSize;

// This block is purely to get the marker icon of Leaflet to work.
// Taken somewhere from the web.

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-2x.svg',
  iconUrl: '/images/marker.svg',
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  className: 'layerDivIcon',
  iconSize: [ViewerUtility.markerSize.x * 2, ViewerUtility.markerSize.y * 2],
  iconAnchor: [ViewerUtility.markerSize.x, ViewerUtility.markerSize.y * 2],
});

const MAP_PANE_NAME = 'map_pane';
const CONTROL_PANE_NAME = 'control_pane';
const DATA_PANE_NAME = 'data_pane';

const DEFAULT_VIEWPORT = {
  center: [40.509865, -0.118092],
  zoom: 2
}

class Viewer extends PureComponent {

  controlsPane = null;
  dataPane = null;
  selectionPane = null;

  leafletMap = null;

  leafletLayers = null;
  selectedElementLayer = null;
  drawnPolygonLayer = null;
  subatlasesLayer = null;

  setNewViewportTimer = null;
  selectTimestampTimer = null;

  drawnPolygonGeoJson = null;

  flyToInfo = null;

  constructor(props, context) {
    super(props, context);

    this.leafletMap = React.createRef();
    this.controlsPane = React.createRef();
    this.dataPane = React.createRef();
    this.selectionPane = React.createRef();
    this.mapControl = React.createRef();

    console.log(this.props.mode, ViewerUtility.identificationMode)

    this.state = {
      leafletMapViewport: DEFAULT_VIEWPORT,
      isSmallWindow: false,

      panes: [MAP_PANE_NAME, DATA_PANE_NAME],

      mapCollection: null,
      selectedLayers: {
        [ViewerUtility.tileLayerType]: [GroasisUtility.layers.tile.base, GroasisUtility.layers.tile.highRes],
        [ViewerUtility.polygonLayerType]: [GroasisUtility.layers.polygon.trees],
        [ViewerUtility.standardTileLayerType]: []
      },
      timestampRange: {
        start: 0,
        end: 0
      },

      selectedElement: null,

      geolocation: null,

      overrideLeafletLayers: null,
    };
  }

  async componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      this.setLocation,
      (err) => {
        console.warn(`Error ${err.code}: ${err.message}`);
        this.setLocation(null);
      },
      { enableHighAccuracy: true }
    );

    this.onLeafletMapViewportChanged(DEFAULT_VIEWPORT);

    window.addEventListener('resize', this.onWindowResize);
    this.onWindowResize(null, () => {
      let panes = this.state.panes;

      if(this.props.mode === ViewerUtility.identificationMode)
      {
        panes = [MAP_PANE_NAME, DATA_PANE_NAME];
      }

      if(this.props.mode === ViewerUtility.plannerMode)
      {
        panes = [CONTROL_PANE_NAME, MAP_PANE_NAME];
      }

      if (panes.length > 1 && this.state.isSmallWindow) {
        panes = [MAP_PANE_NAME];
      }

      this.setState({ panes: panes }, () => this.leafletMap.current.leafletElement.invalidateSize());
    });

/*    let onSubatlasClick = (feature) => {
      let element = {
        type: ViewerUtility.subatlasElementType,
        hasAggregatedData: false,
        feature: feature,
      };

      this.setState({ selectedElement: element });
    }*/

    GroasisUtility.getGroasisAreas(this.props.user, /*onSubatlasClick*/)
      .then(async groasisMaps => {
        let maps = await groasisMaps;

        //this.subatlasesLayer = groasisMaps.geoJsonElement;
        //groasisMaps.request = await GroasisUtility.getMetadata(groasisMaps['request'], this.props.user);
        //this.rebuildAllLayers();

        this.setState({ groasisMaps: maps });

        let latLngBounds = [
          [maps.bounds.yMin, maps.bounds.xMin],
          [maps.bounds.yMax, maps.bounds.xMax],
        ];

        console.log(JSON.stringify(latLngBounds));
        if(this.leafletMap.current && JSON.stringify(latLngBounds) !== '[[null,null],[null,null]]'){this.leafletMap.current.leafletElement.fitBounds(latLngBounds)};
      });

  }

   componentDidUpdate(prevProps) {
    if (this.props.mode !== prevProps.mode) {
      console.log(this.props.mode, prevProps.mode)
      let dataPaneAction = this.state.dataPaneAction;

      if (dataPaneAction === ViewerUtility.dataPaneAction.geoMessage || dataPaneAction === ViewerUtility.dataPaneAction.analyse) {
        this.setState({ dataPaneAction: null });
      }

      let type = this.state.selectedElement ? this.state.selectedElement.type : null;

      let isDrawnStuff =
        type === ViewerUtility.newTreeElementType ||
        type === ViewerUtility.drawnPolygonLayerType;

      if (this.state.selectedElement && isDrawnStuff) {
        this.deselectCurrentElement();
      }

      let panes = this.state.panes;

      if(this.props.mode === ViewerUtility.identificationMode)
      {
        panes = [MAP_PANE_NAME, DATA_PANE_NAME];
      }

      if(this.props.mode === ViewerUtility.plannerMode)
      {
        panes = [CONTROL_PANE_NAME, MAP_PANE_NAME];
      }

      if (panes.length > 1 && this.state.isSmallWindow) {
        panes = [MAP_PANE_NAME];
      }

      if (this.props.mode === ViewerUtility.identificationMode)
      {
        this.onSelectMap();
      }
      else
      {
        if (this.state.map && this.state.map.id && this.state.map.id === GroasisUtility.request.id)
        {
          this.setState({
            map: null,
            panes: panes,
            selectedLayers: {
              [ViewerUtility.tileLayerType]: [GroasisUtility.layers.tile.base, GroasisUtility.layers.tile.highRes],
              [ViewerUtility.polygonLayerType]: [GroasisUtility.layers.polygon.trees],
              [ViewerUtility.standardTileLayerType]: []
            },
            selectedElement: null,
          }, this.filterPlannerLayers);
        }
      }
    }
  }

  filterPlannerLayers = () => {
    let newLayers = [];
    for (let i = 0; i < this.leafletLayers.length; i++)
    {
      let layerType = this.leafletLayers[i];
      if (layerType)
      {
        for (let j = layerType.length - 1; j >= 0; j--)
        {
          if (layerType[j].props.name === GroasisUtility.request.layer)
          {
            delete layerType[j];
          }
        }
      }

      newLayers.push(layerType);
    }

    this.deselectCurrentElement();
    this.onLayersChange(newLayers, true);
  }

  setLocation = (position) => {
    if (position) {
      if (!this.state.geolocation || this.state.geolocation.latitude !== position.coords.latitude ||
        this.state.geolocation.longitude !== position.coords.longitude) {
          let newGeolocation = [position.coords.latitude, position.coords.longitude];
          this.setState({ geolocation: newGeolocation });
      }
    }

    setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
          this.setLocation,
          (err) => {
            console.warn(`Error ${err.code}: ${err.message}`);
            this.setLocation(null);
          },
          { enableHighAccuracy: true }
        );
      },
      1000 * 10
    );
  }

  onWindowResize = (_, cb) => {
    let isSmallWindow = window.innerWidth <= 700;

    if (this.state.isSmallWindow !== isSmallWindow) {
      this.setState({ isSmallWindow: isSmallWindow }, () => {
        this.openPane(MAP_PANE_NAME, isSmallWindow);
        if (cb) {
          cb();
        }
      });
    }
    else if (cb) {
      cb();
    }
  }

  openPane = (paneName, closePane) => {
    let currentPanes = this.state.panes;

    let changed = false;

    if (!this.state.isSmallWindow) {
      if (!currentPanes.includes(paneName)) {
        currentPanes.push(paneName);
        changed = true;
      }
      else if (paneName !== MAP_PANE_NAME && closePane) {
        currentPanes = Utility.arrayRemove(currentPanes, paneName);
        changed = true;
      }
      else if (paneName === MAP_PANE_NAME)
      {
        if (currentPanes === [MAP_PANE_NAME])
        {
          currentPanes = [CONTROL_PANE_NAME, MAP_PANE_NAME, DATA_PANE_NAME];
        }
        else
        {
          currentPanes = [MAP_PANE_NAME];
        }
        if (currentPanes !== this.state.panes) {changed = true}
      }
    }
    else {
      if (!currentPanes.includes(paneName)) {
        currentPanes = [paneName];
        changed = true;
      }
      else if (closePane) {
        currentPanes = [MAP_PANE_NAME];
        changed = true;
      }

    }

    if (changed) {
      currentPanes = [...currentPanes];
      this.setState({ panes: currentPanes }, () => {
        this.leafletMap.current.leafletElement.invalidateSize();
        this.attemptFlyTo();
      });
    }
  }

  onSelectMap = (id, cb) => {
    this.selectedElementLayer = null;
    this.drawnPolygonLayer = null;
    this.drawnPolygonGeoJson = null;

    let dataPaneAction = this.state.dataPaneAction;
    if (dataPaneAction !== ViewerUtility.dataPaneAction.feed) {
      dataPaneAction = null;
    }

    let map = null;
    if (this.state.groasisMaps && this.props.mode === ViewerUtility.identificationMode && !id)
    {
      let selectedLayers = {
        [ViewerUtility.tileLayerType]: [GroasisUtility.layers.tile.base],
        [ViewerUtility.polygonLayerType]: [GroasisUtility.request.layer],
        [ViewerUtility.standardTileLayerType]: []
      };

      this.setState({
        map: this.state.groasisMaps,
        dataPaneAction: dataPaneAction,
        selectedElement: null,
        timestampRange: {start: 0, end: 0},
        selectedLayers: selectedLayers,
        overrideLeafletLayers: null
      })
    }
    else
    {
      if (!id) {
        //id = this.state.selectedElement.feature.properties[GroasisUtility.subatlasProperty];
        console.log('something with selected Element')
      }
      else
      {
        map = this.state.groasisMaps.areas.find(x => x.id === id);

        let totalCb = () => GroasisUtility.getPlantingSites(map, this.props.user, this.onPlantingSiteClick)
        .then(() => {
          console.log(map);

          let selectedLayers = {
            [ViewerUtility.tileLayerType]: [GroasisUtility.layers.tile.base],
            [ViewerUtility.polygonLayerType]: [GroasisUtility.request.layer, GroasisUtility.layers.polygon.plantingSites],
            [ViewerUtility.standardTileLayerType]: []
          };

          let panes = this.state.panes;
          if (!this.state.panes.includes(CONTROL_PANE_NAME))
          {
            panes = [CONTROL_PANE_NAME, ...panes];
          }

          let timestampRange = this.calculateTimestamps(map, this.selectedLayers);
          this.setState({
            map: map,
            dataPaneAction: dataPaneAction,
            timestampRange: timestampRange,
            overrideLeafletLayers: null,
            selectedLayers: selectedLayers,
            panes: panes,
          }, () => {
            this.onFlyTo({ type: ViewerUtility.flyToType.map, delay: false });
            if (cb) {
              cb();
            }
          });
        });

        totalCb();

        /*if (this.props.mode === ViewerUtility.identificationMode)
        {
          this.props.onModeChange(ViewerUtility.plannerMode, totalCb)
        }
        else
        {
          totalCb();
        }*/
      }
    }
  }

  onSelectedLayersChange = (type, layerChanges, resetTimestamps) => {
    let selectedLayers = this.state.selectedLayers;

    let newSelectedLayers = {
      [ViewerUtility.tileLayerType]: [...selectedLayers[ViewerUtility.tileLayerType]],
      [ViewerUtility.polygonLayerType]: [...selectedLayers[ViewerUtility.polygonLayerType]],
      [ViewerUtility.standardTileLayerType]: [...selectedLayers[ViewerUtility.standardTileLayerType]]
    };

    for (let i = 0; i < layerChanges.length; i++) {
      let layerChange = layerChanges[i];

      if (layerChange.add) {
        newSelectedLayers[type].push(layerChange.name);
      }
      else {
        Utility.arrayRemove(newSelectedLayers[type], layerChange.name);
      }
    }

    let timestampRange = this.state.timestampRange;

    if (resetTimestamps) {
      timestampRange = this.calculateTimestamps(this.state.map, newSelectedLayers);
    }

    this.setState({
      selectedLayers: newSelectedLayers,
      timestampRange: timestampRange
    });
  }

  onLayersChange = (layers, isOverride) => {
    if (!isOverride) {
      this.leafletLayers = layers;
      this.rebuildAllLayers();
    }
    else {
      this.setState({ overrideLeafletLayers: layers }, this.rebuildAllLayers);
    }
  }

  onSelectTimestamp = (timestampRange) => {
    if (this.state.timestampRange.start !== timestampRange.start ||
      this.state.timestampRange.end !== timestampRange.end) {

      if (this.selectTimestampTimer) {
        clearTimeout(this.selectTimestampTimer);
      }

      this.selectTimestampTimer = setTimeout(() => this.setState({ timestampRange: timestampRange }), 100);
    }
  }

  onLeafletMapViewportChanged = (viewport) => {
    if (!this.state.panes.includes(MAP_PANE_NAME)) {
      return;
    }

    if (this.setNewViewportTimer) {
      clearTimeout(this.setNewViewportTimer);
    }

    viewport.bounds = getLeafletMapBounds(this.leafletMap);

    this.setNewViewportTimer = setTimeout(
      () => { this.setState({ leafletMapViewport: viewport }) },
      400
    );
  }

  onDrawGeometry = (geoJson, drawnGeometryElement) => {
    this.drawnPolygonGeoJson = geoJson;
    let dataPaneAction = this.state.dataPaneAction;
    if (dataPaneAction !== ViewerUtility.dataPaneAction.createCustomPolygon) {
      dataPaneAction = null;
    }

    let newState = {
      dataPaneAction: dataPaneAction
    };

    let cb = () => {
      this.drawnPolygonLayer = drawnGeometryElement;

      this.rebuildAllLayers();
      if (!this.state.map) {
        return;
      }

      let type = ViewerUtility.drawnPolygonLayerType;
      let overrideType = geoJson.properties[ViewerUtility.selection.specialProperty.type];
      if (overrideType) {
        type = overrideType;
      }

      this.selectFeature(type, geoJson, false);
      this.removeDrawnPolygon();
    }

    this.setState(newState, cb);
  }

  onWatchlistClick = (feature, entry) => {
    this.deselectCurrentElement();
    this.onSelectMap(feature.properties.mapId)

    //this.props.onModeChange(ViewerUtility.plannerMode, this.onSelectMap(id, cb));
  }

  onPlantingSiteClick = (feature) => {
    console.log(feature)
    let cb = () => {
      let flyToInfo = {
        type: ViewerUtility.flyToType.givenElement,
        element: feature,
      };

      this.onFlyTo(flyToInfo);
    };

    let newLayers = [];
    for (let key in GroasisUtility.layers.polygon)
    {
      newLayers.push(GroasisUtility.layers.polygon[key])
    }

    let selectedLayers = this.state.selectedLayers;
    selectedLayers[ViewerUtility.polygonLayerType] = newLayers;

    this.setState({selectedLayers: selectedLayers}, () => {this.props.onModeChange(ViewerUtility.plannerMode, cb);})
  }

  watchlistRefresh = (type, data) => {
    this.dataPane.current.watchlist.current.updateWatchlist(data);
  }

  selectFeature = (type, feature, hasAggregatedData, color, cb) => {
    if (this.state.map || this.props.mode === ViewerUtility.identificationMode)
    {
      let id = feature.properties.id;
      if (type === ViewerUtility.standardTileLayerType) {
        id = {
          tileX: feature.properties.tileX,
          tileY: feature.properties.tileY,
          zoom: feature.properties.zoom
        };
      }

      let element = {
        type: type,
        hasAggregatedData: hasAggregatedData,
        feature: feature,
        id: id
      };

      let geoJson = {
        type: 'FeatureCollection',
        count: 1,
        features: [
          element.feature
        ]
      };

      let markerPane = this.leafletMap.current.leafletElement.getPane('markerPane');

      console.log(feature.properties.mapId, feature)
      let map = this.state.groasisMaps.areas.find(x => x.id === feature.properties.mapId);

      let layerCollection = null;

      if (!color) {
        if (type === ViewerUtility.polygonLayerType) {
          layerCollection = map.layers.polygon ? map.layers.polygon[map.layers.polygon.length - 1].layers : map.layers;
        }

        if (layerCollection) {
          let layerName = feature.properties.layer;
          let layer = layerCollection.find(x => x.name === layerName);

          color = `#${layer.color}`;
        }
      }

      color = !color ? '#3388ff' : color;


      let icon = ViewerUtility.returnMarker(color, ViewerUtility.markerSize, 'RoomTwoTone');

      let selectedElementLayer = (
        <GeoJSON
          key={Math.random()}
          data={geoJson}
          style={ViewerUtility.createGeoJsonLayerStyle(color, 2, 0.3)}
          pane={markerPane}
          onEachFeature={(_, layer) => layer.on({ click: () => this.selectionPane.current.open() })}
          pointToLayer={(geoJsonPoint, latlng) => ViewerUtility.createMarker(latlng, icon)}
        />
      );

      this.selectedElementLayer = selectedElementLayer;

      this.setState({ selectedElement: element }, () => {
        this.rebuildAllLayers();
        if (cb) {
          console.log(cb)
          cb();
        }
      });
    }
  }

  deselectCurrentElement = () => {
    this.selectedElementLayer = null;
    let dataPaneAction = this.state.dataPaneAction;
    if (this.state.dataPaneAction !== ViewerUtility.dataPaneAction.feed) {
      dataPaneAction = null;
    }

    let selectedElement = this.state.selectedElement;
    if (selectedElement && (selectedElement.type === ViewerUtility.drawnPolygonLayerType ||
        selectedElement.type === ViewerUtility.newTreeElementType)) {
      this.removeDrawnPolygon(false)
    }

    this.setState({ selectedElement: null, dataPaneAction: dataPaneAction }, this.rebuildAllLayers);
  }

  removeDrawnPolygon = (deselect) => {
    this.drawnPolygonLayer = null;
    this.drawnPolygonGeoJson = null;

    let selectedElement = this.state.selectedElement;

    if (deselect && selectedElement && selectedElement.type === ViewerUtility.drawnPolygonLayerType) {
      this.deselectCurrentElement();
    }
    else {
      this.rebuildAllLayers();
    }
  }

  rebuildAllLayers = () => {
    let allLayers = [
      this.leafletLayers,
      this.state.overrideLeafletLayers,
      this.subatlasesLayer,
      this.selectedElementLayer,
      this.drawnPolygonLayer,
    ];

    this.setState({ allLayers: allLayers });
  }

  updatePolygons = () => {
    this.controlsPane.current.updatePolygons();
  }

  onDataPaneAction = (action, jumpToMessage) => {
    // console.log(`On data pane action: ${action} ${jumpToMessage.id}`);

    let cb = () => {
      this.openPane(DATA_PANE_NAME);

      if (this.state.dataPaneAction === action) {
        this.dataPane.current.goToAction();
      }
      else {
        this.setState({ dataPaneAction: action, jumpToMessage: jumpToMessage });
      }
    }

    this.setState({ jumpToMessage: jumpToMessage }, cb);
  }

  onFlyTo = (flyToInfo, cb) => {
    this.flyToInfo = flyToInfo;
    let type = flyToInfo.type;

    if (type === ViewerUtility.flyToType.map) {
      let map = this.state.map.referenceMap ? this.state.map.referenceMap : this.state.map;
      flyToInfo.target = L.latLngBounds(L.latLng(map.yMin, map.xMin), L.latLng(map.yMax, map.xMax));
    }
    else if (type === ViewerUtility.flyToType.currentLocation) {
      flyToInfo.target = this.state.geolocation;
    }
    else if (type === ViewerUtility.flyToType.currentElement && this.state.selectedElement) {
      let element = this.state.selectedElement;

      let geoJsonLayer = L.geoJSON({
        type: 'FeatureCollection',
        count: 1,
        features: [
          element.feature
        ]
      });

      flyToInfo.target = geoJsonLayer.getBounds();
      flyToInfo.layerType = element.type;

      if (element.type === ViewerUtility.flyToType.standardTile) {
        flyToInfo.layer = ViewerUtility.standardTileLayerType;
      }
      else {
        flyToInfo.layer = element.feature.properties.layer;
      }
    }
    else if (type === ViewerUtility.flyToType.givenElement)
    {
      let geoJsonLayer = L.geoJSON(flyToInfo.element);

      flyToInfo.target = geoJsonLayer.getBounds();
    }
    else {
      this.getElementGeoJson()
        .then(geoJson => {
          if (!geoJson || !geoJson.features || geoJson.features.length === 0) {
            this.flyToInfo = null;
            return;
          }

          let geoJsonLayer = L.geoJSON(geoJson);
          let bounds = geoJsonLayer.getBounds();

          flyToInfo.target = bounds;
          flyToInfo.layerType = flyToInfo.type;

          let feature = geoJson.features[0];
          let hasAggregatedData = true;

          if (type === ViewerUtility.flyToType.standardTile) {
            flyToInfo.layer = ViewerUtility.standardTileLayerType;
          }
          else {
            flyToInfo.layer = feature.properties.layer;

            if (flyToInfo.type === ViewerUtility.polygonLayerType) {
              let mapPolygonlayers = this.state.map.referenceMap.layers.polygon;

              for (let i = 0; i < mapPolygonlayers.length; i++) {
                let hasAggregatedData = mapPolygonlayers[i].hasAggregatedData;
                if (hasAggregatedData) {
                  break;
                }
              }
            }
          }

          if (!flyToInfo.delay && this.state.isSmallWindow && !this.state.panes.includes(MAP_PANE_NAME)) {
            this.openPane(MAP_PANE_NAME);

          }
          else {

            this.attemptFlyTo();
          }

          let type = flyToInfo.overrideType ? flyToInfo.overrideType : flyToInfo.type;

          if (type === ViewerUtility.treeElementType) {
            let treeBounds = ViewerUtility.getBounds(feature.geometry.coordinates);

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

          this.selectFeature(type, feature, hasAggregatedData, null, cb);
        });
    }

    if (!this.flyToInfo.delay && this.state.isSmallWindow && !this.state.panes.includes(MAP_PANE_NAME)) {
      this.openPane(MAP_PANE_NAME);
    }
    else {
      this.attemptFlyTo();
    }
  }

  getElementGeoJson = () => {
    let map = this.state.map.referenceMap;
    let flyToInfo = this.flyToInfo;
    let type = flyToInfo.elementType ? flyToInfo.elementType : flyToInfo.type;

    let body = {
      mapId: map.id,
      type: type,
      timestamp: map.timestamps[this.state.timestampRange.end].timestamp
    };

    if (type === ViewerUtility.flyToType.standardTile) {
      body.elementIds = [{...this.flyToInfo.elementId, zoom: map.aggregationZoom }];
    }
    else if (type === ViewerUtility.flyToType.polygon) {
      body.elementIds = [this.flyToInfo.elementId];
    }

    return ApiManager.post('/geometry/get', body, this.props.user);
  }

  onPolygonChange = (removeDrawnPolygon, updateSelection, newProperties) => {
    if (removeDrawnPolygon) {
      this.removeDrawnPolygon(true);
    }

    if (updateSelection) {
      let properties = newProperties;

      this.state.selectedElement.feature.properties = properties;

      this.selectionPane.current.refresh();
    }

    this.updatePolygons();
  }

  attemptFlyTo = () => {
    if (!this.flyToInfo || !this.flyToInfo.target) {
      return;
    }

    if (this.state.panes.includes(MAP_PANE_NAME)) {

      if (this.flyToInfo.type === ViewerUtility.flyToType.currentLocation) {
        this.leafletMap.current.leafletElement.flyTo(this.flyToInfo.target);
      }
      else {
        this.leafletMap.current.leafletElement.flyToBounds(
          this.flyToInfo.target,
          { maxZoom: this.state.map.referenceMap ? this.state.map.referenceMap.zoom + 3 : this.state.map + 3}
        );
      }

      // if (this.flyToInfo.layer) {
      //   this.controlsPane.current.selectLayer(this.flyToInfo.layerType, this.flyToInfo.layer);
      // }

      this.flyToInfo = null;
    }
  }

  calculateTimestamps = (map, selectedLayers) => {
    let lastTimestamp = 0;

    if (this.props.mode !== ViewerUtility.plannerMode)
    {
      lastTimestamp = map.timestamps.length - 1;
    }

    return {
      start: lastTimestamp,
      end: lastTimestamp
    };
  }

  render() {
    let mapPaneStyle = {
      display: 'block',
      width: '100vw'
    };

    if (this.state.panes.includes(MAP_PANE_NAME)) {
      if (!this.state.isSmallWindow) {
        if (this.state.panes.length === 2) {
          mapPaneStyle.width = '75vw';
        }
        else if (this.state.panes.length === 3) {
          mapPaneStyle.width = '50vw';
        }
      }
    }
    else {
      mapPaneStyle.display = 'none';
    }

    let maxZoom = 22;
    if (this.state.map && this.state.map.referenceMap && this.leafletMap.current) {
      maxZoom = Math.max(22, this.state.map.referenceMap.zoom + 3);
      this.leafletMap.current.leafletElement.setMaxZoom(maxZoom);
    }

    return (
      <div className='viewer'>
        <div className='viewer-main-container'>
          <ControlsPane
            ref={this.controlsPane}
            user={this.props.user}
            isOpen={this.state.panes.includes(CONTROL_PANE_NAME)}
            leafletMapViewport={this.state.leafletMapViewport}
            map={this.state.map}
            timestampRange={this.state.timestampRange}
            selectedLayers={this.state.selectedLayers}
            geolocation={this.state.geolocation}
            override={this.state.overrideLeafletLayers ? true : false}
            onSelectMap={this.onSelectMap}
            onDataPaneAction={this.onDataPaneAction}
            onSelectedLayersChange={this.onSelectedLayersChange}
            onLayersChange={this.onLayersChange}
            onFeatureClick={this.selectFeature}
            onFlyTo={this.onFlyTo}
            onDeselect={this.deselectCurrentElement}
            markerSize={ViewerUtility.markerSize}
            groasisMaps={this.state.groasisMaps}
            mode={this.props.mode}
            onWatchlistClick={this.onWatchlistClick}
          />

          <div className='viewer-pane map-pane' style={mapPaneStyle}>
            <TimestampSelector
              map={this.state.map}
              selectedLayers={this.state.selectedLayers}
              onSelectTimestamp={this.onSelectTimestamp}
              mode={this.props.mode}
            />
            <SelectionPane
              ref={this.selectionPane}
              user={this.props.user}
              mode={this.props.mode}
              map={this.state.map}
              groasisMaps={this.state.groasisMaps}
              geolocation={this.state.geolocation}
              element={this.state.selectedElement}
              timestampRange={this.state.timestampRange}
              onDataPaneAction={this.onDataPaneAction}
              onFlyTo={this.onFlyTo}
              onDeselect={this.deselectCurrentElement}
              onDeletePolygon={this.updatePolygons}
              onSelectMap={this.onSelectMap}
              watchlistRefresh={this.watchlistRefresh}
            />
            <Map
              center={DEFAULT_VIEWPORT.center}
              zoom={DEFAULT_VIEWPORT.zoom}
              ref={this.leafletMap}
              maxZoom={maxZoom}
              zoomControl={false}
              attributionControl={false}
              onViewportChanged={this.onLeafletMapViewportChanged}
            >
              {this.state.allLayers}
              {this.state.geolocation ? <Marker position={this.state.geolocation} icon={ViewerUtility.returnMarker('#3388ff', ViewerUtility.markerSize, 'PersonPinCircle')}/> : null}
            </Map>
            <MapHeader
              map={this.state.map}
              flyTo={this.onFlyTo}
              mode={this.props.mode}
              user={this.props.user}
              openAccounts={this.props.openAccounts}
            />
            <MapControl
              leafletMap={this.leafletMap}
              mode={this.props.mode}
              groasisMaps={this.state.groasisMaps}
              geolocation={this.state.geolocation}
              onSelectFeature={this.selectFeature}
              onDrawGeometry={this.onDrawGeometry}
              onFlyTo={this.onFlyTo}
              map={this.state.map}
              user={this.props.user}
              ref={this.mapControl}
            />
          </div>

          <DataPane
            ref={this.dataPane}
            user={this.props.user}
            isOpen={this.state.panes.includes(DATA_PANE_NAME)}
            groasisMaps={this.state.groasisMaps}
            map={this.state.map}
            timestampRange={this.state.timestampRange}
            geolocation={this.state.geolocation}
            action={this.state.dataPaneAction}
            element={this.state.selectedElement}
            jumpToMessage={this.state.jumpToMessage}
            onDataPaneAction={this.onDataPaneAction}
            onFlyTo={this.onFlyTo}
            onDeselect={this.deselectCurrentElement}
            onPolygonChange={this.onPolygonChange}
            onLayersChange={this.onLayersChange}
            onFeatureClick={this.selectFeature}
            onWatchlistClick={this.onWatchlistClick}
          />
        </div>

        <TabMenu openPane={this.openPane} MAP_PANE_NAME={MAP_PANE_NAME} CONTROL_PANE_NAME={CONTROL_PANE_NAME} DATA_PANE_NAME={DATA_PANE_NAME} panes={this.state.panes} key={this.state.panes}/>
      </div>
    );
  }
}

function getLeafletMapBounds(leafletMap) {
  let screenBounds = leafletMap.current.leafletElement.getBounds();
  let bounds =
  {
    xMin: screenBounds.getWest(),
    xMax: screenBounds.getEast(),
    yMin: screenBounds.getSouth(),
    yMax: screenBounds.getNorth()
  }

  return bounds;
}

export default Viewer;
