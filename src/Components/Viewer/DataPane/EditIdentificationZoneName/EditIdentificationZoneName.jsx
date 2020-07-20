import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';

import './EditIdentificationZoneName.css';

import GroasisUtility from '../../GroasisUtility';

import ApiManager from '../../../../ApiManager';

class EditIdentificationZoneName extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      loading: false,

      newName: this.props.map.info && this.props.map.info.displayName ? this.props.map.info.displayName : this.props.map.name,
    };
  }

  onSubmit = () => {
    if (this.state.newName.length > 0)
    {
      this.setState({ loading: true }, () => { this.submitName() });
    }
    else
    {
      this.setState({error: 'Name is empty'})
    }
  }


  submitName = () => {
    let info = this.props.map.info ? this.props.map.info : {};
    info.displayName = this.state.newName;

    let body = {
      mapId: this.props.map.id,
      mapInfo: info
    };

    ApiManager.post('/settings/projects/addMapInfo', body, this.props.user)
    .then(() => {
      this.props.map.info = info;
      this.setState({loading: false}, () => {this.setHome()});
    })
    .catch(err => {
      console.error(err);
      this.setState({ loading: false });
    });
  }

  onNameChange = (e) => {
    this.setState({newName: e.target.value, error: null})
  }

  render() {
    if (this.props.home || !this.props.map) {
      return null;
    }

    console.log(this.props.map)

    return (<Card className='data-pane-card editIdentificationZoneName'>
      <CardHeader
        className='data-pane-title-header'
        title={
          <Typography variant="h6" component="h2">
            Edit Name
          </Typography>
        }
      />
      <CardContent>
      {
        this.state.loading
        ? <CircularProgress className='loading-spinner'/>
        : <React.Fragment>
            <TextField
              label='New name'
              value={this.state.newName}
              onChange={this.onNameChange}
              fullWidth
              disabled={this.state.loading}
              error={this.state.error}
              helperText={this.state.error}
            />
            <Button
              variant='contained'
              color='primary'
              onClick={this.onSubmit}
              disabled={this.state.loading}
            >
              Submit
            </Button>
          </React.Fragment>
      }
      </CardContent>
    </Card>);
  }
}



export default EditIdentificationZoneName;
