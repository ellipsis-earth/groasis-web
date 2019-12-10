import React, { PureComponent} from 'react';
import {
  Chip
} from '@material-ui/core';

import ViewerUtility from './../ViewerUtility';

import './MapHeader.css';

export class MapHeader extends PureComponent {
  constructor(props, context) {
    super(props, context)

    this.state = {
    };
  }

  handleClick = () =>
  {
    this.props.flyTo({type: ViewerUtility.flyToType.map})
  }

  render() {
    let groasisMap = this.props.map;

    let text = 'Select an area of interest';
    if (this.props.map) {
      text = groasisMap.subatlas.toUpperCase();
    }

    return (
      <div className='map-header'>
        <Chip        
          color='primary'
          label={text}
          onClick={this.props.map ? this.handleClick : null}
        />  
      </div>      
    );
  }
}

export default MapHeader;
