'use strict';

const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const ipcMain = electron.ipcMain;
const {Menu} = require('electron');
const copperApp = app;

const userSettings = require('./js/app/UserSettings');
const appConfig = require('./js/app/AppConfig');
const loginService = require('./js/services/login.service');

const trayMenu = [
    {
      label: 'Gamma-Ori',
      click: function() { 
          if (loginStatus || offlineMode) {
              showMainWindow();
            } else {
                showLoginWindow();
            }
        }
    },
    {
      label: 'About',
      click: function() { 
          showAboutWindow();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Exit',
      click: function() {
          exitCopperApp();
        }
    }
  ];

let loginStatus = false;
let offlineMode = false;
let mainWindow = null;
let aboutWindow = null;
let loginWindow = null;
// let dialog = require('dialog');
const Tray = electron.Tray;

let appIcon = null;

//startup
copperApp.on('ready', function() {
    appIcon = new Tray('./assets/icons/29cu.png');
    const contextMenu = Menu.buildFromTemplate(trayMenu);
    appIcon.setToolTip('gamma-ori');
    appIcon.setContextMenu(contextMenu);
    
    
    if (getSavedSession()) {
        // process.stdout.write('getSavedSession returned true');
        if (getLoginStatus()) {
            // process.stdout.write('getLoginStatus returned true');
            showMainWindow();
        } else {
            // process.stdout.write('getLoginStatus returned false');
            showLoginWindow();
        }
    } else {
        // process.stdout.write('getSavedSession returned false');
        showLoginWindow();
    }
});

// shutdown
copperApp.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
   //copperApp.quit();
  }
});


//main window
function showMainWindow() {
    if (null !== mainWindow) {
        return;
    }
    mainWindow = new BrowserWindow({width: 900, height: 660, minWidth: 640, minHeight: 480, icon:'./assets/icons/29cu@2.5x.png'});
    mainWindow.setMenu(null);
    
    mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'screens/index.html'),
            protocol: 'file:',
            slashes: true
    }));
    
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

function closeMainWindow() {
    if (mainWindow) {
        mainWindow.close();
    }
};

//login window
function showLoginWindow() {
    if (loginWindow) {
        return;
    }
    loginWindow = new BrowserWindow({
        //frame: false,
        height: 320,
        //resizable: false,
        width: 480,
        icon:'./assets/icons/29cu@2.5x.png'
    });
    loginWindow.setMenu(null);
    // loginWindow.loadURL('http://localhost:4200/#/login?client=copper');
    loginWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'screens/login/login.html'),
            protocol: 'file:',
            slashes: true
    }));

    loginWindow.on('closed', function () {
        loginWindow = null;
    });
}

function closeLoginWindow() {
    if (loginWindow) {
        loginWindow.close();
    }
};

//about window
function showAboutWindow() {
    if (aboutWindow) {
        return;
    }

    aboutWindow = new BrowserWindow({
        //frame: false,
        height: 520,
        resizable: false,
        width: 320,
        icon:'./assets/icons/29cu@2.5x.png'
    });
    aboutWindow.setMenu(null);
    aboutWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'screens/about/about.html'),
            protocol: 'file:',
            slashes: true
    }));

    aboutWindow.on('closed', function () {
        aboutWindow = null;
    });
}

function closeAboutWindow() {
    if (aboutWindow) {
        aboutWindow.close();
    }
};

//closing all windows
function closeAllWindows() {
    closeAboutWindow();
    closeLoginWindow();
    closeMainWindow();
}

//ipc listner
ipcMain.on('synchronous-message', function(event, arg) {
  if (arg === 'open-about-window') {
      showAboutWindow();
  } else if (arg === 'open-login-window') {
      showLoginWindow();
  }  else if (arg === 'open-main-window') {
      showMainWindow();
  } else if (arg === 'close-about-window') {
      closeAboutWindow();
  } else if (arg === 'close-main-window') {
      closeMainWindow();
  } else if (arg === 'login-success') {
      loginStatus = true;
      offlineMode = false;
      showMainWindow();
      //closeLoginWindow();
  } else if (arg === 'use-offline-mode') {
      loginStatus = false;
      offlineMode = true;
      showMainWindow();
      //closeLoginWindow();
  } else if (arg === 'logoff-user') {
      loginStatus = false;
      offlineMode = false;
  } else if (arg === 'exit-app') {
      exitCopperApp();
  }
  event.returnValue = 'done';
});

function exitCopperApp() {
    closeUserSession();
    closeAllWindows();
    copperApp.quit();
}

function getLoginStatus() {
    process.stdout.write(userSettings.readSetting('x-auth-token'));
    if (!userSettings.readSetting('x-auth-token')) {
        loginStatus = false;
    } else {
        loginStatus = true;
    }
    return loginStatus;
}

function getSavedSession() {
    return ('yes' === userSettings.readSetting('personalSys'));
}

function closeUserSession() {
    if ('yes' !== userSettings.readSetting('personalSys')) {
        userSettings.removeSetting('x-auth-token');
        userSettings.removeSetting('offlineMode');
    }
}
