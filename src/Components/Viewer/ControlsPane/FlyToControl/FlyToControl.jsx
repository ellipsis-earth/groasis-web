import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import Checkbox from '@material-ui/core/Checkbox';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';

import './FlyToControl.css';

import ApiManager from '../../../../ApiManager';

class FlyToControl extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      expanded: true,

      selectedFlyToType: ViewerUtility.flyToType.map,

      elementId: ''
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }

  onSelectFlyTo = (e) => {
    let elementIdReset = '';
    let type = e.target.value;

    if (type === ViewerUtility.flyToType.standardTile) {
      elementIdReset = {
        tileX: '',
        tileY: ''
      };
    }

    this.setState({
      selectedFlyToType: type,
      elementId: elementIdReset
    });
  }

  onExpandClick = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  onFlyTo = () => {
    let flyToInfo = {
      type: this.state.selectedFlyToType,
      elementId: this.state.elementId
    };

    // navigator.geolocation.getCurrentPosition(
    //   (position) => console.log(`${position.coords.longitude} ${position.coords.latitude}`),
    //   (err) => {
    //     console.warn(`Error ${err.code}: ${err.message}`);
    //     window.postMessage(`Error ${err.code}: ${err.message}`, '*');
    //     if (window.ReactNativeWebView) {
    //       window.ReactNativeWebView.postMessage(`Error ${err.code}: ${err.message}`);
    //     }
    //   },
    //   { enableHighAccuracy: true }
    // );

    this.props.onFlyTo(flyToInfo);
  }

  render() {

    if (!this.props.map) {
      return null;
    }

    let elementIdInput = null;
    let type = this.state.selectedFlyToType ;

    if (type === ViewerUtility.flyToType.standardTile) {
      elementIdInput = (
        <div>
          <TextField
            label={'X'}
            type='number'
            value={this.state.elementId.tileX}
            required={true}
            onChange={(e) => this.setState({
              elementId: {
                ...this.state.elementId,
                tileX: parseInt(e.target.value)
            }})}
          />
          <TextField
            label={'Y'}
            type='number'
            value={this.state.elementId.tileY}
            required={true}
            onChange={(e) => this.setState({
              elementId: {
                ...this.state.elementId,
                tileY: parseInt(e.target.value)
            }})}
          />
        </div>
      );
    }
    else if (type === ViewerUtility.flyToType.polygon) {
      elementIdInput = (
        <div>
          <TextField
            label={'Polygon id'}
            type='number'
            value={this.state.elementId}
            required={true}
            onChange={(e) => this.setState({ elementId: parseInt(e.target.value)})}
          />
        </div>
      );
    }


    return (
      <Card className='layers-control'>
        <CardHeader
          className='material-card-header'
          title={
            <Typography gutterBottom variant="h6" component="h2">
              {'Fly to'}
            </Typography>
          }
          action={
            <IconButton
              className={this.state.expanded ? 'expand-icon expanded' : 'expand-icon'}
              onClick={this.onExpandClick}
              aria-expanded={this.state.expanded}
              aria-label='Show'
            >
              <ExpandMoreIcon />
            </IconButton>
          }
        />
        <Collapse in={this.state.expanded}>
          <CardContent
            className={'card-content'}
          >
            <Select
              key='fly-to-type-selector'
              className='selector'
              onChange={this.onSelectFlyTo}
              value={this.state.selectedFlyToType}
            >
               <MenuItem value={ViewerUtility.flyToType.map}>Current map</MenuItem>
               <MenuItem value={ViewerUtility.flyToType.currentLocation}>My location</MenuItem>
               <MenuItem value={ViewerUtility.flyToType.standardTile}>Standard tile</MenuItem>
               <MenuItem value={ViewerUtility.flyToType.polygon}>Polygon</MenuItem>
            </Select>
            {elementIdInput}
          </CardContent>
          <CardActions>
            <Button
              variant='contained'
              color='primary'
              onClick={this.onFlyTo}
            >
              {'Fly to'}
            </Button>
          </CardActions>
        </Collapse>
      </Card>
    );
  }
}

export default FlyToControl;
