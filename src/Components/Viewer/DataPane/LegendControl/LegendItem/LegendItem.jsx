import React from 'react';

import Button from '@material-ui/core/Button';
import Collapse from '@material-ui/core/Collapse';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';

import GroasisUtility from '../../../GroasisUtility';

import './LegendItem.css';

class LegendItem extends React.Component {
	constructor(props, context) {
    super(props, context);

    this.state = {
      open: false,
    };
  }

	render = () => {
		let unit = GroasisUtility.getUnit(this.props.unit)
		console.log(unit)
		return <div className='legendItemContainer'>
			<Typography>
				{this.props.selectedLayer}
				{unit.value === null ? ' (' + unit.unit + ')' : null}
			</Typography>
			<div className='colorContainer'>
			{
				this.props.colors.map(step => {
					if(step['@label'] !== 'NODATA')
					{
						return <Tooltip title={unit.value !== null && unit.value !== 0 ? (step['@label'] / unit.value) + unit.unit : step['@label']} key={this.props.selectedLayer + '_legendStep_' + step['@label']}>
							<div className='step' style={{backgroundColor: step['@color']}}></div>
						</Tooltip>
					}
				})
			}
			</div>
			{
				unit.value !== null && unit.value !== 0
				? <div className='labelContainer'>
					<div className='first'>{this.props.colors[1]['@label'] / unit.value}{unit.unit}</div>
					<div className='middle'>{this.props.colors[Math.round((this.props.colors.length - 1) / 2)]['@label'] / unit.value}{unit.unit}</div>
					<div className='last'>{this.props.colors[this.props.colors.length - 1]['@label'] / unit.value}{unit.unit}</div>
				</div>
				: <div className='labelContainer'>
					<div className='first'>{this.props.colors[1]['@label']}</div>
					<div className='middle'>{this.props.colors[Math.round((this.props.colors.length - 1) / 2)]['@label']}</div>
					<div className='last'>{this.props.colors[this.props.colors.length - 1]['@label']}</div>
				</div>
			}
			{
				this.props.info
				? <React.Fragment>
						<Collapse in={this.state.open}>
							<Typography gutterBottom>
								{this.props.info}
							</Typography>
						</Collapse>
						<Button color='primary' onClick={() => {this.setState({open: !this.state.open})}}>{this.state.open ? 'Close info' : 'More info'}</Button>
					</React.Fragment>
				: null
			}
		</div>
	}
}

export default LegendItem;