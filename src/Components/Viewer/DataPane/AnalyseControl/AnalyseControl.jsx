import React, { PureComponent } from 'react';

import ViewerUtility from '../../ViewerUtility';

import SoilInfo from './SoilInfo';
import HistoricWeatherInfo from './HistoricWeatherInfo';
import WeatherInfo from './WeatherInfo';
import ClassesInfo from './ClassesInfo';
import SpectralIndicesInfo from './SpectralIndicesInfo';
import AltitudeInfo from './AltitudeInfo';

import './AnalyseControl.css';

class AnalyseControl extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      maxMask: 1
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }

  onDownloadData = (isMeasurements) => {
    let csvData = null;

    if (!isMeasurements && this.state.classesData) {
      csvData = this.state.classesData.raw;
    }
    else if (this.state.measurementsData[this.state.selectedClass]) {
      csvData = this.state.measurementsData[this.state.selectedClass].raw;
    }

    let nameComponents = [this.props.map.name];

    let element = this.props.element;
    let elementProperties = element.feature.properties;

    if (element.type === ViewerUtility.standardTileLayerType) {
      nameComponents.push(
        'tile',
        elementProperties.tileX,
        elementProperties.tileY,
        elementProperties.zoom
      );
    }
    else if (element.type === ViewerUtility.polygonLayerType) {
      nameComponents.push(
        'polygon',
        elementProperties.id
      );
    }
    else if (element.type === ViewerUtility.customPolygonTileLayerType) {
      nameComponents.push(
        'customPolygon',
        elementProperties.id
      );
    }
    else if (element.type === ViewerUtility.drawnPolygonLayerType) {
      nameComponents.push(
        'drawnPolygon'
      );
    }

    if (!isMeasurements) {
      nameComponents.push('classes');
    }
    else {
      nameComponents.push(
        'measurements',
        this.state.selectedClass
      );
    }

    let fileName = nameComponents.join('_') + '.csv';

    ViewerUtility.download(fileName, csvData, 'text/csv');
  }

  render() {
    if (this.props.home || !this.props.element || this.props.element.type !== ViewerUtility.treeElementType) {
      return null;
    }

    return (
      <div>
        {/* <Card className='data-pane-card'>
          <CardContent>
            <div>{'Maximum allowed cloud cover'}: {Math.round(this.state.maxMask * 100)}%</div>
            <Slider
              step={0.01}
              value={this.state.maxMask}
              min={0}
              max={1}
              onChange={this.onMaxMaskChange}
            />
          </CardContent>
        </Card> */}

        <SoilInfo
          user={this.props.user}
          map={this.props.map}
          element={this.props.element}
        />
        <HistoricWeatherInfo
          user={this.props.user}
          map={this.props.map}
          element={this.props.element}
        />
        <WeatherInfo
          user={this.props.user}
          map={this.props.map}
          element={this.props.element}
        />
        <ClassesInfo
          user={this.props.user}
          map={this.props.map}
          element={this.props.element}
        />
        <SpectralIndicesInfo
          user={this.props.user}
          map={this.props.map}
          element={this.props.element}
        />
        <AltitudeInfo
          user={this.props.user}
          map={this.props.map}
          element={this.props.element}
        />
      </div>
    )
  }
}

export default AnalyseControl;
