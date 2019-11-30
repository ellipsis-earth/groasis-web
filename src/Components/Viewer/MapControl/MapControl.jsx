import React, { PureComponent} from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import L, { DrawC } from 'leaflet';
import { GeoJSON } from 'react-leaflet';

import {
  Button,
  IconButton,
  CircularProgress
} from '@material-ui/core';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import TimeLineIcon from '@material-ui/icons/Timeline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen, 
  faSearchPlus, 
  faSearchMinus, 
  faGlobeAmericas,
  faPlus, 
  faMinus,
  faTree,
  faEraser, 
  faDrawPolygon,
  faSave,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

import './MapControl.css';
import Viewer from '../Viewer';
import ViewerUtility from '../ViewerUtility';
import GroasisUtility from '../GroasisUtility';

export class MapControl extends PureComponent {
  constructor(props, context) {
    super(props, context)

    this.state = {
      drawMode: null
    };
  }

  componentDidMount = () => {
    if (this.props.leafletMap) {
      this.props.leafletMap.current.leafletElement.on(
        L.Draw.Event.CREATED, this.onShapeDraw
      );
    }
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.leafletMap !== this.props.leafletMap && this.props.leafletMap) {
      this.props.leafletMap.current.leafletElement.on(
        L.Draw.Event.CREATED, this.onShapeDraw
      );
    }
  }

  onZoom = (delta) => {
    let leafletElement = this.props.leafletMap.current.leafletElement;
    leafletElement.zoomIn(delta);
  }

  onPlantTree = () => {
    this.setState({ drawMode: ViewerUtility.newTreeElementType });
    new L.Draw.Marker(this.props.leafletMap.current.leafletElement).enable();
  }

  onDrawPolygon = () => {
    this.setState({ drawMode: ViewerUtility.drawnPolygonLayerType });
    let d = new L.Draw.Polygon(this.props.leafletMap.current.leafletElement);
    d.setOptions({
      allowIntersection: false
    });
    d.enable();
  }

  onDrawLine = () => {
    this.setState({ drawMode: ViewerUtility.drawnPolygonLayerType });
    let d = new L.Draw.Polyline(this.props.leafletMap.current.leafletElement);
    d.setOptions({
      allowIntersection: false
    });
    d.enable();
  }

  onShapeDraw = (e) => {
    let layer = e.layer;

    let geoJson = layer.toGeoJSON();
    geoJson.properties.id = Math.random();
    geoJson.properties[ViewerUtility.selection.specialProperty.type] = this.state.drawMode;

    let icon = ViewerUtility.returnMarker('#3388ff', ViewerUtility.markerSize, 'RoomTwoTone');

    let drawnGeometryElement = (
      <GeoJSON
        key={Math.random()}
        data={geoJson}
        zIndex={ViewerUtility.drawnPolygonLayerZIndex}
        onEachFeature={(_, layer) => layer.on({ 
          click: () => this.props.onSelectFeature(ViewerUtility.drawnPolygonLayerType, geoJson, false) 
        })}
        pointToLayer={(geoJsonPoint, latlng) => ViewerUtility.createMarker(latlng, icon)}
      />
    );

    this.props.onDrawGeometry(geoJson, drawnGeometryElement);
  }

  onShowLocations = () => {
    let groasisMaps = this.props.groasisMaps;

    let latLngBounds = [
      [groasisMaps.bounds.yMin, groasisMaps.bounds.xMin],
      [groasisMaps.bounds.yMax, groasisMaps.bounds.xMax],
    ];
    this.props.leafletMap.current.leafletElement.flyToBounds(latLngBounds);
  }

  render() {
    let plannerButtons = [];

    if (this.props.mode === ViewerUtility.plannerMode) {
      plannerButtons.push(
        <Nav className='flex-column map-control map-control-planner'>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'  
              onClick={this.onPlantTree}
            >
              <FontAwesomeIcon icon={faTree} />              
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'  
              onClick={this.onDrawPolygon}
            >
              <FontAwesomeIcon icon={faDrawPolygon} />              
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'  
              onClick={this.onDrawLine}
            >
              <TimeLineIcon/>  
            </IconButton>
          </NavItem>
        </Nav>        
      );
    }

    return (
      <div>
        <Nav className='flex-column map-control'>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'  
              onClick={() => this.onZoom(1)}
            >
              <FontAwesomeIcon icon={faPlus} />              
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              onClick={() => this.onZoom(-1)}
            >
              <FontAwesomeIcon icon={faMinus} />              
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'              
              onClick={() => this.props.onFlyTo({
                type: ViewerUtility.flyToType.currentLocation
              })}
            >
              <MyLocationIcon style={{ fontSize: '21px' }} />              
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'
              style={{ fontSize: '18px' }}
              onClick={() => this.onShowLocations()}
            >
              <FontAwesomeIcon icon={faGlobeAmericas} />              
            </IconButton>
          </NavItem>
        </Nav>
        {plannerButtons}
      </div>      
    );
  }
}

export default MapControl;
