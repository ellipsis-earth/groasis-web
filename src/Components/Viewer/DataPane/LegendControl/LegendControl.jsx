import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import LegendItem from './LegendItem/LegendItem';
import LegendInfo from './LegendInfo';

import GroasisUtility from '../../GroasisUtility';

import './LegendControl.css';


class LegendControl extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      layerData: this.props.map && this.props.map.metadata && this.props.map.metadata.soilLayers ? this.props.map.metadata.soilLayers : {},
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

    if (this.props.map && this.props.map.metadata !== prevProps.metadata && this.props.map.metadata.soilLayers)
    {
      this.setState({layerData: this.props.map.metadata.soilLayers});
    }
  }

  getData = async () => {
    let layers = this.props.selectedLayers.image_tile;
    let dataPromises = [];

    for (let i = 0; i < layers.length; i++) {
      let url = GroasisUtility.getSoilUrl(layers[i]);
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
        let name = GroasisUtility.getSoilName(x.StyledLayerDescriptor.NamedLayer.Name);
        let colors = x.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle.Rule.RasterSymbolizer.ColorMap.ColorMapEntry;
        let unit = x.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle.Rule.RasterSymbolizer.Geometry.PropertyName.split(' - ')[0];
        returnData[name] = {colors: colors, unit: unit};
      }

      return returnData;
    })
    .catch(err => console.error(err));

    let layerData = {...this.state.layerData, ...gottenData};

    if (this.props.map && Object.keys(layerData).length !== 0)
    {
      if (!this.props.map.metadata)
      {
        this.props.map.metadata = {soilLayers: layerData}
      }
      else
      {
        this.props.map.metadata.soilLayers = layerData;
      }
      console.log(this.props.map.metadata);
    }

    this.setState({layerData: layerData})
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
          legendItems.push(<LegendItem key={'legendItem_' + selectedLayer.replace(' ', '-')} open={null} info={LegendInfo[selectedLayer]} selectedLayer={selectedLayer} colors={this.state.layerData[selectedLayer].colors} unit={this.state.layerData[selectedLayer].unit}/>);
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
