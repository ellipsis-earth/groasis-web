import React, { PureComponent} from 'react';
import moment from 'moment';
import Slider from '@material-ui/core/Slider';

import ViewerUtility from '../ViewerUtility';
import GroasisUtility from '../GroasisUtility';

import './TimestampSelector.css';

export class TimestampSelector extends PureComponent {
  constructor(props, context) {
    super(props, context)

    this.state = {
      range: false,
      start: 0,
      end: 0,
      dates: [0]
    };
  }

  componentDidUpdate(prevProps) {
    let diffMap = this.props.map !== prevProps.map && this.props.map;
    let diffLayers = this.props.selectedLayers !== prevProps.selectedLayers;

    let tileLayers = this.props.selectedLayers[ViewerUtility.tileLayerType];

    let timestampReferenceMap = null;

    if (tileLayers.includes(GroasisUtility.layers.tile.lowRes) || tileLayers.includes(GroasisUtility.layers.tile.lowResCir)) {
      timestampReferenceMap = this.props.map.maps.find(x => ["4c450c42-1bf6-11e9-96ea-f0038c0f0121", "48d31d14-8cdd-401e-84a0-42941ad19dd6"].includes(x.dataSource.id));
    }


    if (this.state.timestampReferenceMap !== timestampReferenceMap && timestampReferenceMap) {
      let timestamps = timestampReferenceMap.timestamps;
      let lastTimestamp = timestamps.length - 1;

      let dateFormat = 'YYYY-MM-DD';

      let dates = timestamps.map(x => moment(x.dateTo).format(dateFormat));

      this.setState({
        timestampReferenceMap: timestampReferenceMap,
        start: lastTimestamp,
        end: lastTimestamp,
        dates: dates
      });
    }
    else if ((prevProps.selectedLayers[ViewerUtility.tileLayerType].includes(GroasisUtility.layers.tile.lowRes) || prevProps.selectedLayers[ViewerUtility.tileLayerType].includes(GroasisUtility.layers.tile.lowResCir)) && (!tileLayers.includes(GroasisUtility.layers.tile.lowRes) && !tileLayers.includes(GroasisUtility.layers.tile.lowResCir))) {
      this.setState({
        range: false,
        start: 0,
        end: 0,
        dates: [0],
        timestampReferenceMap: null,
      });
    }
  }

  onSlide = (e, value) => {
    let timestampRange = {};

    if (!this.state.range) {
      let newIndex = value[0];
      if (this.state.end < value[1]) {
        newIndex = value[1];
      }

      timestampRange = {
        start: newIndex,
        end: newIndex
      };
    }
    else {
      timestampRange = {
        start: value[0],
        end: value[1]
      };
    }

    this.setState({ start: timestampRange.start, end: timestampRange.end });
    this.props.onSelectTimestamp(timestampRange);
  }

  onRangeToggleChange = (e) => {
    let timestampRange = {
      start: this.state.end,
      end: this.state.end
    };

    this.setState({
      start: timestampRange.end,
      end: timestampRange.end,
      range: e.target.checked
    });

    this.props.onSelectTimestamp(timestampRange);
  }

  render() {
    if (!this.props.map || (this.props.mode === ViewerUtility.identificationMode && this.state.dates.length < 2) || this.state.dates.length < 2) {
      return null;
    }

    let sliderValue = null;
    if (!this.state.range) {
      sliderValue = [this.state.end, this.state.end];
    }
    else {
      sliderValue = [this.state.start, this.state.end]
    }

    let dateText = null;
    if (this.props.map) {
      if (!this.state.range) {
        dateText = this.state.dates[this.state.end];
      }
      else {
        dateText = this.state.dates[this.state.start] + ' - ' + this.state.dates[this.state.end];
      }
    }

    return (
      <div className='timestamp-selector'>
        <div>
          Timestamps
          <React.Fragment> (<input type='checkbox' id='timestamp-range' onChange={this.onRangeToggleChange} checked={this.state.range}/> Range)</React.Fragment>
        </div>
        <Slider
          value={sliderValue}
          onChange={this.onSlide}
          marks
          step={1}
          min={0}
          max={this.state.dates.length - 1}
        />
        <div>{dateText}</div>
      </div>
    );
  }
}

export default TimestampSelector;
