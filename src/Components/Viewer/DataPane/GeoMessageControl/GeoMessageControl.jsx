import React, { PureComponent } from 'react';

import ViewerUtility from '../../ViewerUtility';

import './GeoMessageControl.css';

import ElementGeoMessageControl from './ElementGeoMessageControl';
import WatchlistControl from './WachtlistControl';
import TreeGalleryControl from './TreeGalleryControl';

class GeoMessageControl extends PureComponent {
  constructor(props, context) {
    super(props, context);
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }

  render() {
  if (this.props.element.type === ViewerUtility.treeElementType) {
      return (
        <TreeGalleryControl
          user={this.props.user}
          map={this.props.map}
          timestampRange={this.props.timestampRange}
          geolocation={this.props.geolocation}
          element={this.props.element}
          jumpToMessage={this.props.jumpToMessage}
          home={this.props.home}
          onDataPaneAction={this.props.onDataPaneAction}
          onFlyTo={this.props.onFlyTo}
          onLayersChange={this.props.onLayersChange}
          onFeatureClick={this.props.onFeatureClick}
          onDeselect={this.props.onDeselect}
        />
      );
    }
    else {
      return (
        <ElementGeoMessageControl
          user={this.props.user}
          map={this.props.map}
          timestampRange={this.props.timestampRange}
          geolocation={this.props.geolocation}
          element={this.props.element}
          jumpToMessage={this.props.jumpToMessage}
          home={this.props.home}
          onDataPaneAction={this.props.onDataPaneAction}
          onFlyTo={this.props.onFlyTo}
          onLayersChange={this.props.onLayersChange}
          onFeatureClick={this.props.onFeatureClick}
          onDeselect={this.props.onDeselect}
        />
      );
    }
  }
}



export default GeoMessageControl;
