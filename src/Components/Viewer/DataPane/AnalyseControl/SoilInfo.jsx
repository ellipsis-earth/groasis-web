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

import GroasisUtility from '../../GroasisUtility';
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
  'fine earth'
];

class SoilInfo extends PureComponent {

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
        mapId: this.props.map.maps.find(x => x.dataSource.id === "ce6650f0-91b8-481c-bc17-7a38f12658a1").id,
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

      body = {
        mapId: this.props.map.maps.find(x => x.dataSource.id === "ce6650f0-91b8-481c-bc17-7a38f12658a1").id,
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
      .then(async result => {
        data.parsed = result;

        let header = ['Type', 'Value'];
        let depths = {};

        let soilData = this.props.map.metadata && this.props.map.metadata.soilLayers ? this.props.map.metadata.soilLayers : {};

        for (let i = 0; i < data.parsed.meta.fields.length; i++) {
          let x = data.parsed.meta.fields[i];
          let ignore = IGNORE_COLUMNS.find(y => x.includes(y));

          if (!ignore && x !== 'no data') {
            let cleanedName = x;

            let unit = null;

            let name = Object.keys(soilData).find(y => y === GroasisUtility.getGroasisNameFromAnalyse(x));
            if (!name)
            {
              let gottenData = await this.getSoilLayerData(x);
              soilData = {...soilData, ...gottenData};
              name = Object.keys(soilData).find(y => y === GroasisUtility.getGroasisNameFromAnalyse(x, true));
            }

            let units = GroasisUtility.getUnit(soilData[name].unit);

            if (x.includes('0.05'))
            {
              if (!x.includes('0.05m'))
              {
                cleanedName = x + 'm';
              }
            }

            if(x.includes('0m'))
            {
              cleanedName = x.replace('0m', '0.00m')
            }

            let depth = cleanedName.split(' ');
            depth = depth[depth.length - 1].replace('m', '');
            let parsedName = ViewerUtility.capitalize(cleanedName.split(' ').slice(0, -1).join(' '));

            let pushData = [];
            if (units && units.value !== 0)
            {
              pushData = [name, Math.round((data.parsed.data[0][x] / units.value) * 100 + Number.EPSILON) / 100 + units.unit];
            }
            else
            {
              console.log(name, data.parsed.data[0])
            }

            if (depths[depth])
            {
              depths[depth].push(pushData)
            }
            else
            {
              depths[depth] = [header, pushData]
            }
          }
        }

        data.formatted = Object.keys(depths).map(x => {return {depth: parseFloat(x), data: depths[x]}});
        data.formatted.sort((a,b) => a['depth'] < b['depth'] ? -1 : (a['depth'] > b['depth']) ? 1 : 0);

        this.setState({ data: data, loading: false });
      })
      .catch(err => {
        alert('An error occurred while fetching data.');
        console.error(err);
        this.setState({ data: null, loading: false });
      });
  }

  getSoilLayerData = async (layerName) => {
    let dataPromises = [];
    let url = GroasisUtility.getSoilUrl(GroasisUtility.getGroasisNameFromAnalyse(layerName));

    if(url)
    {
      dataPromises.push(fetch(url, {
        method: 'GET'
      })
      .then(result => {
        if (result.status === 200 && result.ok)
        {
          return result.json()
        }
      }))
    }

    let gottenData = await Promise.all(dataPromises)
    .then(results => {
      let returnData = {};
      for (let i = 0; i < results.length; i++)
      {
        let x = results[i];
        let name = GroasisUtility.getSoilName(x.StyledLayerDescriptor.NamedLayer.Name);
        let colors = x.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle.Rule.RasterSymbolizer.ColorMap.ColorMapEntry;
        let unit = x.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle.Rule.RasterSymbolizer.Geometry.PropertyName.split(' - ')[0];
        returnData[name] = {colors: colors, unit: unit};
      }

      return returnData;
    })
    .catch(err => console.error(err));

    return gottenData;
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

    if(this.state.data && this.state.data.formatted)
    {
      dataElement = this.state.data.formatted.map(x => <div className='soilDataTableContainer' key={'soilDataTableContainer_' + x.depth}>
        <Typography color='primary'>Soil values at depth of {x.depth}cm</Typography>
        <DataTable
          data={x.data}
          maxMask={this.props.maxMask}
        />
      </div>)
    }

    actionElement = (
      <IconButton
        onClick={() => this.props.onDownloadData(this.state.data, 'soil')}
        aria-label='Download data'
      >
        <SaveAlt />
      </IconButton>
    );

    return (
      <div>
        <Card className='data-pane-card'>
          <CardHeader
            title={
              <Typography variant='h6' component='h2' className='no-text-transform'>
                Soil
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
            {
              dataElement && dataElement.length > 0
              ? dataElement
              : (dataElement && dataElement.length === 0 ? <Typography align='center'>no data</Typography> : <CircularProgress className='loading-spinner'/>)
            }
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

export default SoilInfo;
