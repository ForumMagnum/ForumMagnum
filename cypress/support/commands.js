// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('resetDatabase', () => {
  cy.exec(`mongo meteor --eval "db.dropDatabase()" --port 3001`)
})

Cypress.Commands.add('createUser', ({username, password}) => {
  cy.exec(`echo 'Accounts.createUser({username:"${username}", password: "${password}"})' | meteor shell`)
})

Cypress.Commands.add('login', ({username, password}) => {
  cy.task('login', {username, password}).then(token => {
    cy.setCookie('meteor_login_token', token)
    window.localStorage.setItem('Meteor.loginToken', token)
  })
})

Cypress.Commands.add('createUserAndLogin', ({username, password}) => {
  cy.createUser({username, password})
  cy.login({username, password})
})


