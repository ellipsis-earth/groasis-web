import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import Modal from 'react-modal';
import { withRouter } from 'react-router';

import ButtonBase from '@material-ui/core/ButtonBase';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';

import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';

import ApiManager from './ApiManager';
import ViewerUtility from './Components/Viewer/ViewerUtility';

import MainMenu from './Components/MainMenu/MainMenu';
import Viewer from './Components/Viewer/Viewer';


import './App.css';

const localStorageUserItem = 'user';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#87cef3'
    },
    secondary: {
      main: '#4b483f'
    }
  },
});

class App extends Component {
  topItemRef = null;
  bottomItemRef = null;

  constructor(props, context) {
    super(props, context)

    this.topItemRef = React.createRef();
    this.bottomItemRef = React.createRef();
    this.viewer = React.createRef();


    this.accountsUrl = 'https://account.ellipsis-earth.com/';
    // this.accountsUrl = 'http://localhost:3001/';

    this.state = {
      init: false,
      user: null,
      accountOpen: false,
      mode: -1,
    };
  }

  componentDidMount() {
    Modal.setAppElement('body');

    window.addEventListener("message", this.receiveMessage, false);
    return this.retrieveUser();
  }

  receiveMessage = (event) => {
    if (event.origin === 'http://localhost:3000' || 'https://account.ellipsis-earth.com')
    {
      if (event.data.type && event.data.type === 'login')
      {
        this.onLogin(event.data.data);
      }
      if (event.data.type && event.data.type === 'logout')
      {
        this.onLogout();
      }
      if (event.data.type && event.data.type === 'overlayClose')
      {
        this.setState({accountOpen: false}, this.setHome())
      }
    }
  }

  setHome = () => {
    let iframe = document.getElementById("account");
    iframe.contentWindow.postMessage({type: 'home'}, this.accountsUrl);
  }

  closeMenu = () => {
    var x = document.getElementById('main-menu');
    x.className = '';
  }

  retrieveUser = async () => {
    let user = null;
    let userJson = localStorage.getItem(localStorageUserItem);

    if (!userJson) {
      this.setState({ init: true });
      return;
    }

    user = JSON.parse(userJson);

    ApiManager.get(`/account/validateLogin`, null, user)
      .then(() => {
        if (user.username) {
          user.username = user.username.toLowerCase();
        }

        this.setState({ user: user, init: true });
      })
      .catch(() => {
        this.setState({ init: true });
        localStorage.removeItem(localStorageUserItem);
      });
  }

  scrollToBottom = () => {
    this.bottomItemRef.current.scrollIntoView({ behavior: 'smooth' });
  }

  onLogin = (user) => {
    localStorage.setItem(localStorageUserItem, JSON.stringify(user));
    this.setState({user: user});
  }

  onLogout = () => {
    localStorage.removeItem(localStorageUserItem);
    this.setState({ user: null });
  }

  onModeChange = (mode, cb) => {
    if (this.viewer.current)
    {
      console.log(this.viewer.current)
      this.viewer.current.mapControl.current.onStopDraw();
    }

    this.setState({ mode: mode }, cb);
  }

  openAccounts = (open = !this.state.accountOpen) => {
    this.setState({accountOpen: open})
  }

  render() {
    if (!this.state.init) {
      return null;
    }

    let contentClassName = 'content';

    if (this.state.accountOpen)
    {
      let initObject = {type: 'init'};
      if (this.state.user){initObject.data = this.state.user}
      let iframe = document.getElementById("account");
      iframe.contentWindow.postMessage(initObject, this.accountsUrl);
    }

    return (
      <div className='App' onClick={this.closeMenu}>
        <ThemeProvider theme={theme}>
            {
              <MainMenu
                user={this.state.user}
                mode={this.state.mode}
                onModeChange={this.onModeChange}
                scrollToBottom={this.scrollToBottom}
                openAccounts={this.openAccounts}
              />
            }
            <div className={contentClassName}>
              <div ref={this.topItemRef}></div>
              <Route exact path='/'
                render={() =>
                  <Viewer
                    key={this.state.user ? this.state.user.name : 'default'}
                    user={this.state.user}
                    mode={this.state.mode}
                    scrollToBottom={this.scrollToBottom}
                    onModeChange={this.onModeChange}
                    openAccounts={this.openAccounts}
                    ref={this.viewer}
                  />
                }
              />
              <div className={this.state.accountOpen ? 'account' : 'hidden'}>
                <iframe src={this.accountsUrl} id='account' title="account"/>
              </div>
              <div className={this.state.mode === -1 ? 'modeSelector' : 'hidden'}>
                <div className='buttonContainer'>
                  <Card id='identification' onClick={() => {this.onModeChange(ViewerUtility.identificationMode)}}>
                    <h1>Identification &amp; Planning</h1>
                    <p>
                      Identify high potential locations and plan your reforestation projects using satellite imagery and other maps.
                    </p>
                  </Card>

                  <Card id='planting'  className='disabled' onClick={() => {this.onModeChange(ViewerUtility.plantMode)}}>
                    <h1>
                      Coming soon
                    </h1>
                    <h1>Organization &amp; Implementation</h1>
                    <p>
                      Implement drawn up plans, using already planned planting lines and trees locations.
                    </p>
                  </Card>

                  <Card id='monitoring'  className='disabled' onClick={() => {this.onModeChange(ViewerUtility.plantMode)}}>
                    <h1>
                      Coming soon
                    </h1>
                    <h1>Growth &amp; Monitoring</h1>
                    <p>
                      Keep track of growth, and growing conditions of individual trees in projects.
                    </p>
                  </Card>

                  <Card id='learning' className='disabled' onClick={() => {this.onModeChange(ViewerUtility.viewerMode)}}>
                    <h1>
                      Coming soon
                    </h1>
                    <h1>Learning &amp; Improvements</h1>
                    <p>
                      Gain insight in your success rate and learn from your old projects.
                    </p>
                  </Card>
                </div>
              </div>
              <div ref={this.bottomItemRef}></div>
            </div>
        </ThemeProvider>
      </div>
    );

  }

}

export default withRouter(App);
