// import { onStartup } from '../lib/executionEnvironment';
// import { disconnectDdp, reconnectDdp } from '../lib/meteorDdp';

// var disconnectTimer: any = null;

// // 60 seconds by default
// var disconnectTime = 60 * 1000;

// onStartup(disconnectIfHidden);

// document.addEventListener('visibilitychange', disconnectIfHidden);

// function disconnectIfHidden() {
//     removeDisconnectTimeout();

//     if (document.hidden) {
//       createDisconnectTimeout();
//     } else {
//       reconnectDdp();
//     }
// }

// function createDisconnectTimeout() {
//     removeDisconnectTimeout();

//     disconnectTimer = setTimeout(function () {
//         disconnectDdp();
//     }, disconnectTime);
// }

// function removeDisconnectTimeout() {
//     if (disconnectTimer) {
//         clearTimeout(disconnectTimer);
//     }
// }
