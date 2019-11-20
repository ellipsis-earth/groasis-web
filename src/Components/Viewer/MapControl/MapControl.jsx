import React, { PureComponent} from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import L, { DrawC } from 'leaflet';

import {
  Button,
  IconButton,
  CircularProgress
} from '@material-ui/core';
import CircleIcon from '@material-ui/icons/FiberManualRecord';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen, 
  faSearchPlus, 
  faSearchMinus, 
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

export class MapControl extends PureComponent {
  constructor(props, context) {
    super(props, context)

    this.state = {
    };
  }

  onZoom = (delta) => {
    let leafletElement = this.props.leafletMap.current.leafletElement;
    leafletElement.zoomIn(delta);
  }

  onPlantTree = () => {
    new L.Draw.Marker(this.props.leafletMap.current.leafletElement).enable();
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
        </Nav>
        {plannerButtons}
      </div>      
    );
  }
}

export default MapControl;
