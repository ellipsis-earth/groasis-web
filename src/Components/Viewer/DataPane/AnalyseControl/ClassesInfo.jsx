import React, { PureComponent } from 'react';
import Papa from 'papaparse';

import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  CircularProgress,
  Collapse,
  IconButton,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import ViewerUtility from '../../ViewerUtility';
import GroasisUtility from '../../GroasisUtility';
import DataPaneUtility from '../DataPaneUtility';

import ApiManager from '../../../../ApiManager';
import LineChart from './LineChart/LineChart';

class ClassesInfo extends PureComponent {

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

    let treefeature = {
      type: 'Feature',
      properties: {},
      geometry: element.feature.originalGeometry
    };

    let body = {
      mapId: this.props.map[GroasisUtility.types.highRes].id,
      dataType: ViewerUtility.dataType.class,
      type: ViewerUtility.customPolygonTileLayerType,
      element: treefeature
    };

    let data = {};

    ApiManager.post(`/data/timestamps`, body, this.props.user)
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
          map={this.props.map[GroasisUtility.types.highRes]}
          data={this.state.data}
          type={ViewerUtility.dataGraphType.classes}
          maxMask={this.props.maxMask}
        />
      );

      actionElement = ( 
        <IconButton
          onClick={() => this.props.onDownloadData(this.state.data, 'classes')}        
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
                Classes
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

export default ClassesInfo;
