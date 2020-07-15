import React, { PureComponent} from 'react';
import moment from 'moment';

import {
  VictoryScatter,
  VictoryLine,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryLabel,
  VictoryTooltip,
  createContainer
} from 'victory';

import Checkbox from '@material-ui/core/Checkbox';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import './react-vis-style.css';
import './LineChart.css';

import ViewerUtility from '../../../ViewerUtility';
import Utility from '../../../../../Utility';

const VictoryZoomVoronoiContainer = createContainer("zoom", "voronoi");

const NO_DATA_RESULT = 'no data\n';
const DATE_COLUMN_NAME = 'date_to';
const AREA_COLUMN_NAME = 'area';

/*const CLOUD_COVER_COLUMN_INFO = {
  name: 'cloud_cover',
  color: 'bababaff'
};*/

export class LineChart extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      data: null,
      checkedSeries: []
    };
  };

  componentWillMount = () => {
    let columnInfo = this.getColumnInfo();
    let checkedSeries = [columnInfo[0].name];
    this.setState({
      columnInfo: columnInfo,
      checkedSeries: checkedSeries
    }, this.prepareGraph);
  }

  componentDidUpdate(prevProps) {
    let differentData = this.props.data !== prevProps.data;
    let differentType = this.props.type !== prevProps.type;
    let differentMaxMask = this.props.maxMask !== prevProps.maxMask;

    if (differentData || differentType) {
      let columnInfo = this.getColumnInfo();
      let checkedSeries = [columnInfo[0].name];
      this.setState({
        columnInfo: columnInfo,
        checkedSeries: checkedSeries
      }, this.prepareGraph);
    }
    else if (differentMaxMask) {
      this.prepareGraph();
    }
  }

  getColumnInfo = () => {
    let type = this.props.type;

    let isMeasurements = type === ViewerUtility.dataGraphType.measurements;

    let columnInfo = null;

    if (!isMeasurements) {
      let mapClasses = getUniqueLabels(this.props.map.classes, 'classes');
      columnInfo = mapClasses.filter(x => x.name !== ViewerUtility.specialClassName.noClass && x.name !== ViewerUtility.specialClassName.outside_area);
    }
    else if (type === ViewerUtility.dataGraphType.measurements) {
      columnInfo = getUniqueLabels(this.props.map.measurements, 'measurements');
    }
    else {
      return null;
    }

    let adjustedColumnInfo = [];
    for (let i = 0; i < columnInfo.length; i++) {

      let color = columnInfo[i].color;

      if (color.includes('ffffff')) {
        color = 'bababaff';
      }

      adjustedColumnInfo.push({
        name: columnInfo[i].name,
        color: color
      });
    }

    /*if (isMeasurements) {
      adjustedColumnInfo.push(CLOUD_COVER_COLUMN_INFO);
    }*/

    return adjustedColumnInfo;
  }

  prepareGraph = () => {
    let data = this.props.data;
    let type = this.props.type;

    if (!data || !type) {
      return null;
    }

    let columnInfo = this.state.columnInfo;
    let checkedSeries = this.state.checkedSeries;

    columnInfo = columnInfo.filter(x => checkedSeries.find(y => y === x.name) || x.name === ViewerUtility.specialClassName.mask);
    let isMeasurements = type === ViewerUtility.dataGraphType.measurements;
    let parsedData = data.parsed;


    if (data.raw === NO_DATA_RESULT || !parsedData || parsedData.data.length === 0) {
      return null;
    }

    let filteredColumnNames = parsedData.meta.fields.filter(
      x => columnInfo.find(y => y.name === x)
    );

    let series = [];
    let seriesData = [];
    let dates = [];

    let totalValue = null;

    for (let i = 0; i < filteredColumnNames.length; i++ ) {

      let columnName = filteredColumnNames[i];

      let singleSeriesData = [];

      for (let x = 0; x < parsedData.data.length; x++) {
        let row = parsedData.data[x];

        if(row)
        {
          if (!totalValue) {
            totalValue = parseFloat(row[AREA_COLUMN_NAME]);
          }


          let value = row[columnName];
          let date = moment(row[DATE_COLUMN_NAME]).unix() * 1000;

          if (!isMeasurements && columnName === ViewerUtility.specialClassName.mask &&
            row[ViewerUtility.specialClassName.outside_area]) {
            value += row[ViewerUtility.specialClassName.outside_area];
          }

          singleSeriesData.push({
            x: date,
            y: value,
            label: `date: ${moment(date).format('YYYY-MM-DD')} \n ${columnName}: ${value}`
          });

          if (!dates.includes(date)) {
            dates.push(date);
          }
        }
      }

      let color = `#${columnInfo.find(y => y.name === columnName).color}`;

      seriesData.push({
        name: columnName,
        color: color,
        data: singleSeriesData
      });
    }

    for (let i = 0; i < dates.length; i++) {
      let date = dates[i];

      let maskValue = 0;

      for (let y = 0; y < seriesData.length; y++) {
        let singleSeriesData = seriesData[y];

        let dateData = singleSeriesData.data.find(x => x.x === date);

        if (singleSeriesData.name === ViewerUtility.specialClassName.mask ||
          singleSeriesData.name === ViewerUtility.specialClassName.cloudCover) {
          maskValue = dateData.y
        }
      }

      let maxMask = this.props.maxMask;

      if (totalValue > 0 && (maskValue / totalValue) > maxMask) {
        for (let y = 0; y < seriesData.length; y++) {
          let singleSeriesData = seriesData[y];
          singleSeriesData.data = singleSeriesData.data.filter(x => x.x !== date);
        }
      }
    }

    for (let i = 0; i < seriesData.length; i++) {
      let singleSeriesData = seriesData[i];

      if (!checkedSeries.includes(singleSeriesData.name)) {
        continue;
      }

      let elements = [
        <VictoryScatter
          style={{ data: { fill: singleSeriesData.color } }}
          size={5}
          data={singleSeriesData.data}
          labelComponent={
            <VictoryTooltip
              flyoutStyle={{ stroke: '#026464' }}
            />}
        />,
        <VictoryLine
          style={{
            data: { stroke: singleSeriesData.color, strokeWidth: 2, strokeLinecap: 'round' }}
          }
          data={singleSeriesData.data}
          labelComponent={<VictoryLabel text={''}/>}
        />
      ];

      series.push(elements);
    }

    this.setState({ graphElements: series });
  }

  onSeriesCheck = (e) => {
    let seriesName = e.target.value;
    let checked = e.target.checked;

    let checkedSeries = [...this.state.checkedSeries];

    if (checked) {
      if (!checkedSeries.includes(seriesName)) {
        checkedSeries.push(seriesName);
      }
    }
    else {
      if (checkedSeries.length > 1) {
        checkedSeries = Utility.arrayRemove(checkedSeries, seriesName);
      }
    }

    this.setState({ checkedSeries: checkedSeries }, this.prepareGraph);
  }

  render() {
    let graphElements = this.state.graphElements;

    let chart = null;

    if (!graphElements || graphElements.length === 0) {
      chart = (
        <div>
          No data
        </div>
      );
    }

    chart = (
      <VictoryChart
        key={graphElements}
        theme={VictoryTheme.material}
        scale={{ x: 'time' }}
        containerComponent={<VictoryZoomVoronoiContainer radius={12} zoomDimension={'x'}/>}
      >
        {graphElements}
        <VictoryAxis
          tickLabelComponent={
            <VictoryLabel
              angle={-35}
              dx={-32}
              dy={-10}
            />
          }
          tickFormat={(x) => { return moment(x).format('YYYY-MM-DD'); }}
          tickCount={4}
        />
        <VictoryAxis
          dependentAxis
          tickLabelComponent={
            <VictoryLabel
              // style={{ fontSize: '16px' }}
            />
          }
        />
      </VictoryChart>
    );

    let columnInfo = this.state.columnInfo;
    let checkboxes = [];
    for (let i = 0; i < columnInfo.length; i++) {
      let seriesInfo = columnInfo[i];

      checkboxes.push(<ListItem dense disableGutters key={seriesInfo.name} className='graph-legend'>
        <ListItemIcon>
          <Checkbox
            key={seriesInfo.name}
            color='primary'
            tabIndex={-1}
            disableRipple
            value={seriesInfo.name}
            name={seriesInfo.name}
            onChange={this.onSeriesCheck}
            checked={this.state.checkedSeries.includes(seriesInfo.name)}
          />
        </ListItemIcon>
        <ListItemText primary={
          <React.Fragment>
            <div className='legend-color' style={{ backgroundColor: `#${seriesInfo.color}`}}></div>
            <span className='legend-label legend-label-graph'>{seriesInfo.name}</span>
          </React.Fragment>} />
        </ListItem>
      );
    }

    return (
      <div>
        {chart}
        <List dense>
          {checkboxes}
        </List>
      </div>
    );
  }
}

function getUniqueLabels(timestampLabels, property) {
  let uniqueLabels = [];

  for (let i = 0; i < timestampLabels.length; i++) {
    let timestamp = timestampLabels[i];

    for (let x = 0; x < timestamp[property].length; x++) {
      let label = timestamp[property][x];

      let uniqueLabel = uniqueLabels.find(y => y.name === label.name);

      if (!uniqueLabel) {
        uniqueLabels.push(label);
      }
    }
  }

  return uniqueLabels;
}

export default LineChart;
