import React, { PureComponent } from 'react';

import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/ClearOutlined';

import AnnotateTool from './AnnotateTool';

import './AnnotatePane.css';

class AnnotatePane extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
    };
  }

  componentDidUpdate(prevProps) {
  }

  render() {
    return (
      <div className='viewer-modal'>
        <AnnotateTool
          map={this.props.map}
          user={this.props.user}
          tileId={this.props.tileId}
          timestamp={this.props.timestamp}
          onClose={this.props.onClose}
        />
        <div className='viewer-modal-close'>
          <IconButton
            onClick={this.props.onClose}
            color='secondary'
            aria-label='Close'
          >
            <ClearIcon />
          </IconButton>
        </div>
      </div>
    )
  }
}

export default AnnotatePane;
