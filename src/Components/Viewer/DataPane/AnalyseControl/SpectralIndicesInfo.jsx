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

class SpectralIndicesInfo extends PureComponent {

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

    this.map = this.props.map.maps.find(x => ["4c450c42-1bf6-11e9-96ea-f0038c0f0121", "48d31d14-8cdd-401e-84a0-42941ad19dd6"].includes(x.dataSource.id));
    let url = '/data/timestamps';

    if (element.type === ViewerUtility.standardTileLayerType)
    {
      body = {
        mapId: this.map.id,
        dataType: ViewerUtility.dataType.meanMeasurement,
        class: ViewerUtility.specialClassName.allClasses,
        type: ViewerUtility.standardTileLayerType,
        element: element.id,
      };
    }
    else
    {
      let treefeature = {
        type: 'Feature',
        properties: {},
        geometry: element.feature.originalGeometry ? element.feature.originalGeometry : element.feature.geometry
      };

      body = {
        mapId: this.map.id,
        dataType: ViewerUtility.dataType.meanMeasurement,
        class: ViewerUtility.specialClassName.allClasses,
        type: ViewerUtility.customPolygonTileLayerType,
        element: treefeature
      };
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
          console.log(parsedData)
          return parsedData;
        };

        return parseFunc();
      })
      .then(result => {
        data.parsed = result;

        this.setState({ data: data, loading: false });
      })
      .catch(err => {
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

  render() {
    let dataElement = null;
    let actionElement = null;

    if (this.state.loading) {
      dataElement = <CircularProgress className='loading-spinner'/>;
    }
    else if (this.state.data) {
      dataElement = (
        <LineChart
          map={this.map}
          data={this.state.data}
          type={ViewerUtility.dataGraphType.measurements}
          maxMask={this.props.maxMask}
        />
      );

      actionElement = (
        <IconButton
          onClick={() => this.props.onDownloadData(this.state.data, 'spectral_indices')}
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
                Indices
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

export default SpectralIndicesInfo;
