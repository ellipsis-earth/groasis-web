import React, { Component } from 'react';

import Button from '@material-ui/core/Button';
/*import { ToggleButton } from '@material-ui/lab';*/

import DownloadIcon from '@material-ui/icons/GetApp';

import { Navbar, NavItem } from 'react-bootstrap';

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
      navKey: 'home',
      width: -1,
    };
  }

  componentDidMount = () => {
    this.checkUrl();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate = () => {
    this.checkUrl();
  }

  componentWillUnmount(){
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    if (window.innerWidth !== this.state.width)
    {
      this.setState({width: window.innerWidth});
    }
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
      console.error(`Could not identify navkey from url: ${url}`);
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
    this.setState({ expanded: expanded})
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

    /*let navItemClass = (navKey) => {
      // return navKey === this.state.navKey ? 'nav-item-active' : '';
      return navKey === this.state.navKey;
    }*/

    let modeText = 'select mode';
    if(this.props.mode === 0) {modeText = 'Identification'}
    if(this.props.mode === 1) {modeText = 'Planning'}
    if(this.props.mode === 2) {modeText = 'Monitoring'}
    if(this.props.mode === 3) {modeText = 'Learning'}

    return (
      <div id='main-menu' style={displayStyle}>
        <Navbar
          className={this.state.expanded ? 'main-menu' : 'main-menu main-menu-collapsed'}
          variant='light'
          expand='md'
          expanded={this.state.width <= 767 ? this.state.expanded : false}
          onToggle={this.onToggle}
          key={this.state.width}
        >
          <Navbar.Brand>
            <a href='/' className='main-menu-logo-item noselect' onClick={(e) => {e.preventDefault(); this.props.onModeChange(-1); this.onOpenAccounts(false)}}>
              <img className='main-menu-logo' src='/images/logos/groasis-tree-atlas-logo.svg' alt='Groasis Tree Altas'/>
            </a>
          </Navbar.Brand>
            <NavItem className='modeSwitch'>
{/*              <RadioGroup
                aria-label="mode"
                name="mode"
                value={this.props.mode}
                onChange={this.onModeToggle}
                row={this.state.width <= 767 ? false : true}
                className="modeSwitch"
                key={this.state.expanded}
              >
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
              </RadioGroup>*/}
              {this.props.mode !== -1 ? <Button color='primary' variant='outlined' onClick={() => {this.props.onModeChange(-1)}}>{modeText}</Button> : null}
            </NavItem>
            <NavItem>
              <Button startIcon={<DownloadIcon />} variant='outlined' onClick={() => {window.open('https://public.ellipsis-earth.com/GroasisCalculationModel.xls')}} color='primary'>
                Calculation Model
              </Button>
            </NavItem>
            <NavItem>
              <Button variant='outlined' onClick={this.onOpenAccounts} color='primary'>
                {this.props.user ? this.props.user.username : 'Login'}
              </Button>
            </NavItem>
        </Navbar>
      </div>
    )
  }
}

export default MainMenu;
