import React from 'react';

import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';

import './LegendItem.css';

class LegendItem extends React.Component {
	render = () => {
		return <div className='legendItemContainer'>
			<Typography>{this.props.selectedLayer}  ({this.props.unit.split('(')[1]}</Typography>
			<div className='colorContainer'>
			{
				this.props.colors.map(step => {
					if(step['@label'] !== 'NODATA')
					{
						return <Tooltip title={step['@label']} key={this.props.selectedLayer + '_legendStep_' + step['@label']}>
							<div className='step' style={{backgroundColor: step['@color']}}></div>
						</Tooltip>
					}
				})
			}
			</div>
			<div className='labelContainer'>
				<div className='first'>{this.props.colors[1]['@label']}</div>
				<div className='middle'>{this.props.colors[Math.round((this.props.colors.length - 1) / 2)]['@label']}</div>
				<div className='last'>{this.props.colors[this.props.colors.length - 1]['@label']}</div>
			</div>
		</div>
	}
}

export default LegendItem;