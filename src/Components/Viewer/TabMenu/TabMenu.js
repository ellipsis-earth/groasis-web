import React, {Component} from 'react'
import { Button } from '@material-ui/core';

import './TabMenu.css';

export class TabMenu extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
    	control: this.props.panes.includes(this.props.CONTROL_PANE_NAME),
    	map: this.props.panes.includes(this.props.MAP_PANE_NAME),
    	data: this.props.panes.includes(this.props.DATA_PANE_NAME),
    };
  }

	render = () => {
		return (
			<div className='viewer-menu'>
				<Button
					variant='contained'
					onClick={() => this.props.openPane(this.props.CONTROL_PANE_NAME, true)}
					className={this.state.control ? 'menuButton active' : 'menuButton'}
				>
					Control
				</Button>
				<Button
					variant='contained'
					onClick={() => this.props.openPane(this.props.MAP_PANE_NAME, true)}
					className={this.state.map ? 'menuButton active' : 'menuButton'}
				>
					Map
				</Button>
				<Button
					variant='contained'
					onClick={() => this.props.openPane(this.props.DATA_PANE_NAME, true)}
					className={this.state.data ? 'menuButton active' : 'menuButton'}
				>
					Data
				</Button>
			</div>
		)
	}
}

export default TabMenu