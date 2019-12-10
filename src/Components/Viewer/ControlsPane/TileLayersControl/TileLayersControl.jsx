import React, { PureComponent } from 'react';
import { TileLayer } from 'react-leaflet';

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

import ViewerUtility from '../../ViewerUtility';
import GroasisUtility from '../../GroasisUtility';

import './TileLayersControl.css';

import ApiManager from '../../../../ApiManager';

const IMAGES_LAYER_TYPE = 'images';
const LABELS_LAYER_TYPE = 'labels';
const IMAGES2_LAYER_TYPE = 'images2';

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
    name: GroasisUtility.layers.tile.highResCir,
    type: IMAGES_LAYER_TYPE,
    mapType: GroasisUtility.types.highRes,
    stacking: true,
    urlName: 'CIR'
  },
  {
    name: GroasisUtility.layers.tile.highResLabel,
    type: LABELS_LAYER_TYPE,
    mapType: GroasisUtility.types.highRes,
    stacking: true,
    urlName: 'label'
  },
  {
    name: GroasisUtility.layers.tile.lowRes,
    type: IMAGES_LAYER_TYPE,
    mapType: GroasisUtility.types.lowRes,
    stacking: true,
    urlName: 'rgb'
  },
  {
    name: GroasisUtility.layers.tile.lowResCir,
    type: IMAGES_LAYER_TYPE,
    mapType: GroasisUtility.types.lowRes,
    stacking: true,
    urlName: 'CIR'
  },

  {
    name: GroasisUtility.layers.tile.contour,
    type: IMAGES2_LAYER_TYPE,
    mapType: GroasisUtility.types.altitude,
    stacking: false,
    urlName: 'contour'
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
    this.prepareLayers();
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

  renderCheckboxes = () => {
    let options = [];

    let availableLayers = AVAILABLE_LAYERS;
    let selectedLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];

    for (let i = 0; i < availableLayers.length; i++) {

      let availableLayer = availableLayers[i];
      let checked = selectedLayers.find(x => x === availableLayer.name) ? true : false;

      let label = null;
      if (i === 1) {
        label = (<h3>High res</h3>);
      }
      else if (i === 4) {
        label = (<h3>Low res</h3>);
      }
      else if (i === 6) {
        label = (<h3>Altitude</h3>);
      }

      let name = 'base';
      if (i === 1 || i === 4) {
        name = 'rgb';
      }
      else if (i === 3) {
        name = 'label';
      }
      else if (i === 2 || i === 5) {
        name = 'CIR';
      }
      else if (i === 6) {
        name = 'contour';
      }

      let option = (
        <div key={availableLayer.name}>
          {label}
          <Checkbox
            key={availableLayer.name}
            classes={{ root: 'layers-control-checkbox' }}
            color='primary'
            value={availableLayer.name}
            name={availableLayer.name}
            onChange={this.onLayerChange}
            checked={checked}
          />
          {name}
        </div>
      )

      options.push(option);
    }

    return options;
  }

  prepareLayers = () => {
    let selectedLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];

    let layerElements = [];
    if (selectedLayers.includes(GroasisUtility.layers.tile.base)) {
      layerElements.push(this.baseLayer);
    }

    let map = this.props.map;
    let timestampRange = this.props.timestampRange;

    if (!map || !timestampRange) {
      this.props.onLayersChange(layerElements);
      return;      
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
        let timestampNumber = 0;

        if (availableLayer.name !== GroasisUtility.layers.tile.contour) {
          timestampNumber = subMap.timestamps[y].timestampNumber;
        }

        let key = `${subMap.id}_${timestampNumber}_${availableLayer.name}`;
        let url = `${ApiManager.apiUrl}/tileService/${subMap.id}/${timestampNumber}/${availableLayer.urlName}/{z}/{x}/{y}`;
       
        if (this.props.user) {
          url += `?token=${this.props.user.token}`;
        }

        let layerElement = (
          <TileLayer
            key={key}
            url={url}
            tileSize={256}
            noWrap={true}
            maxNativeZoom={subMap.zoom}
            format={'image/png'}
            zIndex={zIndex++}
          />
        );

        layerElements.push(layerElement);
      }      
    }

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

    let resetTimestamps = false;
    if (!selectedLayers.includes(GroasisUtility.layers.tile.lowRes) &&
      !selectedLayers.includes(GroasisUtility.layers.tile.lowResCir) &&
      !selectedLayers.includes(GroasisUtility.layers.tile.highRes) &&
      !selectedLayers.includes(GroasisUtility.layers.tile.highResCir) &&
      !selectedLayers.includes(GroasisUtility.layers.tile.highResLabel)) {
      resetTimestamps = true;
    }

    if (layerName === GroasisUtility.layers.tile.highRes || layerName === GroasisUtility.layers.tile.highResCir
      || layerName === GroasisUtility.layers.tile.highResLabel) {
      if (selectedLayers.includes(GroasisUtility.layers.tile.lowRes)) {
        layerChanges.push({
          name: GroasisUtility.layers.tile.lowRes,
          add: false
        });
        resetTimestamps = true;
      }

      if (selectedLayers.includes(GroasisUtility.layers.tile.lowResCir)){
        layerChanges.push({
          name: GroasisUtility.layers.tile.lowResCir,
          add: false
        });
        resetTimestamps = true;
      }
    }
    else if (layerName === GroasisUtility.layers.tile.lowRes || layerName === GroasisUtility.layers.tile.lowResCir) {
      if (selectedLayers.includes(GroasisUtility.layers.tile.highRes)) {
        layerChanges.push({
          name: GroasisUtility.layers.tile.highRes,
          add: false
        });
        resetTimestamps = true;
      }

      if (selectedLayers.includes(GroasisUtility.layers.tile.highResCir)) {
        layerChanges.push({
          name: GroasisUtility.layers.tile.highResCir,
          add: false
        });
        resetTimestamps = true;
      }

      if (selectedLayers.includes(GroasisUtility.layers.tile.highResLabel)) {
        layerChanges.push({
          name: GroasisUtility.layers.tile.highResLabel,
          add: false
        });
        resetTimestamps = true;
      }
    }

    this.props.onSelectedLayersChange(ViewerUtility.tileLayerType, layerChanges, resetTimestamps);
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
            {this.renderCheckboxes()}
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

export default TileLayersControl;
