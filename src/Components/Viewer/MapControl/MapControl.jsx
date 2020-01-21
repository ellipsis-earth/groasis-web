import React, { PureComponent} from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import L from 'leaflet';
import { GeoJSON } from 'react-leaflet';

import { IconButton } from '@material-ui/core';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import TimeLineIcon from '@material-ui/icons/Timeline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  
  faTimes,
  faGlobeAmericas,
  faPlus, 
  faMinus,
  faTree, 
  faDrawPolygon
} from '@fortawesome/free-solid-svg-icons';

import './MapControl.css';
import ViewerUtility from '../ViewerUtility';

export class MapControl extends PureComponent {

  constructor(props, context) {
    super(props, context)

    this.state = {
      drawMode: null,
      map: null,
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

    if (this.props.mode === ViewerUtility.viewerMode && this.state.drawControl) {
      this.state.drawControl.disable();
      this.state.drawControl = null;
    }

    if (!prevProps.map || (this.props.map && prevProps.map.subatlas !== this.props.map.subatlas))
    {
      if (this.props.map)
      {
        this.setState({map: this.props.map.subatlas})
      }
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

  onDrawPolygon = (drawMode = ViewerUtility.ooiElementType) => {
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

    this.setState({ drawControl: d, drawMode: drawMode});
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
          click: () => this.props.onSelectFeature(this.state.drawMode ? this.state.drawMode : ViewerUtility.drawnPolygonLayerType, geoJson, false) 
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

  onMapRequest = () => {
    this.onDrawPolygon(ViewerUtility.plantingSiteElementType);
  }

  render() {
    let plannerButtons = [];

    let map = this.state.map ? true : false;
    let user = this.props.user ? true : false;

    let disabled = !map || !user;

    if (this.props.mode === ViewerUtility.plantMode) {
      plannerButtons.push(
        <Nav className='flex-column map-control map-control-planner' key={this.props.mode}>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'  
              onClick={this.onPlantTree}
              disabled={disabled}
            >
              <FontAwesomeIcon icon={faTree} />              
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'  
              onClick={() => this.onDrawPolygon()}
              disabled={disabled}
            >
              <FontAwesomeIcon icon={faDrawPolygon} />              
            </IconButton>
          </NavItem>
          <NavItem>
            <IconButton
              className='tool-button'
              color='secondary'  
              onClick={this.onDrawLine}
              disabled={disabled}
            >
              <TimeLineIcon/>  
            </IconButton>
          </NavItem>
          {
            this.state.drawControl && !disabled ? (
              <NavItem>
                <IconButton
                  className='tool-button'
                  color='secondary'  
                  onClick={this.onStopDraw}
                  disabled={disabled}
                >
                  <FontAwesomeIcon icon={faTimes} />                  
                </IconButton>
              </NavItem>
            ) : null
          }
        </Nav>        
      );
    }
    else if(this.props.mode === ViewerUtility.plannerMode)
    {
      disabled = this.props.user ? false : true
      plannerButtons.push(<Nav className='flex-column map-control map-control-planner' key={this.props.mode + '_' + disabled}>
        <NavItem>
          <IconButton
            className='tool-button'
            color='secondary'  
            onClick={this.onMapRequest}
            disabled={disabled}
          >
            <FontAwesomeIcon icon={faDrawPolygon} />              
          </IconButton>
        </NavItem>
      </Nav>)
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
