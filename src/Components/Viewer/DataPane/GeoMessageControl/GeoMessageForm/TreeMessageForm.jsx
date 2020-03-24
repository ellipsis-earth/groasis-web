import React, { PureComponent } from 'react';
import Moment from 'moment';
import { readAndCompressImage } from 'browser-image-resizer';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CircularProgress from '@material-ui/core/CircularProgress';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';

import ClearIcon from '@material-ui/icons/Clear';

import './GeoMessageForm.css';
import ApiManager from '../../../../../ApiManager';

const IMAGE_MIME_TYPES = ['image/gif', 'image/jpeg', 'image/png'];
const MAX_IMAGE_DIMENSIONS = {
  width: 1920,
  height: 1080
};
const MAX_IMAGE_SIZE = 10000000;

class GeoMessageForm extends PureComponent {

  uploadedImage = null;

  fileUploadRef = null;

  constructor(props, context) {
    super(props, context);

    // this.messageInputRef = React.createRef();
    this.fileUploadRef = React.createRef();

    this.state = {
      expanded: false,
      loading: false,

      hasPermissions: false,
      messageText: '',
      private: false,

      selectedFormName: 'default',

      formAnswers: []
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }

  toggleExpand = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  onImageChange = (e) => {
    e.preventDefault();

    let file = e.target.files[0];

    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      alert('Invalid image type.');
      return;
    }

    this.setState({ loading: true }, () => {
      const imgConfig = {
        quality: 0.8,
        maxWidth: MAX_IMAGE_DIMENSIONS.width,
        maxHeight: MAX_IMAGE_DIMENSIONS.height,
        autoRotate: true
      };

      readAndCompressImage(file, imgConfig)
        .then(image => {

          if (image.size > MAX_IMAGE_SIZE) {
            alert(`Image too large (max ${(MAX_IMAGE_SIZE / 1000).toFixed(2)} MB).`);
            this.setState({ loading: false });
            return;
          }

          return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = function() {
              resolve(reader.result);
            };
            reader.readAsDataURL(image);
          });
        })
        .then(base64 => {
          this.uploadedImage = base64;
          this.setState({ loading: false });
        })
        .catch(err => {
          this.setState({ loading: false });
          alert('Invalid image type.');
        });
    });
  }

  onGeoMessageSubmit = () => {
    this.setState({ loading: true });

    let element = this.props.element;
    let elementProperties = element.feature.properties;

    let body = {
      mapId: this.props.map.referenceMap.id,
      type: 'polygon',
      elementId: elementProperties.id,
      timestamp: 0,
      image: this.uploadedImage,
    };

    let geolocation = this.props.geolocation;
    if (geolocation) {
      body.location = { x: geolocation[1], y: geolocation[0] };
    }

    ApiManager.post(`/geomessage//add`, body, this.props.user)
      .then(result => {
        let newMessage = {
          id: result.id,
          user: this.props.user.username,
          thumbnail: this.uploadedImage,
          fullImage: this.uploadedImage,
          date: Moment().format(),
        };

        this.props.onNewMessage(newMessage);

        this.fileUploadRef.current.value = '';
        this.uploadedImage = null;
        this.setState({
          expanded: false,
          loading: false
        });
      })
      .catch(err => {
        alert('An error occurred while adding a GeoMessage.');
        this.fileUploadRef.current.value = '';
        this.setState({ loading: false });
      });
  }

  render() {
    let user = this.props.user;
    let map = this.props.map.referenceMap;

    let hasAddPermission = user && map.accessLevel >= ApiManager.accessLevels.addGeoMessages;

    let title = 'Add Photo';
    if (!user) {
      title = 'Please login';
    }
    else if (!hasAddPermission) {
      title = 'Insufficient access';
    }

    let cardClassName = 'data-pane-card geomessage-form-card';
    if (this.state.expanded) {
      cardClassName += ' geomessage-form-card-expanded';
    }

    return (
      <Card className={cardClassName}>
        <CardHeader
          className='geomessage-form-card-header'
          title={
            !this.state.expanded ?
              <Button
                className='geomessage-add-expand-button'
                variant='contained'
                color='primary'
                onClick={this.toggleExpand}
                disabled={!hasAddPermission}
              >
                {title}
              </Button> :
              <div className='geomessage-expanded-title'>
                Add Photo
              </div>
          }
          action={
            this.state.expanded ?
              <IconButton
                className={this.state.expanded ? 'expand-icon' : 'expand-icon expanded'}
                onClick={this.toggleExpand}
                aria-expanded={this.state.expaneded}
                aria-label='Expand'
              >
                <ClearIcon />
              </IconButton> : null
          }
        />
        <Collapse in={this.state.expanded}>
          <CardContent className='data-pane-card-content'>
            <div className='card-content-item geomessage-form-card-item'>
              <div>
                <div className='geomessage-upload-image-label'>
                  {'Upload image'}
                </div>
                <input
                  ref={this.fileUploadRef}
                  type='file'
                  accept='image/*'
                  onChange={this.onImageChange}
                />
              </div>
            </div>
            <div className='geomessage-form-section'>
              <Button
                className='card-content-item geomessage-form-card-item card-submit-button'
                variant='contained'
                color='primary'
                onClick={this.onGeoMessageSubmit}
                disabled={this.state.loading}
              >
                Submit
              </Button>
            </div>
            { this.state.loading ? <CircularProgress className='loading-spinner'/> : null}
          </CardContent>
        </Collapse>
      </Card>
    )
  }
}

export default GeoMessageForm;
