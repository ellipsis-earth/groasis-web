import React, { Component } from 'react';
import {
    Route
} from 'react-router-dom';
import Modal from 'react-modal';
import { withRouter } from 'react-router';

import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';

import ApiManager from './ApiManager';
import ErrorHandler from './ErrorHandler';

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

    this.accountsUrl = 'https://account.ellipsis-earth.com/';
    // this.accountsUrl = 'http://localhost:3001/';

    this.state = {
      init: false,
      user: null,
      accountOpen: false,
      mode: 0
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
  
  onModeChange = (mode) => {
    this.setState({ mode: mode });
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
                  />
                }
              />
              <div className={this.state.accountOpen ? 'account' : 'hidden'}>
                <iframe src={this.accountsUrl} id='account'/>
              </div>
              <div ref={this.bottomItemRef}></div>
            </div>
        </ThemeProvider>
      </div>
    );

  }

}

export default withRouter(App);
