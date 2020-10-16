import { Meteor } from 'meteor/meteor';
import { onStartup } from '../lib/executionEnvironment';

var disconnectTimer: any = null;

// 60 seconds by default
var disconnectTime = 60 * 1000;

onStartup(disconnectIfHidden);

document.addEventListener('visibilitychange', disconnectIfHidden);

function disconnectIfHidden() {
    removeDisconnectTimeout();

    if (document.hidden) {
      createDisconnectTimeout();
    } else {
      Meteor.reconnect();
    }
}

function createDisconnectTimeout() {
    removeDisconnectTimeout();

    disconnectTimer = setTimeout(function () {
        Meteor.disconnect();
    }, disconnectTime);
}

function removeDisconnectTimeout() {
    if (disconnectTimer) {
        clearTimeout(disconnectTimer);
    }
}
