import React, { PureComponent } from 'react';
import { TileLayer, WMSTileLayer/* , withLeaflet*/} from 'react-leaflet';

import Card from '@material-ui/core/Card';
import Checkbox from '@material-ui/core/Checkbox';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Radio from '@material-ui/core/Radio';
import Typography from '@material-ui/core/Typography';

import InfoIcon from '@material-ui/icons/Info';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import ViewerUtility from '../../ViewerUtility';
import GroasisUtility from '../../GroasisUtility';

import './TileLayersControl.css';

import ApiManager from '../../../../ApiManager';
import Viewer from '../../Viewer';

const IMAGES_LAYER_TYPE = 'images';
const LABELS_LAYER_TYPE = 'labels';
/*const IMAGES2_LAYER_TYPE = 'images2';*/

const AVAILABLE_LAYERS = [
  {
    name: GroasisUtility.layers.tile.base,
    type: 'radio',
    mapType: null,
    stacking: false,
    urlName: null,
    displayName: 'Satellite Layer'
  },
  {
    name: GroasisUtility.layers.tile.road,
    type: 'radio',
    mapType: null,
    stacking: false,
    urlName: null,
    displayName: 'Road Layer'
  },
  {
    name: GroasisUtility.layers.tile.terrain,
    type: 'radio',
    mapType: null,
    stacking: false,
    urlName: null,
    displayName: 'Terrain Layer'
  },
  {
    name: GroasisUtility.layers.tile.highRes,
    type: IMAGES_LAYER_TYPE,
    mapType: GroasisUtility.types.highRes,
    stacking: true,
    urlName: 'rgb',
    displayName: 'Natural color'
  },
  {
    name: GroasisUtility.layers.tile.highResCir,
    type: IMAGES_LAYER_TYPE,
    mapType: GroasisUtility.types.highRes,
    stacking: true,
    urlName: 'CIR',
    displayName: 'Infrared'
  },
  {
    name: GroasisUtility.layers.tile.highResLabel,
    type: LABELS_LAYER_TYPE,
    mapType: GroasisUtility.types.highRes,
    stacking: true,
    urlName: 'label',
    displayName: 'Tree crown'
  },
  {
    name: GroasisUtility.layers.tile.lowRes,
    type: IMAGES_LAYER_TYPE,
    mapType: GroasisUtility.types.lowRes,
    stacking: true,
    urlName: 'rgb',
    displayName: 'Natural Color'
  },
  {
    name: GroasisUtility.layers.tile.lowResCir,
    type: IMAGES_LAYER_TYPE,
    mapType: GroasisUtility.types.lowRes,
    stacking: true,
    urlName: 'CIR',
    displayName: 'Infrared'
  },
  {
    name: GroasisUtility.layers.tile.soilClasses,
    type: 'WMS',
    mapType: null,
    stacking: false,
    urlName: 'https://maps.isric.org/mapserv?map=/map/wrb.map',
    layerName: 'MostProbable',
    displayName: GroasisUtility.layers.tile.soilClasses + ' Map'
  },
  {
    name: GroasisUtility.layers.tile.organic,
    type: 'WMS',
    mapType: null,
    stacking: false,
    urlName: 'https://maps.isric.org/mapserv?map=/map/soc.map',
    layerName: 'soc_0-5cm_mean',
    displayName: GroasisUtility.layers.tile.organic + ' Map'
  },
  {
    name: GroasisUtility.layers.tile.clay,
    type: 'WMS',
    mapType: null,
    stacking: false,
    urlName: 'https://maps.isric.org/mapserv?map=/map/clay.map',
    layerName: 'clay_0-5cm_mean',
    displayName: GroasisUtility.layers.tile.clay + ' Map'
  },
  {
    name: GroasisUtility.layers.tile.sand,
    type: 'WMS',
    mapType: null,
    stacking: false,
    urlName: 'https://maps.isric.org/mapserv?map=/map/sand.map',
    layerName: 'sand_0-5cm_mean',
    displayName: GroasisUtility.layers.tile.sand + ' Map'
  },
  {
    name: GroasisUtility.layers.tile.coarse,
    type: 'WMS',
    mapType: null,
    stacking: false,
    urlName: 'https://maps.isric.org/mapserv?map=/map/cfvo.map',
    layerName: 'cfvo_0-5cm_mean',
    displayName: GroasisUtility.layers.tile.coarse + ' Map'
  },
  {
    name: GroasisUtility.layers.tile.ph,
    type: 'WMS',
    mapType: null,
    stacking: false,
    urlName: 'https://maps.isric.org/mapserv?map=/map/phh2o.map',
    layerName: 'phh2o_0-5cm_mean',
    displayName: GroasisUtility.layers.tile.ph + ' Map'
  },
];

class TileLayersControl extends PureComponent {

  classes = null;

  baseLayer = (<TileLayer
    key='base-layer'
    url='https://www.google.com/maps/vt?lyrs=s@189&x={x}&y={y}&z={z}'
    //attribution='Base satellite: <a href="https://maps.google.com">Google Maps</a>'
    zIndex={1}
    noWrap={true}
    maxZoom={26}
    maxNativeZoom={21}
  />)

  roadLayer = (<TileLayer
    key='road-layer'
    url='https://www.google.com/maps/vt?lyrs=r@189&x={x}&y={y}&z={z}'
    //attribution='Base satellite: <a href="https://maps.google.com">Google Maps</a>'
    zIndex={2}
    noWrap={true}
    maxZoom={26}
    maxNativeZoom={21}
  />)

  terrainLayer = (<TileLayer
    key='terrain-layer'
    url='https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=8971b4cfb888481fbc413a3c93ac582f'
    //attribution='Base satellite: <a href="https://maps.google.com">Google Maps</a>'
    zIndex={3}
    noWrap={true}
    maxZoom={26}
    maxNativeZoom={22}
  />)

  constructor(props, context) {
    super(props, context);

    this.state = {
      options: [],

      expanded: true
    };

    this.lowRes = false;
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
      if (this.props.map.maps && this.props.map.maps.find(x => ["4c450c42-1bf6-11e9-96ea-f0038c0f0121", "48d31d14-8cdd-401e-84a0-42941ad19dd6"].includes(x.dataSource.id)))
      {
        this.lowRes = true;
      }
      else
      {
        this.lowRes = false;
      }

      this.prepareLayers();
    }

  }

  renderCheckboxes = () => {
    let options = [];

    debugger

    let availableLayers = AVAILABLE_LAYERS;
    if (this.props.mode === ViewerUtility.identificationMode)
    {
      availableLayers = [AVAILABLE_LAYERS[0],
        AVAILABLE_LAYERS[1],
        AVAILABLE_LAYERS[2],
        AVAILABLE_LAYERS[AVAILABLE_LAYERS.length - 6],
        AVAILABLE_LAYERS[AVAILABLE_LAYERS.length - 5],
        AVAILABLE_LAYERS[AVAILABLE_LAYERS.length - 4],
        AVAILABLE_LAYERS[AVAILABLE_LAYERS.length - 3],
        AVAILABLE_LAYERS[AVAILABLE_LAYERS.length - 2],
        AVAILABLE_LAYERS[AVAILABLE_LAYERS.length - 1]
      ]

      if (this.lowRes)
      {
        availableLayers.push(AVAILABLE_LAYERS.find(x => x.name === GroasisUtility.layers.tile.lowRes));
        availableLayers.push(AVAILABLE_LAYERS.find(x => x.name === GroasisUtility.layers.tile.lowResCir));
      }
    }
    else if (this.props.mode === ViewerUtility.plantMode) {
      availableLayers = availableLayers.filter((x) => x.type === 'radio');
    }

    let selectedLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];

    for (let i = 0; i < availableLayers.length; i++) {

      let availableLayer = availableLayers[i];
      let checked = selectedLayers.find(x => x === availableLayer.name) ? true : false;

      if (this.props.mode === ViewerUtility.identificationMode || this.props.mode === ViewerUtility.plannerMode)
      {
        if (i === 0) {
          options.push(<ListSubheader disableSticky inset key={'tileSubHeader_' + i} color='primary'>Base layers</ListSubheader>);
        }
        else if (i === 3) {
          options.push(<ListSubheader disableSticky inset key={'tileSubHeader_' + i} color='primary'>Soil layers</ListSubheader>);
        }
        else if(this.lowRes && i === availableLayers.length - 2)
        {
          options.push(<ListSubheader disableSticky inset key={'tileSubHeader_' + i} color='primary'>Low Resolution layers</ListSubheader>);
        }
      }
      else
      {
        if (i === 0) {
          options.push(<ListSubheader disableSticky inset key={'tileSubHeader_' + i} color='primary'>Base layers</ListSubheader>);
        }
        else if (i === 3) {
          options.push(<ListSubheader disableSticky inset key={'tileSubHeader_' + i} color='primary'>High Resolution layers</ListSubheader>);
        }
        else if (i === 5)
        {
          options.push(<ListSubheader disableSticky inset key={'tileSubHeader_' + i} color='primary'>Classification</ListSubheader>);
        }
        else if (i === 6) {
          options.push(<ListSubheader disableSticky inset key={'tileSubHeader_' + i} color='primary'>Low resolution layers</ListSubheader>);
        }
        else if (i === 8) {
          options.push(<ListSubheader disableSticky inset key={'tileSubHeader_' + i} color='primary'>Soil layers</ListSubheader>);
        }
      }

      /*let name = 'base';
      if (i === 1 || i === 4) {
        name = 'rgb';
      }
      else if (i === 3) {
        name = 'label';
      }
      else if (i === 2 || i === 5) {
        name = 'CIR';
      }*/

      let option = null;

      if (availableLayer.type === 'radio')
      {
        option = (<ListItem
          button
          dense
          onClick={() => this.onRadioChange(availableLayer.name)}
          key={'tileLayerControlListItem_'+availableLayer.name}
        >
          <ListItemIcon>
            <Radio
              color='primary'
              checked={checked}
              edge="start"
              disableRipple
            />
          </ListItemIcon>
          <ListItemText primary={ViewerUtility.capitalize(availableLayer.name)}/>
        </ListItem>)
      }
      else
      {
        option = (<ListItem
          button
          dense
          onClick={() => this.onLayerChange(availableLayer.name, !checked)}
          key={'tileLayerControlListItem_'+availableLayer.name}
        >
          <ListItemIcon>
            <Checkbox
              color='primary'
              checked={checked}
              edge="start"
              disableRipple
            />
          </ListItemIcon>
          <ListItemText primary={ViewerUtility.capitalize(availableLayer.name)}/>
          {
            (this.props.mode === ViewerUtility.identificationMode || this.props.mode === ViewerUtility.plannerMode) && i >= 3 && ((this.lowRes && i < availableLayers.length - 2) || (!this.lowRes && i <= availableLayers.length - 1))
            ? <ListItemSecondaryAction>
                <IconButton edge='end' onClick={() => this.openDataPane(availableLayer.name)}>
                  <InfoIcon/>
                </IconButton>
              </ListItemSecondaryAction>
            : null
          }
        </ListItem>)
      }

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
    if (selectedLayers.includes(GroasisUtility.layers.tile.road)) {
      layerElements.push(this.roadLayer);
    }
    if (selectedLayers.includes(GroasisUtility.layers.tile.terrain)) {
      layerElements.push(this.terrainLayer);
    }

    let map = this.props.map;
    let timestampRange = this.props.timestampRange;

    if (!map || !timestampRange || this.props.mode === ViewerUtility.identificationMode ||  this.props.mode === ViewerUtility.plannerMode) {
      for (let i = 3; i < AVAILABLE_LAYERS.length; i++) {
        let timestampStart = AVAILABLE_LAYERS[i].stacking ? timestampRange.start : timestampRange.end;
        let timestampEnd = timestampRange.end;

        if (selectedLayers.includes(AVAILABLE_LAYERS[i].name) && AVAILABLE_LAYERS[i].type === 'WMS')
        {
          layerElements.push(<WMSTileLayer
            url={AVAILABLE_LAYERS[i].urlName}
            layers={AVAILABLE_LAYERS[i].layerName}
            key={AVAILABLE_LAYERS[i].layerName}
            zIndex={i + 1}
            format={'image/png'}
            transparent={true}
          />)
        }
        else
        {
          let subMap = null;
          if (this.lowRes && (AVAILABLE_LAYERS[i].name === GroasisUtility.layers.tile.lowRes || AVAILABLE_LAYERS[i].name === GroasisUtility.layers.tile.lowResCir) && selectedLayers.includes(AVAILABLE_LAYERS[i].name))
          {
            subMap = this.props.map.maps.find(x => ["4c450c42-1bf6-11e9-96ea-f0038c0f0121", "48d31d14-8cdd-401e-84a0-42941ad19dd6"].includes(x.dataSource.id));
          }

          if (subMap)
          {
            for (let y = timestampStart; y <= timestampEnd; y++) {
              let timestampNumber = 0;

              if (AVAILABLE_LAYERS[i].name !== GroasisUtility.layers.tile.contour) {
                timestampNumber = subMap.timestamps[y].timestamp;
              }

              let key = `${subMap.id}_${timestampNumber}_${AVAILABLE_LAYERS[i].name}`;
              let url = `${ApiManager.apiUrl}/tileService/${subMap.id}/${timestampNumber}/${AVAILABLE_LAYERS[i].urlName}/{z}/{x}/{y}`;

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
                  zIndex={i + 1}
                />
              );

              layerElements.push(layerElement);
            }
          }
        }
      }
      this.props.onLayersChange(layerElements);
      return;
    }

    let zIndex = ViewerUtility.tileLayerZIndex + 3;

    for (let i = 3; i < AVAILABLE_LAYERS.length; i++) {
      let availableLayer = AVAILABLE_LAYERS[i];

      if (!selectedLayers.includes(availableLayer.name)) {
        continue;
      }

      let subMap = map[availableLayer.mapType];

      let timestampStart = availableLayer.stacking ? timestampRange.start : timestampRange.end;
      let timestampEnd = timestampRange.end;

      if (AVAILABLE_LAYERS[i].type === 'WMS')
      {
        layerElements.push(<WMSTileLayer
            url={AVAILABLE_LAYERS[i].urlName}
            layers={AVAILABLE_LAYERS[i].layerName}
            zIndex={zIndex++}
            format={'image/png'}
            transparent={true}
            noWrap={true}
          />)
      }
      else if (subMap)
      {
        for (let y = timestampStart; y <= timestampEnd; y++) {
          let timestampNumber = 0;

          if (availableLayer.name !== GroasisUtility.layers.tile.contour) {
            timestampNumber = subMap.timestamps[y].timestamp;
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
    }

    this.props.onLayersChange(layerElements);
  }

  onRadioChange = (layerName) => {
    let layerChanges = [];

    let selectedLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];

    for (let i = 0; i < 3; i++)
    {
      let pushObj = {}

      if(selectedLayers.includes(AVAILABLE_LAYERS[i].name))
      {
        pushObj.name = AVAILABLE_LAYERS[i].name;
        pushObj.add = false;
        layerChanges.push(pushObj);
      }
      else if(layerName === AVAILABLE_LAYERS[i].name)
      {
        pushObj.name = AVAILABLE_LAYERS[i].name;
        pushObj.add = true;
        layerChanges.push(pushObj);
      }

    }

    this.props.onSelectedLayersChange(ViewerUtility.tileLayerType, layerChanges, false);
  }

  onLayerChange = (layerName, checked) => {
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

  openDataPane = (layerName) => {
    let selectedLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];
    if (!selectedLayers.includes(layerName))
    {
      this.onLayerChange(layerName, true)
    }
    this.props.openPane();
  }

  onExpandClick = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  render() {
    if (!this.props.map) {
      return null;
    }

    return (
      <Card className='layers-control'>
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
            <List dense disablePadding>
              {this.renderCheckboxes()}
            </List>
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

export default TileLayersControl;
