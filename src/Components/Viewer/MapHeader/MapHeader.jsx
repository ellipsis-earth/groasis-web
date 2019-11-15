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
    let text = 'Zoom into an area to select it';

    return (
      <Chip
        className='map-header'
        color='primary'
        label={text}
      />
    );
  }
}

export default MapHeader;
