import React, { PureComponent } from 'react';
import Papa from 'papaparse';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import ViewerUtility from '../../ViewerUtility';

import ApiManager from '../../../../ApiManager';
import LineChart from './LineChart/LineChart';

class WeatherInfo extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      data: null,
      expanded: false,
      loading: false
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    if (this.props.element !== prevProps.element) {
      this.setState({ data: null });
      if (this.state.expanded) {
        this.getData();
      }
    }
  }

  getData = async () => {
    this.setState({ loading: true });

    let element = this.props.element;
    let body = {};

    let url = null;

    this.map = this.props.map.maps.find(x => x.dataSources[0].id === "ce6650f0-91b8-481c-bc17-7a38f12658a1");

    if (element.type === ViewerUtility.standardTileLayerType)
    {
      body = {
        mapId: this.map.id,
        dataType: ViewerUtility.dataType.meanMeasurement,
        type: ViewerUtility.standardTileLayerType,
        elementIds: [element.id],
        timestamp: 0,
      };

      url = '/data/ids';
    }
    else
    {
      let treefeature = {
        type: 'Feature',
        properties: {},
        geometry: element.feature.originalGeometry ? element.feature.originalGeometry : element.feature.geometry
      };

      let body = {
        mapId: this.map.id,
        dataType: ViewerUtility.dataType.meanMeasurement,
        type: ViewerUtility.customPolygonTileLayerType,
        element: treefeature
      };

      url = '/data/timestamps';
    }

    let data = {};

    ApiManager.post(url, body, this.props.user)
      .then(result => {
        data.raw = result;

        let parseFunc = async () => {
          let parsedData = Papa.parse(data.raw, {
            dynamicTyping: true,
            skipEmptyLines: true,
            header: true
          });

          return parsedData;
        };

        return parseFunc();
      })
      .then(result => {
        data.parsed = this.filterData(result);

        this.setState({ data: data, loading: false });
      })
      .catch(err => {
        console.error(err);
        alert('An error occurred while fetching data.');
        this.setState({ data: null, loading: false });
      });
  }

  onExpand = () => {
    let expanded = !this.state.expanded;

    if (expanded && !this.state.data && this.props.element) {
      this.getData();
    }

    this.setState({ expanded: expanded });
  }

  filterData = (data) => {
    let newData = [
      {date_to: '2019/01/01'},
      {date_to: '2019/02/01'},
      {date_to: '2019/03/01'},
      {date_to: '2019/04/01'},
      {date_to: '2019/05/01'},
      {date_to: '2019/06/01'},
      {date_to: '2019/07/01'},
      {date_to: '2019/08/01'},
      {date_to: '2019/09/01'},
      {date_to: '2019/10/01'},
      {date_to: '2019/11/01'},
      {date_to: '2019/12/01'}];

    for(let key in data.data[0])
    {
      if (key.includes('temp') || key.includes('precipitation'))
      {
        let monthNumber = this.stringToMonthNumber(key);

        if (key.includes('max'))
        {
          newData[monthNumber]['Max temp'] = data.data[0][key];
        }
        else if(key.includes('min'))
        {
          newData[monthNumber]['Min Temp'] = data.data[0][key]
        }
        else if(key.includes('precipitation'))
        {
          newData[monthNumber].precipitation = data.data[0][key]
        }
      }
    }

    data.data = newData;
    data.meta.fields = ["Max temp", "Min Temp", "precipitation", "date_to"];

    return data;
  }

  stringToMonthNumber = (input) => {
    if (input.includes('jan')){return 0}
    else if (input.includes('feb')){return 1}
    else if (input.includes('mar')){return 2}
    else if (input.includes('apr')){return 3}
    else if (input.includes('may')){return 4}
    else if (input.includes('jun')){return 5}
    else if (input.includes('jul')){return 6}
    else if (input.includes('aug')){return 7}
    else if (input.includes('sep')){return 8}
    else if (input.includes('oct')){return 9}
    else if (input.includes('nov')){return 10}
    else if (input.includes('dec')){return 11}
  }

  render() {
    let dataElement = null;
    let actionElement = null;

    if (this.state.loading) {
      dataElement = <CircularProgress className='loading-spinner'/>;
    }
    else if (this.state.data) {
      let map = JSON.parse(JSON.stringify(this.map));

      map.measurements[0].measurements = [{name: "Max temp", color: "FFC0CB"}, {name: "Min Temp", color: "87cef3"}, {name: "precipitation", color: "17a2b8"}]

      dataElement = (
        <LineChart
          map={map}
          data={this.state.data}
          type={ViewerUtility.dataGraphType.measurements}
          maxMask={this.props.maxMask}
        />
      );

      actionElement = (
        <IconButton
          onClick={() => this.props.onDownloadData(this.state.data, 'weather')}
          aria-label='Download data'
        >
          <SaveAlt />
        </IconButton>
      );
    }

    return (
      <div>
        <Card className='data-pane-card'>
          <CardHeader
            title={
              <Typography variant='h6' component='h2' className='no-text-transform'>
                Weather
              </Typography>
            }
            action={
              <IconButton
                className={this.state.expanded ? 'expand-icon expanded' : 'expand-icon'}
                onClick={this.onExpand}
              >
                <ExpandMoreIcon />
              </IconButton>
            }
          />
          <Collapse in={this.state.expanded}>
            <CardContent className='data-pane-card-content'>
              {dataElement}
            </CardContent>
            <CardActions className='analyse-card-actions'>
              {actionElement}
            </CardActions>
          </Collapse>
        </Card>
      </div>
    )
  }
}

export default WeatherInfo;
