import React, { PureComponent } from 'react';

import {
  Card,
  Button,
  CardHeader,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  CircularProgress
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import SaveAlt from '@material-ui/icons/SaveAlt';

import ViewerUtility from '../ViewerUtility';
import GroasisUtility from '../GroasisUtility';

import ApiManager from '../../../ApiManager';

import AnnotatePane from '../AnnotatePane/AnnotatePane';

import './SelectionPane.css';

const DELETE_CUSTOM_POLYGON_ACTION = 'delete_custom_polygon';
const ANNOTATE_ACTION = 'annotate';

class SelectionPane extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      isOpen: false,
      loading: false
    };
  }

  componentDidUpdate(prevProps) {
    if (!this.props.element) {
      this.setState({ isOpen: false });
    }
    else if (prevProps.element !== this.props.element) {
      this.setState({ isOpen: true });
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

    let nameComponents = [this.props.map.refenceMap.name];

    if (type === ViewerUtility.standardTileLayerType) {
      nameComponents.push(
        'tile',
        feature.properties.tileX,
        feature.properties.tileY,
        feature.properties.zoom
      );
    }
    else if (type === ViewerUtility.polygonLayerType) {
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
        variant='outlined'
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
          onClick={this.props.onSelectMap}
        >
          {'GO'}
        </Button>
      ];
      title = element.feature.properties[GroasisUtility.subatlasProperty].toUpperCase();
    }
    else if (element.type !== ViewerUtility.drawnPolygonLayerType) {
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

    let properties = [];

    let selectionPaneClass = 'selection-pane';

    for (let property in elementProperties) {
      let propertyValue = elementProperties[property];

      if (property[0] === '_') {
        continue;
      }

      if (element.type === ViewerUtility.drawnPolygonLayerType && property === 'id') {
        continue;
      }
      if (element.type === ViewerUtility.customPolygonTileLayerType
        && property === ViewerUtility.isPrivateProperty) {
        if (propertyValue === true) {
          selectionPaneClass += ' selection-pane-private';
        }
        continue;
      }

      if (elementProperties.hasOwnProperty(property)) {
        properties.push((
          <div key={property}>
            {`${property}: ${propertyValue}`}
          </div>
        ))
      }
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
                <Typography variant="h6" component="h2" className='no-text-transform'>
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
            { this.state.loading ? <CircularProgress className='loading-spinner'/> : null}
          </CardContent>
          <CardActions className={'selection-pane-card-actions'}>
            <div key='first_row_buttons'>
              {firstRowButtons}
            </div>
            <div key='secont_row_buttons' style={ {marginLeft: '0px' }}>
              {secondRowButtons}
            </div>
          </CardActions>
        </Card>
      </div>     
    );
  }
}

export default SelectionPane;
