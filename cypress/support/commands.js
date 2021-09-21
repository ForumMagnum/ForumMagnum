/// <reference types="Cypress" />
const crypto = require('crypto');

Cypress.Commands.add('loginAs', user => {
  const loginToken = crypto.randomBytes(12).toString('base64');
  cy.task('associateLoginToken', {user, loginToken});
  cy.setCookie('loginToken', loginToken);
});
