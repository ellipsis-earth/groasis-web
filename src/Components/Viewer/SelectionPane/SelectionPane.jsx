import React, { PureComponent } from 'react';
import { readAndCompressImage } from 'browser-image-resizer';

import DateFnsUtils from '@date-io/date-fns';
import moment from 'moment';
import {
  Card,
  Checkbox,
  Button,
  CardHeader,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  CircularProgress,
  TextField
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import ClearIcon from '@material-ui/icons/Clear';
import SaveAlt from '@material-ui/icons/SaveAlt';

import ViewerUtility from '../ViewerUtility';
import GroasisUtility from '../GroasisUtility';

import ApiManager from '../../../ApiManager';

import AnnotatePane from '../AnnotatePane/AnnotatePane';

import './SelectionPane.css';

const DELETE_CUSTOM_POLYGON_ACTION = 'delete_custom_polygon';
const ANNOTATE_ACTION = 'annotate';

const IMAGE_MIME_TYPES = ['image/gif', 'image/jpeg', 'image/png'];
const MAX_IMAGE_DIMENSIONS = {
  width: 1920,
  height: 1080
};
const MAX_IMAGE_SIZE = 10000000;

class SelectionPane extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      isOpen: false,
      loading: false,

      newTreeProps: {
        species: null,
        plantingDate: moment().format('YYYY-MM-DD')
      }
    };
  }

  componentDidUpdate(prevProps) {
    if (!this.props.element) {
      this.setState({ isOpen: false });
    }
    else if (prevProps.element !== this.props.element) {
      this.setState({ isOpen: true });
      this.uploadedImage = null;
    }
  }

  open = () => {
    this.setState({ isOpen: true });
  }

  refresh = () => {
    this.forceUpdate();
  }

  deleteCustomPolygon = () => {
    this.setState({ loading: true }, () => {
      let body = {
        mapId: this.props.map.referenceMap.id,
        polygonId: this.props.element.feature.properties.id
      };

      ApiManager.post('/geometry/delete', body, this.props.user)
        .then(() => {
          this.props.onDeletePolygon();
          this.props.onDeselect();
          this.setState({ isOpen: false, loading: false });
        })
        .catch(err => {
          console.log(err);
          this.setState({ loading: false });
        });
    });

  }

  onCloseClick = () => {
    this.props.onDeselect();

    this.setState({ isOpen: false });
  }

  onElementActionClick = (action) => {
    if (action === DELETE_CUSTOM_POLYGON_ACTION) {
      this.deleteCustomPolygon();
    }
    else if (action === ANNOTATE_ACTION) {
      this.setState({ annotate: true });
    }
    else {
      this.props.onDataPaneAction(action);
    }
  }

  onDownload = () => {
    let element = this.props.element;

    if (!element) {
      return;
    }

    let type = element.type;
    let feature = element.feature;

    let nameComponents = [this.props.map.subatlas];

    if (type === ViewerUtility.standardTileLayerType) {
      nameComponents.push(
        'tile',
        feature.properties.tileX,
        feature.properties.tileY,
        feature.properties.zoom
      );
    }
    else if (type === ViewerUtility.polygonLayerType || type === ViewerUtility.treeElementType) {
      nameComponents.push('polygon', feature.properties.id);
    }
    else if (type === ViewerUtility.drawnPolygonLayerType) {
      nameComponents.push('drawnPolygon');
    }

    let fileName = nameComponents.join('_').replace(' ', '_') + '.geojson';

    let geoJson = {
      type: 'FeatureCollection',
      count: 1,
      features: [feature]
    };

    ViewerUtility.download(fileName, JSON.stringify(geoJson), 'application/json');
  }

  onAnnotatePaneClose = () => {
    this.setState({ annotate: false });
  }

  onPlantTree = () => {
    let newTreeProps = this.state.newTreeProps;

    if (!newTreeProps.species || !newTreeProps.plantingDate) {
      alert('Not all fields are filled.');
      return;
    }

    let markerGeoJson = this.props.element.feature;

    let treeGeoJson = GroasisUtility.markerToTreePolygon(markerGeoJson);
    treeGeoJson.properties = {
      [GroasisUtility.treeProperties.species]: newTreeProps.species,
      [GroasisUtility.treeProperties.plantingDate]: newTreeProps.plantingDate
    };

    let body = {
      mapId: this.props.map.referenceMap.id,
      timestamp: 0,
      layer: GroasisUtility.layers.polygon.trees,
      feature: treeGeoJson
    };

    ApiManager.post('/geometry/add', body, this.props.user)
      .then(trackingInfo => {
        if (this.uploadedImage) {
          this.trackAddTree(trackingInfo.trackingId, this.uploadedImage);
        }

        alert('Tree planted. It can take a few moments before it is visible.');
        this.onCloseClick();
      })
      .catch(err => {
        alert(JSON.stringify(err));        
        console.log(err);        
      });
  }

  onAddGeometry = () => {
    let element = this.props.element;

    let layer = null;
    if (element.type === ViewerUtility.plantingLineElementType) {
      layer = GroasisUtility.layers.polygon.plantingLines;
    }
    else if (element.type === ViewerUtility.ooiElementType) {
      layer = GroasisUtility.layers.polygon.objectOfInterest;      
    }

    let body = {
      mapId: this.props.map.referenceMap.id,
      timestamp: 0,
      layer: layer,
      feature: {
        ...element.feature,
        properties: {}
      }
    };

    ApiManager.post('/geometry/add', body, this.props.user)
      .then(() => {
        let stringPart = null;
        if (element.type === ViewerUtility.plantingLineElementType) {
          stringPart = 'Planting line added.';
        }
        else if (element.type === ViewerUtility.ooiElementType) {
          stringPart = 'Object of interest added.';
        }
        alert(`${stringPart} It can take a few moments before it is visible.`);
        this.onCloseClick();
      })
      .catch(err => {
        alert(JSON.stringify(err));        
        console.log(err);        
      });
  }

  trackAddTree = (trackingId, image) => {
    let mapId = this.props.map.referenceMap.id;

    let body = {
      mapId: mapId,
      trackingId: trackingId
    };

    let user = this.props.user;

    let trackFunc = () => {
      ApiManager.post('/geometry/track', body, user)
        .then(trackingInfo => {

          if (!trackingInfo.added) {
            setTimeout(trackFunc, 1000);
            return;
          }

          let polygonId = trackingInfo.polygonId;
          let geolocation = this.props.geolocation;

          body = {
            mapId: mapId,
            type: ViewerUtility.polygonLayerType,
            timestamp: 0,
            elementId: polygonId,
            image: image,
            location: { x: geolocation[1], y: geolocation[0] }
          }

          ApiManager.post('/geomessage/add', body, user);          
        });
    }

    trackFunc();
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

  onWatchTree = (e) => {
    let checked = e.target.checked;

    if (checked) {
      let body = {
        mapId: this.props.map.referenceMap.id,
        elementId: this.props.element.id,
        type: ViewerUtility.polygonLayerType,
        timestamp: 0,
        form: {
          formName: GroasisUtility.watchForm,
          answers: []
        }
      };

      ApiManager.post('/geomessage/add', body, this.props.user) 
        .then((result) => {
          this.props.map.watchlist.push({
            id: result.id,
            elementId: this.props.element.id
          });

          this.forceUpdate();
        })
    }
    else {
      let geoMessage = this.props.map.watchlist.find(x => x.elementId === this.props.element.id);

      if (!geoMessage) {
        return;
      }

      let body = {
        mapId: this.props.map.referenceMap.id,
        messageId: geoMessage.id,
        type: ViewerUtility.polygonLayerType
      };

      ApiManager.post('/geomessage/delete', body, this.props.user)
        .then(() => {
          this.props.map.watchlist = this.props.map.watchlist.filter(x => x !== geoMessage);
          this.forceUpdate();
        })
    }

  }

  renderTreeInputs = () => {
    let checked = this.props.map.watchlist.find(x => x.elementId === this.props.element.id) ? true : false;

    return (
      <div>
        <Checkbox
          color='primary'
          name={`Watch Tree`}
          onChange={this.onWatchTree}
          checked={checked}
        />
        <span>Watch Tree</span>
      </div>
    );
  }

  renderNewTreeInputs = () => {
    return (
      <div className='selection-input'>
        <Autocomplete
          id='species-select'   
          className='selection-input-text'       
          freeSolo
          options={GroasisUtility.species}
          style={{ width: '100%' }}
          renderInput={params => (
            <TextField {...params} label='Species' variant='outlined' fullWidth/>
          )}
          value={this.state.newTreeProps.species}
          onChange={(e, newValue) => {
            let newTreeProps = {
              ...this.state.newTreeProps
            };

            newTreeProps.species = newValue;

            this.setState({ newTreeProps: newTreeProps });
          }}
        />
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <KeyboardDatePicker
            id='planting-date-picker'
            disableToolbar
            variant='inline'
            format='yyyy-MM-dd'
            margin='normal'
            label='Planting date'
            value={this.state.newTreeProps.plantingDate}
            onChange={(date) => {
              let newTreeProps = {
                ...this.state.newTreeProps
              };

              newTreeProps.plantingDate = moment(date).format('YYYY-MM-DD');

              this.setState({ newTreeProps: newTreeProps });
            }}
          />
        </MuiPickersUtilsProvider>
        <div className='geomessage-upload-image-label'>
          Upload photo
        </div>
        <input
          type='file'
          accept='image/*'
          onChange={this.onImageChange}
        />
      </div>
    )
  }

  render() {
    if (!this.state.isOpen) {
      return null;
    }

    let map = this.props.map ? this.props.map.referenceMap : null;
    let element = this.props.element;

    if (!element) {
      return null;
    }

    let title = null;

    let user = this.props.user;
    let mapAccessLevel = map ? map.accessLevel : 0;

    let firstRowButtons = [];
    let secondRowButtons = [];

    firstRowButtons.push(
      <Button
        key='analyse'
        variant='contained'
        color='primary'
        size='small'
        className='selection-pane-button'
        onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.analyse)}
        disabled={mapAccessLevel < ApiManager.accessLevels.aggregatedData}
      >
        {'ANALYSE'}
      </Button>
    );

    let elementProperties = { ...element.feature.properties };

    if (element.type === ViewerUtility.subatlasElementType) {
      firstRowButtons = [
        <Button
          key='go'
          variant='contained'
          color='primary'
          size='small'
          className='selection-pane-button selection-pane-button-single'
          onClick={() => this.props.onSelectMap()}
        >
          {'GO'}
        </Button>
      ];
      title = element.feature.properties[GroasisUtility.subatlasProperty].toUpperCase();
    }
    else if (element.type !== ViewerUtility.drawnPolygonLayerType && element.type !== ViewerUtility.treeElementType) {
      firstRowButtons.push((
        <Button
          key='geoMessage'
          variant='outlined'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.geoMessage)}
          disabled={mapAccessLevel < ApiManager.accessLevels.viewGeoMessages}
        >
          {'GeoMessage'}
        </Button>
      ));
    }

    if (element.type === ViewerUtility.standardTileLayerType) {
      if (elementProperties.type === ViewerUtility.wmsTileLayerType) {
        title = 'WMS tile';
        delete elementProperties.type;
        firstRowButtons = [];

        firstRowButtons.push(
          <Button
            key='edit'
            variant='outlined'
            size='small'
            className='selection-pane-button'
            onClick={() => this.onElementActionClick(ANNOTATE_ACTION)}
            disabled={mapAccessLevel < ApiManager.accessLevels.submitRasterData}
          >
            {'ANNOTATE'}
          </Button>,
        );
      }
      else {
        title = 'Standard tile';
      }
    }
    else if (element.type === ViewerUtility.polygonLayerType) {
      title = 'Polygon';

      let canEdit = user &&
        (mapAccessLevel > ApiManager.accessLevels.alterOrDeleteCustomPolygons ||
        element.feature.properties.user === user.username);

      secondRowButtons.push(
        <Button
          key='edit'
          variant='outlined'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.editCustomPolygon)}
          disabled={!canEdit}
        >
          {'EDIT'}
        </Button>,
        <Button
          key='delete'
          variant='outlined'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(DELETE_CUSTOM_POLYGON_ACTION)}
          disabled={!canEdit}
        >
          {'DELETE'}
        </Button>
      );
    }
    else if (element.type === ViewerUtility.treeElementType) {
      title = 'Tree';

      firstRowButtons.push(
        <Button
          key='gallery'
          variant='contained'
          color='primary'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.geoMessage)}          
        >
          Gallery
        </Button>
      );

      secondRowButtons.push(
        <Button
          key='delete'
          variant='outlined'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(DELETE_CUSTOM_POLYGON_ACTION)}
          disabled={!user || mapAccessLevel < ApiManager.accessLevels.alterOrDeleteCustomPolygons}
        >
          {'DELETE'}
        </Button>
      );
    }
    else if (element.type === ViewerUtility.drawnPolygonLayerType) {
      title = 'Drawn polygon';

      let nonRestrictedLayer = this.props.map.referenceMap.layers.polygon.find(x => !x.restricted);

      let canAdd = user && 
        mapAccessLevel >= ApiManager.accessLevels.addPolygons &&
        (nonRestrictedLayer || mapAccessLevel >= ApiManager.accessLevels.addRestrictedPolygons);

      firstRowButtons.push(
        <Button
          key='add'
          variant='outlined'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.createCustomPolygon)}
          disabled={!canAdd}
        >
          {'ADD'}
        </Button>
      );
    }
    else if (element.type === ViewerUtility.newTreeElementType) {
      title = 'Plant tree';

      firstRowButtons = [
        <Button
          key='add'
          variant='contained'
          color='primary'
          size='small'
          className='selection-pane-button selection-pane-button-single'
          onClick={this.onPlantTree}
          disabled={!user || mapAccessLevel < ApiManager.accessLevels.addPolygons || this.state.loading}
        >
          {'PLANT'}
        </Button>
      ];
    }
    else if (element.type === ViewerUtility.ooiElementType) {
      title = 'New object of interest';

      firstRowButtons = [
        <Button
          key='add'
          variant='contained'
          color='primary'
          size='small'
          className='selection-pane-button selection-pane-button-single'
          onClick={this.onAddGeometry}
          disabled={!user || mapAccessLevel < ApiManager.accessLevels.addPolygons}
        >
          Add
        </Button>
      ];
    }
    else if (element.type === ViewerUtility.plantingLineElementType) {
      title = 'New planting line';

      firstRowButtons = [
        <Button
          key='add'
          variant='contained'
          color='primary'
          size='small'
          className='selection-pane-button selection-pane-button-single'
          onClick={this.onAddGeometry}
          disabled={!user || mapAccessLevel < ApiManager.accessLevels.addPolygons}
        >
          Add
        </Button>
      ];
    }


    let properties = [];
    let inputElements = [];

    let selectionPaneClass = 'selection-pane';

    for (let property in elementProperties) {
      let propertyValue = elementProperties[property];

      let isId = property === 'id';

      if (property[0] === ViewerUtility.selection.specialProperty.prefix) {
        continue;
      }

      let drawnType = 
        element.type === ViewerUtility.drawnPolygonLayerType || 
        element.type === ViewerUtility.newTreeElementType ||
        element.type === ViewerUtility.plantingLineElementType ||
        element.type === ViewerUtility.ooiElementType;

      if (drawnType && isId) {
        continue;
      }

      if (element.type === ViewerUtility.customPolygonTileLayerType && property === ViewerUtility.isPrivateProperty) {
        if (propertyValue === true) {
          selectionPaneClass += ' selection-pane-private';
        }

        continue;
      }

      if (element.type === ViewerUtility.treeElementType) {
        if (property !== GroasisUtility.treeProperties.species && 
          property !== GroasisUtility.treeProperties.plantingDate
          && !isId) {
          continue;
        }
      }

      if (elementProperties.hasOwnProperty(property)) {
        let e = (
          <div key={property}>
            {`${property}: ${propertyValue}`}
          </div>
        );

        if (isId) {
          properties = [e, ...properties];
        }
        else {
          properties.push(e);
        }        
      }
    }

    if (element.type === ViewerUtility.treeElementType) {
      inputElements = this.renderTreeInputs();
    }
    else if (element.type === ViewerUtility.newTreeElementType) {
      inputElements = this.renderNewTreeInputs();
    }
       
    return (
      <div>
        {this.state.annotate ? 
          <AnnotatePane 
            map={this.props.map.referenceMap}
            user={this.props.user}
            tileId={this.props.element.id}
            timestamp={this.props.timestampRange.end}
            onClose={this.onAnnotatePaneClose}
          /> : null
        }
        <Card className={selectionPaneClass}>
          <CardHeader
            className='material-card-header'
            title={
              <Button
                onClick={() => this.props.onFlyTo({
                  type: ViewerUtility.flyToType.currentElement
                })}
              >
                <Typography variant='h6' component='h2' className='no-text-transform'>
                  {title}
                </Typography>
              </Button>
            }
            action={
              <div>
                {
                  element.type !== ViewerUtility.subatlasElementType ? 
                    <IconButton
                      onClick={this.onDownload}
                      aria-label='Download'
                    >
                      <SaveAlt />
                    </IconButton> : null
                }
                
                <IconButton
                  onClick={this.onCloseClick}
                  aria-label='Close'
                >
                  <ClearIcon />
                </IconButton>
              </div>
            }
          />
          <CardContent className={'card-content'}>
            {properties}
            {inputElements}
            { this.state.loading ? <CircularProgress className='loading-spinner'/> : null}
          </CardContent>
          <CardActions className={'selection-pane-card-actions'}>
            <div key='first_row_buttons'>
              {firstRowButtons}
            </div>
            <div key='second_row_buttons' style={ { marginLeft: '0px' }}>
              {secondRowButtons}
            </div>
          </CardActions>
        </Card>
      </div>     
    );
  }
}

export default SelectionPane;
