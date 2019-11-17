import React, { PureComponent } from 'react';

import MapSelector from './MapSelector/MapSelector';
import FlyToControl from './FlyToControl/FlyToControl'
import TileLayersControl from './TileLayersControl/TileLayersControl';
import StandardTileLayersControl from './StandardTileLayersControl/StandardTileLayersControl';
import PolygonLayersControl from './PolygonLayersControl/PolygonLayersControl';
import ViewerUtility from '../ViewerUtility';

import './ControlsPane.css';

class ControlsPane extends PureComponent {

  tileLayers = []
  standardTileLayers = []
  polygonLayers = []

  standardTileLayersControl = null
  polygonLayersControl = null

  flyToBounds = null

  constructor(props, context) {
    super(props, context);

    this.standardTileLayersControl = React.createRef();
    this.polygonLayersControl = React.createRef();

    this.state = {
      map: null
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.override !== this.props.override) {
      this.onLayersChange(null, null);
    }
  }

  updatePolygons = () => {
    this.polygonLayersControl.current.refresh();
  }

  onSelectMap = (map) => {
    this.setState({ map: map }, () => this.props.onSelectMap(map));
  }

  onLayersChange = (type, layers) => {
    if (type === ViewerUtility.tileLayerType) {
      this.tileLayers = layers;
    }
    else if (type === ViewerUtility.standardTileLayerType) {
      this.standardTileLayers = layers
    }
    else if (type === ViewerUtility.polygonLayerType) {
      this.polygonLayers = layers;
    }

    let allLayers = this.tileLayers;
    if (!this.props.override) {
      allLayers = allLayers.concat(this.standardTileLayers, this.polygonLayers);
    }

    this.props.onLayersChange(allLayers);
  }

  render() {
    let style = {};
    if (!this.props.isOpen) {
      style = { display: 'none' };
    }

    return (
      <div className='viewer-pane controls-pane' style={style}>
        <TileLayersControl
          user={this.props.user}
          map={this.props.map}
          timestampRange={this.props.timestampRange}
          selectedLayers={this.props.selectedLayers}
          onSelectedLayersChange={this.props.onSelectedLayersChange}
          onLayersChange={(layers) => this.onLayersChange(ViewerUtility.tileLayerType, layers)}
        />

        {/* <PolygonLayersControl
          ref={this.polygonLayersControl}
          user={this.props.user}
          map={this.state.map}
          leafletMapViewport={this.props.leafletMapViewport}
          timestampRange={this.props.timestampRange}
          override={this.props.override}
          onLayersChange={(layers) => this.onLayersChange(ViewerUtility.polygonLayerType, layers)}
          onFeatureClick={(feature, hasAggregatedData) => this.props.onFeatureClick(ViewerUtility.polygonLayerType, feature, hasAggregatedData)}
          markerSize={this.props.markerSize}
        />

        <StandardTileLayersControl
          ref={this.standardTileLayersControl}
          user={this.props.user}
          map={this.state.referenceMap}
          leafletMapViewport={this.props.leafletMapViewport}
          timestampRange={this.props.timestampRange}
          override={this.props.override}
          onLayersChange={(layers) => this.onLayersChange(ViewerUtility.standardTileLayerType, layers)}
          onFeatureClick={(feature) => this.props.onFeatureClick(ViewerUtility.standardTileLayerType, feature, true)}
        /> */}
      </div>
    );
  }
}

export default ControlsPane;
