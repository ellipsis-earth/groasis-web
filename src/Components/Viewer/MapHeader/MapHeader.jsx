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

  handleClick = (type) =>
  {
    if(type === 'flyTo')
    {
      this.props.flyTo({type: ViewerUtility.flyToType.map})
    }
    else if (type === 'login')
    {
      this.props.openAccounts(true);
    }
  }

  render() {
    let groasisMap = this.props.map;
    let type = groasisMap ? 'flyTo' : null;

    let text = 'Select an area of interest';
    if (groasisMap && groasisMap.subatlas) {
      text = groasisMap.subatlas.toUpperCase();
    }
    else if (this.props.mode === ViewerUtility.plannerMode)
    {
      if (!this.props.user)
      {
        text = 'Please login';
        type = 'login';
      }
      else
      {
        text = 'Draw a polygon';
      }
    }

    return (
      <div className='map-header'>
        <Chip        
          color='primary'
          label={text}
          onClick={type ? () => this.handleClick(type) : null}
        />  
      </div>      
    );
  }
}

export default MapHeader;
