import React, { PureComponent } from 'react';
import { TileLayer } from 'react-leaflet';
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

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';
import GroasisUtility from '../../GroasisUtility';

import './TileLayersControl.css';

import ApiManager from '../../../../ApiManager';

const BASE_SATELLITE_LAYER_NAME = 'base';
const IMAGES_LAYER_TYPE = 'images';
const LABELS_LAYER_TYPE = 'labels';
const IMAGES2_LAYER_TYPE = 'images2';

const BASE_SATELLITE_LAYER_TYPE = {
  name: BASE_SATELLITE_LAYER_NAME,
  defaultSelected: true,
  stacking: false,
  zIndex: ViewerUtility.tileLayerZIndex
}

const BASE_SATELLITE_AVAILABLE_LAYER = {
  type: BASE_SATELLITE_LAYER_NAME,
  name: BASE_SATELLITE_LAYER_NAME
}

const AVAILABLE_LAYERS = [
  {
    name: GroasisUtility.layers.tile.base,
    type: null,
    mapType: null,
    stacking: false,
    urlName: null,
  },
  {
    name: GroasisUtility.layers.tile.highRes,
    type: IMAGES_LAYER_TYPE,
    mapType: GroasisUtility.types.highRes,
    stacking: true,
    urlName: 'rgb'
  },
  {
    name: GroasisUtility.layers.tile.lowRes,
    type: IMAGES_LAYER_TYPE,
    mapType: GroasisUtility.types.lowres,
    stacking: true,
    urlName: 'rgb'
  }
];

class TileLayersControl extends PureComponent {

  classes = null;

  baseLayer = (
    <TileLayer
      key='base-layer'
      url='https://www.google.com/maps/vt?lyrs=y@189&x={x}&y={y}&z={z}'
      attribution='Base satellite: <a href="https://maps.google.com">Google Maps</a>'
      zIndex={1}
      noWrap={true}
      maxZoom={40}
      maxNativeZoom={21}
    />
  );

  constructor(props, context) {
    super(props, context);

    this.state = {
      options: [],

      expanded: true
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

    let prevSelectedLayers = prevProps.selectedLayers[ViewerUtility.tileLayerType];
    let curSelectedLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];

    let differentSelectedLayers = prevSelectedLayers.length !== curSelectedLayers.length;
    if (!differentSelectedLayers) {
      for (let i = 0; i < prevSelectedLayers.length; i++) {
        if (prevSelectedLayers[i] !== curSelectedLayers[i]) {
          differentSelectedLayers = true;
          break;
        }        
      }
    }

    if (differentMap || differentTimestamp || differentSelectedLayers) {
      this.prepareLayers();
    }
  }

  createLayerCheckboxes = () => {
    let options = [];

    let availableLayers = AVAILABLE_LAYERS;
    let selectedLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];

    for (let i = 0; i < availableLayers.length; i++) {

      let availableLayer = availableLayers[i];
      let checked = selectedLayers.find(x => x === availableLayer.name) ? true : false;

      let option = (
        <div key={availableLayer.name}>
          <Checkbox
            key={availableLayer.name}
            classes={{ root: 'layers-control-checkbox' }}
            color='primary'
            value={availableLayer.name}
            name={availableLayer.name}
            onChange={this.onLayerChange}
            checked={checked}
          />
          {availableLayer.name}
        </div>
      )

      options.push(option);
    }

    return options;
  }

  prepareLayers = () => {
    let map = this.props.map;
    let timestampRange = this.props.timestampRange;
    let selectedLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];

    let layerElements = [];
    if (selectedLayers.includes(BASE_SATELLITE_LAYER_NAME)) {
      layerElements.push(this.baseLayer);
    }

    let zIndex = ViewerUtility.tileLayerZIndex + 2;

    for (let i = 1; i < AVAILABLE_LAYERS.length; i++) {
      let availableLayer = AVAILABLE_LAYERS[i];

      if (!selectedLayers.includes(availableLayer.name)) {
        continue;
      }

      let subMap = map[availableLayer.mapType];

      let timestampStart = availableLayer.stacking ? timestampRange.start : timestampRange.end;
      let timestampEnd = timestampRange.end;

      for (let y = timestampStart; y <= timestampEnd; y++) {
        let mapTimestamp = subMap.timestamps[y];

        let key = `${subMap.id}_${mapTimestamp.timestampNumber}_${availableLayer.name}`;
        let url = `${ApiManager.apiUrl}/tileService/${subMap.id}/${mapTimestamp.timestampNumber}/${availableLayer.urlName}/{z}/{x}/{y}`;
       
        if (this.props.user) {
          url += `?token=${this.props.user.token}`;
        }

        let layerElement = (<TileLayer
          key={key}
          url={url}
          tileSize={256}
          noWrap={true}
          maxNativeZoom={map.zoom}
          format={'image/png'}
          zIndex={zIndex++}
        />);

        layerElements.push(layerElement);
      }      
    }

    debugger;

    this.props.onLayersChange(layerElements);    
  }

  onLayerChange = (e) => {
    let layerName = e.target.value;
    let checked = e.target.checked;

    let layerChanges = [{
      name: layerName,
      add: checked
    }];

    let selectedLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];

    if (layerName === GroasisUtility.layers.tile.highRes && 
      selectedLayers.includes(GroasisUtility.layers.tile.lowRes)) {
      layerChanges.push({
        name: GroasisUtility.layers.tile.lowRes,
        add: false
      });
    }
    else if (layerName === GroasisUtility.layers.tile.lowRes &&
      selectedLayers.includes(GroasisUtility.layers.tile.highRes)) {
        layerChanges.push({
          name: GroasisUtility.layers.tile.highRes,
          add: false
        });
    }

    this.props.onSelectedLayersChange(ViewerUtility.tileLayerType, layerChanges);
  }

  onExpandClick = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  render() {
    if (!this.props.map) {
      return null;
    }

    return (
      <Card className='layers-contol'>
        <CardHeader
          className='material-card-header'
          title={
            <Typography gutterBottom variant="h6" component="h2">
              Layers
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

export default TileLayersControl;
