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
import DataTable from './DataTabel';

const IGNORE_COLUMNS = [
  'timestamp',
  'area',
  'date_from',
  'date_to',
  'cloud_cover',
  'precipitation',
  'min temp',
  'max temp',
  'tileX',
  'tileY',
  'zoom',
];

class AltitudeInfo extends PureComponent {

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

    if (element.type === ViewerUtility.standardTileLayerType)
    {
      body = {
        mapId: this.props.map.maps.find(x => x.dataSource.id === "bcf28bab-33e2-4259-a64f-466368efdc8d").id,
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
        geometry: element.feature.originalGeometry ? element.feature.originalGeometry : element.feature.geometry,
      };

      body = {
        mapId: this.props.map.maps.find(x => x.dataSource.id === "bcf28bab-33e2-4259-a64f-466368efdc8d").id,
        dataType: ViewerUtility.dataType.meanMeasurement,
        type: ViewerUtility.customPolygonTileLayerType,
        element: treefeature
      };

      url = '/data/timestamps';
    }


    let data = {};

    ApiManager.post(url, body, this.props.user)
      .then(result => {
        console.log(result)
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
        data.parsed = result;

        data.formatted = [['Type', 'Value']];

        data.parsed.meta.fields.forEach(x => {
          let ignore = IGNORE_COLUMNS.find(y => x.includes(y));

          if (!ignore && x !== 'no data') {
            if (x === 'slope')
            {
              data.formatted.push([x, Math.round(  Math.atan(1/data.parsed.data[0][x]) * 180 / Math.PI).toString()  + ' degrees' ] )
            }
            else
            {
              data.formatted.push([x, data.parsed.data[0][x].toString() + ' meter']);
            }
          }

          if(x === 'no data')
          {
            data.formatted = [];
          }
        });

        this.setState({ data: data, loading: false });
      })
      .catch(err => {
        alert('An error occurred while fetching data.');
        console.error(err)
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

  render() {
    let dataElement = null;
    let actionElement = null;

    if (this.state.loading) {
      dataElement = <CircularProgress className='loading-spinner'/>;
    }
    else if (this.state.data) {
      dataElement = (
        <DataTable
          data={this.state.data.formatted}
        />
      );

      actionElement = (
        <IconButton
          onClick={() => this.props.onDownloadData(this.state.data, 'altitude')}
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
                Altitude
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

export default AltitudeInfo;
