import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import LegendItem from './LegendItem/LegendItem';

import GroasisUtility from '../../GroasisUtility';

import './LegendControl.css';

const LAYERS = {
  [GroasisUtility.layers.tile.organic]: 'soc_0-5cm_mean',
  [GroasisUtility.layers.tile.clay]: 'clay_0-5cm_mean',
  [GroasisUtility.layers.tile.sand]: 'sand_0-5cm_mean',
  [GroasisUtility.layers.tile.coarse]: 'cfvo_0-5cm_mean',
  [GroasisUtility.layers.tile.ph]: 'phh2o_0-5cm_mean',
}

class LegendControl extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      layerData: {},
    };
  }

  async componentDidMount() {
    this.getData();
  }

  componentDidUpdate(prevProps) {
    if(this.props.selectedLayers.image_tile.join('_') !== prevProps.selectedLayers.image_tile.join('_'))
    {
      this.getData();
    }
  }

  getData = async () => {
    let layers = this.props.selectedLayers.image_tile;
    let dataPromises = [];

    for (let i = 0; i < layers.length; i++) {
      let url = this.getUrl(layers[i]);
      if(!this.state.layerData[layers[i]] && url)
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
    }

    let gottenData = await Promise.all(dataPromises)
    .then(results => {
      let returnData = {};
      for (let i = 0; i < results.length; i++)
      {
        let x = results[i];
        let name = this.getName(x.StyledLayerDescriptor.NamedLayer.Name);
        let colors = x.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle.Rule.RasterSymbolizer.ColorMap.ColorMapEntry;
        let unit = x.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle.Rule.RasterSymbolizer.Geometry.PropertyName.split(' - ')[0];
        returnData[name] = {colors: colors, unit: unit};
      }

      return returnData;
    })
    .catch(err => console.error(err));

    let layerData = {...this.state.layerData, ...gottenData};

    this.setState({layerData: layerData})
  }

  createLegendElement = () => {

  }

  getName = (type) => {
    return Object.keys(LAYERS).find(key => LAYERS[key] === type)
  }

  getUrl = (type) => {
    if (LAYERS[type])
    {
      return 'https://maps.isric.org/sld/' + LAYERS[type] + '.json';
    }
    else
    {
      return null
    }
  }

  render() {
    let legendItems = [];

    if(this.props.selectedLayers)
    {
      for (let i = 0; i < this.props.selectedLayers.image_tile.length; i++)
      {
        let selectedLayer = this.props.selectedLayers.image_tile[i];
        if (this.state.layerData[selectedLayer])
        {
          legendItems.push(<LegendItem key={'legendItem_' + selectedLayer.replace(' ', '-')} selectedLayer={selectedLayer} colors={this.state.layerData[selectedLayer].colors} unit={this.state.layerData[selectedLayer].unit}/>);
        }
      }
    }

    return (
      legendItems.length > 0 ? <Card className='data-pane-card'>
        <CardHeader
          className='material-card-header'
          title={<Typography variant="h6" component="h2" className='no-text-transform'>Legend</Typography>}
        />
        <CardContent className='legend-content'>
          {legendItems}
        </CardContent>
      </Card> : null
    )
  }
}

export default LegendControl;
