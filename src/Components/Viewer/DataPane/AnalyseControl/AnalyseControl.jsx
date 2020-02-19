import React, { PureComponent } from 'react';
import {
  Card,
  CardContent,
  Slider
} from '@material-ui/core';

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
      maxMask: 0
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }

  onDownloadData = (data, type) => {
    let csvData = data.raw;

    let nameComponents = [this.props.map.subatlas];

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
    else if (element.type === ViewerUtility.treeElementType) {
      nameComponents.push(
        'tree',
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

    nameComponents.push(type);

    let fileName = nameComponents.join('_') + '.csv';

    ViewerUtility.download(fileName, csvData, 'text/csv');
  }

  render() {
    if (this.props.home || !this.props.element || (this.props.element.type !== ViewerUtility.treeElementType && this.props.element.type !== ViewerUtility.standardTileLayerType)) {
      return null;
    }

    let generalProps = {
      user: this.props.user,
      map: this.props.map,
      element: this.props.element,
      maxMask: this.state.maxMask,
      onDownloadData: this.onDownloadData
    };

    return (
      <div>
       {/* <Card className='data-pane-card'>
          <CardContent>
            <div>Max cloud cover: {Math.round(this.state.maxMask * 100)}%</div>
            <Slider
              step={0.01}
              value={this.state.maxMask}
              min={0}
              max={1}
              onChange={ (_, v) => { this.setState({ maxMask: v }); }}
            />
          </CardContent>
        </Card>*/}

        <SoilInfo {...generalProps} />
        <HistoricWeatherInfo {...generalProps} />
        <WeatherInfo {...generalProps} />
        {this.props.element.type === ViewerUtility.standardTileLayerType ? null : <ClassesInfo {...generalProps} />}
        <SpectralIndicesInfo {...generalProps} />
        <AltitudeInfo {...generalProps} />
      </div>
    )
  }
}

export default AnalyseControl;
