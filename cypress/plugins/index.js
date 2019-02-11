// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

var DDP = require('ddp');

const ddpConnectPromisified = (username, password) => {
  return new Promise((resolve, reject) => {
    const ddpClient = new DDP({
      host: "localhost",
      port: 3000
    })

    ddpClient.connect((error, wasReconnect) => {
      if (error) {console.error('DDP connection error', error)}
      setTimeout(function () {
        // logging in with username
        ddpClient.call("login", [
          { user : { username }, password }
        ], function (err, result) {
          if (err) {
            ddpClient.close();
            reject(err)
          }
          ddpClient.close();
          resolve(result)
        });
      }, 3000)
    })

    
  })
}

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('task', {
    async login ({username, password}) {
      const result = await ddpConnectPromisified(username, password)
      console.log("result:", result)
      return result.token
    }
  }) 
}
