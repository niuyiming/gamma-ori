let user = "default";
let pass = "password";
let loggedin = false;
const userSettings = require("../js/copper-app/UserSettings");
let loggedInUser = "";

//let menu = require('../js/menus');

//menu.create();

const ipcRenderer = require('electron').ipcRenderer;

let app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http) {
  $http.get("http://localhost:4200/#/store?client=copper")
  .then(function(response) {
      $scope.myWelcome = response.data;
  });
});

onload = function() {
    loadCurrentTheme();
    enableWebViewMessageListener();
    if (!isOfflineMode()) {
        loadUserCredentialsFromCache();
    }
    let webview = document.getElementById("contentWebView");
    let addressbar = document.getElementById("addressbar");
    let loadstart = function() {
        addressbar.innerHTML = webview.getURL();
        document.getElementById('refreshIcon').className = 'glyphicon glyphicon-remove';
        //setBackButtonState();
        //setForwardButtonState();
    }
    let loadstop = function() {
        addressbar.innerHTML = webview.getURL();
        document.getElementById('refreshIcon').className = 'glyphicon glyphicon-repeat';
    }
    webview.addEventListener("did-start-loading", loadstart);
    webview.addEventListener("did-stop-loading", loadstop);
}

function setBackButtonState() {
    let webview = document.getElementById("contentWebView");
    let elements = [];
    elements = [document.getElementById("linkGoBack"), document.getElementById("glyphGoBack")];
    if (!webview.canGoBack()) {
        setStateDisabled(elements);
    } else {
        setStateActive(elements);
    }
}

function setForwardButtonState() {
    let webview = document.getElementById("contentWebView");
    let elements = [document.getElementById("linkGoForward"), document.getElementById("glyphGoForward")];
    if (!webview.canGoForward()) {
        setStateDisabled(elements);
    } else {
        setStateActive(elements);
    }
}

function setStateActive(elements) {
    for (let index in elements) {
        elements[index].disabled = false;
    }
}

function setStateDisabled(elements) {
    for (let index in elements) {
        elements[index].disabled = true;
    }
}

function refreshButtonClick(){
    let webview = document.getElementById("contentWebView");
    let refreshIcon = document.getElementById("refreshIcon");
    if ('glyphicon glyphicon-repeat' === refreshIcon.className) {
        webview.reload();
    } else if ('glyphicon glyphicon-remove' === refreshIcon.className) {
        webview.stop();
    }
}

function contentGoBack(){
    let webview = document.getElementById("contentWebView");
    if (webview.canGoBack()) {webview.goBack();}
}

function contentGoForward(){
    let webview = document.getElementById("contentWebView");
    if (webview.canGoForward()) {webview.goForward();}
}

function getUrlVars() {
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,    
    function(m,key,value) {
      vars[key] = value;
      console.log(key + " : " + value);
    });
    return vars;
}
  
function showAboutBox() {
    ipcRenderer.sendSync('synchronous-message', 'open-about-window');
}
            
function enableWebViewMessageListener() {
    let webview = document.getElementById("contentWebView");
    webview.addEventListener('ipc-message', function(event) {
        let app = event.args[0][0];
        console.log(event.channel + " : " + app.id + ", " + app.name);
    });
}

function loadURLInToWebView(url) {
    let webview = document.getElementById("contentWebView");
    webview.loadURL(url);
}

function loadContentPage(url) {
    document.getElementById("content").innerHTML='<object type="text/html" data="' + url + '" ></object>';
}

function setCSS(css) {
	try {
		// append stylesheet to alter
        let themeCSS = document.getElementById('themeCSS');
        if (null !== themeCSS) {
            document.getElementsByTagName("head")[0].removeChild(themeCSS);
        }
		document.getElementsByTagName("head")[0].appendChild(css);
	} catch (e) {
		setTimeout(function(){setCSS(css)}, 100);
	}
}

function setTheme(themeName) {
    
    // create CSS element to set up the page
    let css = document.createElement("link");
    css.setAttribute("id", "themeCSS");
    css.setAttribute("href", "../theme/"+themeName+".css");
    css.setAttribute("rel","stylesheet");
    
    // attempt to add the css and then keep trying till we do
    setCSS(css);
    css = null;
}

function loadCurrentTheme() {
    //initialize the theme
    setTheme(userSettings.readSetting('theme'));
}

document.addEventListener("keydown", function (e) {
    if (e.which === 123) {
        toggleDeveloperTools();
    } else if (e.which === 116) {
        location.reload();
    }
});

function validateLogin() {
    loggedInUser = document.getElementById("email").value;
    let inPassword = document.getElementById("pwd").value;
    if (user === loggedInUser) {
        if (pass === inPassword) {
            loggedin = true;
            $('#loginModal').modal('hide');
        }
    }
    if (!loggedin) {
        alert("Error: Invalid unername and/or password!");
    }
    return loggedin;
}

function isLoggedIn() {
    if (!loggedin) {
        alert("Error: You must login first");
    }
    return loggedin;
}

function toggleDeveloperTools() {
    require('electron').remote.getCurrentWindow().toggleDevTools();
}

function saveSetting(settingKey, settingValue) {
    userSettings.saveSetting(settingKey, settingValue);
}

function readSetting(settingKey) {
    return userSettings.readSetting(settingKey);
}

function loadUserCredentialsFromCache() {
    loggedInUser = userSettings.readSetting("loggedInUser");
    if (loggedInUser !== "" && getSavedSession()) {
        loggedin = true;
    }
    return loggedInUser;
}

function getSavedSession() {
    return userSettings.readSetting("personalSys");
}

function logOutUser() {
    loggedin = false;
    ipcRenderer.sendSync('synchronous-message', 'logoff-user');
    userSettings.removeSetting("loggedInUser");
    userSettings.removeSetting("personalSys");
}

function showLoginWindow() {
    ipcRenderer.sendSync('synchronous-message', 'open-login-window');
    require('electron').remote.getCurrentWindow().close();
}

function isOfflineMode() {
    if ('true' === userSettings.readSetting("offlineMode")) {
        return true;
    } else {
        return false;
    }
}