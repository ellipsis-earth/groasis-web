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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  
  faTimes,
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

  drawControl = null

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
    if (this.state.drawControl) {
      this.state.drawControl.disable();
    }

    let d = new L.Draw.Marker(this.props.leafletMap.current.leafletElement);
    d.enable();

    this.setState({ drawControl: d, drawMode: ViewerUtility.newTreeElementType });
  }

  onDrawPolygon = () => {
    if (this.state.drawControl) {
      this.state.drawControl.disable();
    }

    let d = new L.Draw.Polygon(this.props.leafletMap.current.leafletElement);
    d.setOptions({
      allowIntersection: false,
      showArea: true,
      metric: ['km', 'm']
    });
    d.enable();

    this.setState({ drawControl: d, drawMode: ViewerUtility.ooiElementType });
  }

  onDrawLine = () => {
    if (this.state.drawControl) {
      this.state.drawControl.disable();
    }

    let d = new L.Draw.Polyline(this.props.leafletMap.current.leafletElement);
    d.setOptions({
      allowIntersection: false,
      showLength: true
    });
    d.enable();
    
    this.setState({ drawControl: d, drawMode: ViewerUtility.plantingLineElementType });
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

    this.setState({ drawControl: null });
  }

  onShowLocations = () => {
    let groasisMaps = this.props.groasisMaps;

    let latLngBounds = [
      [groasisMaps.bounds.yMin, groasisMaps.bounds.xMin],
      [groasisMaps.bounds.yMax, groasisMaps.bounds.xMax],
    ];
    this.props.leafletMap.current.leafletElement.flyToBounds(latLngBounds);
  }

  onStopDraw = () => {
    if (this.state.drawControl) {
      this.state.drawControl.disable();
    }

    this.setState({ drawControl: null });
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
          {
            this.state.drawControl ? (
              <NavItem>
                <IconButton
                  className='tool-button'
                  color='secondary'  
                  onClick={this.onStopDraw}
                >
                  <FontAwesomeIcon icon={faTimes} />                  
                </IconButton>
              </NavItem>
            ) : null
          }
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
