import React, { PureComponent } from 'react';
import moment from 'moment';

import {
  Card,
  CircularProgress,
  IconButton
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/ClearOutlined';

import ViewerUtility from '../../ViewerUtility';
import DataPaneUtility from '../DataPaneUtility';

import './TreeGalleryControl.css';
import ApiManager from '../../../../ApiManager';

import TreeMessageForm from './GeoMessageForm/TreeMessageForm';

class TreeGalleryControl extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      loading: false,

      rawGeoMessages: [],
    };
  }

  componentDidMount() {
    this.getGeoMessages();
  }

  componentDidUpdate(prevProps) {
    let differentMap = this.props.map !== prevProps.map;
    let differentElement = DataPaneUtility.isDifferentElement(prevProps.element, this.props.element);

    let update = false;

    if (!this.props.element && this.state.rawGeoMessages.length > 0) {
      this.setState({ rawGeoMessages: [] });
      return;
    }

    update = differentMap || differentElement;

    if (update) {
      this.getGeoMessages();
    }
  }

  getGeoMessages = () => {
    this.setState({ loading: true });

    let element = this.props.element;
    let elementProperties = element.feature.properties;

    let body = {
      mapId: this.props.map.referenceMap.id,
      type: 'polygon',
      filters: {
        polygonIds: [elementProperties.id]
      }
    };
    
    return ApiManager.post('/geoMessage/ids', body, this.props.user)
      .then((result) => {
        if (result.count === 0) {
          return [];
        }

        let geoMessageIds = result.messages.map(x => x.id);

        body.messageIds = geoMessageIds;

        return ApiManager.post(`/geoMessage/get`, body, this.props.user);
      })
      .then((result) => {
        this.setState({ loading: false, rawGeoMessages: result } );
      })
      .catch(err => {
        console.error(err);
        this.setState({ loading: false });
      });
  }

  getImage = async (messageId, cb) => {
    let body = {
      mapId: this.props.map.referenceMap.id,
      geoMessageId: messageId,
      type: 'polygon'
    };

    return ApiManager.post('/geoMessage/image', body, this.props.user)
      .then(fullImageBlob => {
        let reader = new FileReader();
        reader.readAsDataURL(fullImageBlob);
        reader.onloadend = () => cb(reader.result)
      });
  }

  onDeleteMessage = (deletedMessage) => {
    let newRawGeoMessages = [...this.state.rawGeoMessages.filter(x => x.id !== deletedMessage.id)];

    this.setState({ rawGeoMessages: newRawGeoMessages});
  }

  onNewMessage = (newMessage) => {
    let newRawGeoMessages = [...this.state.rawGeoMessages, newMessage];

    this.setState({ rawGeoMessages: newRawGeoMessages });
  }

  renderMessages = () => {
    let rawGeoMessages = this.state.rawGeoMessages;

    if (!rawGeoMessages) {
      return null;
    }

    if (rawGeoMessages.length === 0) {
      return (
        <div>
          No messages.
        </div>
      );
    }
    
    let rows = rawGeoMessages.map(x => {
      return (
        <tr>
          <td>{moment(x.date).format('YYYY-MM-DD')}</td>          
          <td>
            <img 
              src={x.thumbnail}
              onClick={() => {
                if (!x.fullImage) {
                  this.getImage(x.id, (fullImage) => {
                    x.fullImage = fullImage
                    this.setState({ fullImage: x.fullImage });
                  });
                }
                else {
                  this.setState({ fullImage: x.fullImage });
                }
              }}
            />
          </td>
        </tr>
      )
    });    

    return (
      <table className='tree-gallery-table'>
        <tr>
          <th>Date</th>
          <th>Photo</th>
        </tr>
        {rows}
      </table>
    );
  }

  render() {
    if (this.props.home) {
      return null;
    }

    let modal = null;
    if (this.state.fullImage) {
      modal = (
        <div className='viewer-modal geomessage-lightbox' onClick={() => this.setState({ fullImage: null })}>
          <div className='viewer-modal-close'>
            <IconButton
              onClick={() => this.setState({ fullImage: null })}
              style={{ color: '#ffffff' }}
              aria-label='Close'
            >
              <ClearIcon />
            </IconButton>
          </div>
          <img className='geomessage-lightbox-image' src={this.state.fullImage}></img>
        </div> 
      );
    }

    let className = 'data-pane-card geomessage-messages-card tree-control-card';

    return (
      <div className='geomessage-control'>
        <Card className={className}>
          {
            this.state.loading ?
              <CircularProgress className='loading-spinner'/> : this.renderMessages()
          }
        </Card>
        <TreeMessageForm
          user={this.props.user}
          map={this.props.map}
          timestampRange={this.props.timestampRange}
          geolocation={this.props.geolocation}
          element={this.props.element}
          onNewMessage={this.onNewMessage}
        />
        {modal}
      </div>
    );
  }
}

export default TreeGalleryControl;
