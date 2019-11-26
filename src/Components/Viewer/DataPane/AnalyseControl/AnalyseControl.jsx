import React, { PureComponent } from 'react';
import Papa from 'papaparse';
import LineChart from './LineChart/LineChart';

import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  CircularProgress,
  Slider,
  Select,
  MenuItem,
  Collapse,
  IconButton,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import ViewerUtility from '../../ViewerUtility';
import DataPaneUtility from '../DataPaneUtility';

import SoilInfo from './SoilInfo';
import HistoricWeatherInfo from './HistoricWeatherInfo';

import './AnalyseControl.css';
import ApiManager from '../../../../ApiManager';

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
    if (this.props.home) {
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
          map={this.props.map}
          element={this.props.element}
        />
        <HistoricWeatherInfo
          map={this.props.map}
          element={this.props.element}
        />
      </div>
    )
  }
}

export default AnalyseControl;
