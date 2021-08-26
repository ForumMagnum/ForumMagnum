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

Cypress.Commands.add('login', () => {
  cy.setCookie('loginToken', '8d81affa90854269016c7f64fb5742f10694d7677e29c3c0a1d1059e32ea228a');
})

Cypress.Commands.add('loginAdmin', () => {
  cy.setCookie('loginToken', 'b9b019d99f015e68f07db28e3c2c4ce3ef4a2fdfc534c12d1ccdc66db6c9a034');
})

