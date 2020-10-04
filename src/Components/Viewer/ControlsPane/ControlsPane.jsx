import React, { PureComponent } from 'react';

import FilterControl from './FilterControl/FilterControl';
import PolygonLayersControl from './PolygonLayersControl/PolygonLayersControl';
import TileLayersControl from './TileLayersControl/TileLayersControl';
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

    this.polygonLayersControl = React.createRef();
    this.standardTileLayersControl = React.createRef();
    this.filterControl = React.createRef();

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

    let allLayers = [...this.tileLayers, ...this.standardTileLayers, ...this.polygonLayers];

    this.props.onLayersChange(allLayers);
  }

  refreshLayers = () => {
    let allLayers = this.tileLayers;
    allLayers = allLayers.concat(this.standardTileLayers, this.polygonLayers);

    this.props.onLayersChange(allLayers);
  }

  goToDataPaneHome = () => {
    if(this.props.dataPaneRef && this.props.dataPaneRef.current)
    {
      this.props.dataPaneRef.current.goToHome();
    }
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
          mode={this.props.mode}
          openPane={() => {this.props.openPane('data_pane', false, this.goToDataPaneHome)}}
        />

        <PolygonLayersControl
          mode={this.props.mode}
          ref={this.polygonLayersControl}
          leafletMap={this.props.leafletMap}
          user={this.props.user}
          map={this.props.map}
          leafletMapViewport={this.props.leafletMapViewport}
          timestampRange={this.props.timestampRange}
          selectedLayers={this.props.selectedLayers}
          onSelectedLayersChange={this.props.onSelectedLayersChange}
          onLayersChange={(layers) => this.onLayersChange(ViewerUtility.polygonLayerType, layers)}
          onFeatureClick={this.props.onFeatureClick}
          markerSize={this.props.markerSize}
          groasisMaps={this.props.groasisMaps}
          mode={this.props.mode}
          onWatchlistClick={this.props.onWatchlistClick}
          selectedPlantingSite={this.props.selectedPlantingSite}
          selectedPlantingLine={this.props.selectedPlantingLine}
        />

        {/* <StandardTileLayersControl
          ref={this.standardTileLayersControl}
          user={this.props.user}
          map={this.state.referenceMap}
          leafletMapViewport={this.props.leafletMapViewport}
          timestampRange={this.props.timestampRange}
          override={this.props.override}
          onLayersChange={(layers) => this.onLayersChange(ViewerUtility.standardTileLayerType, layers)}
          onFeatureClick={(feature) => this.props.onFeatureClick(ViewerUtility.standardTileLayerType, feature, true)}
        /> */}

        {
          this.props.mode !== ViewerUtility.identificationMode || (this.props.map && this.props.map.type === 'area') ? <FilterControl
          mode={this.props.mode}
          ref={this.filterControl}
          user={this.props.user}
          map={this.props.map}
          leafletMapViewport={this.props.leafletMapViewport}
          timestampRange={this.props.timestampRange}
          override={this.props.override}
          onLayersChange={(layers) => this.onLayersChange(ViewerUtility.standardTileLayerType, layers)}
          onFeatureClick={(feature) => this.props.onFeatureClick(ViewerUtility.standardTileLayerType, feature, true)}
          key={'FilterControl_' + this.props.mode !== ViewerUtility.identificationMode || (this.props.map && this.props.map.type === 'area')}
        /> : null
      }
      </div>
    );
  }
}

export default ControlsPane;
