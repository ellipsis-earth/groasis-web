import React, { PureComponent} from 'react';
import {
  Chip
} from '@material-ui/core';

import './MapHeader.css';

export class MapHeader extends PureComponent {
  constructor(props, context) {
    super(props, context)

    this.state = {
    };
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
        />  
      </div>      
    );
  }
}

export default MapHeader;
