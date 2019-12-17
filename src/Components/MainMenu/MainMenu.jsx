import React, { Component } from 'react';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Switch from '@material-ui/core/Switch';

import { ToggleButton } from '@material-ui/lab';

import { NavLink } from 'react-router-dom';

import { Navbar, Nav, NavItem } from 'react-bootstrap';

import './MainMenu.css';

const navKeys = {
  login: 'login'
}

export class MainMenu extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      expanded: false,
      hidden: false,
      navKey: 'home'
    };
  }

  componentDidMount = () => {
    this.checkUrl();
  }

  componentDidUpdate = () => {
    this.checkUrl();
  }

  checkUrl = () => {
    let url = window.location.href;

    try {
      for (let key in navKeys) {
        if (Object.prototype.hasOwnProperty.call(navKeys, key)) {
          let navKey = navKeys[key];

          if (url.includes(`/${navKey}`)) {
            if (this.state.navKey !== navKey) {
              this.setState({ navKey: navKey });
            }
            break;
          }
        }
      }
    }
    catch (err) {
      console.log(`Could not identify navkey from url: ${url}`);
      console.error(err);
    }
  }

  toggleMenu = (event) => {
    var x = document.getElementById('main-menu');
    if (x.className === '') {
      x.className = 'responsive';
    }
    else {
      x.className = '';
    }

    event.stopPropagation();
  }

  changeLanguage = (language) => {
    if (this.props.onLanguageChange) {
      this.props.onLanguageChange(language);
    }
  }

  onToggle = (expanded) => {
    this.setState({ expanded: expanded })
  }

  onNavItemClick = (key) => {
    this.setState({ navKey: key });
    this.onToggle(false);
  }

  onModeToggle = (e) => {
    let mode = parseInt(e.target.value);

    if (mode !== this.props.mode) {
      this.setState({expanded: false}, () => this.props.onModeChange(mode))
    }
  }

  onOpenAccounts = (input = 'default') => {
    if(input === false)
    {
      this.props.openAccounts(false); this.onNavItemClick('home')
    }
    else
    {
      this.setState({expanded: false}, () => this.props.openAccounts(input))
    }
  }

  render() {
    let displayStyle = {
        display: 'block'
    };

    if (this.state.hidden) {
        displayStyle.display = 'hidden';
    }

    let navItemClass = (navKey) => {
      // return navKey === this.state.navKey ? 'nav-item-active' : '';
      return navKey === this.state.navKey;
    }

    return (
      <div id='main-menu' style={displayStyle}>
        <Navbar
          className={this.state.expanded ? 'main-menu' : 'main-menu main-menu-collapsed'}
          variant='light'
          expand='md'
          expanded={this.state.expanded}
          onToggle={this.onToggle}
        >
          <Navbar.Brand>
            <NavLink exact to='/' className='main-menu-logo-item noselect' onClick={() => this.onOpenAccounts(false)}>
              <img className='main-menu-logo' src='/images/logos/groasis-tree-atlas-logo.svg' alt='Groasis Tree Altas'/>
            </NavLink>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse>
            <NavItem>
              <RadioGroup aria-label="mode" name="mode" value={this.props.mode} onChange={this.onModeToggle} row={!this.state.expanded} className="modeSwitch">
                <FormControlLabel
                  value={0}
                  control={<Radio color="primary" />}
                  label="Plan"
                  labelPlacement="end"
                />
                <FormControlLabel
                  value={1}
                  control={<Radio color="primary" />}
                  label="Plant"
                  labelPlacement="end"
                />
                <FormControlLabel
                  value={2}
                  control={<Radio color="primary" />}
                  label="View"
                  labelPlacement="end"
                />
              </RadioGroup>
            </NavItem>
            <NavItem>
              <ToggleButton selected={navItemClass(navKeys.login)} value={this.props.user ? this.props.user.username : 'Login'} onClick={this.onOpenAccounts} color='primary'>
                {this.props.user ? this.props.user.username : 'Login'}
              </ToggleButton>
            </NavItem>
          </Navbar.Collapse>
        </Navbar>
      </div>
    )
  }
}

export default MainMenu;
