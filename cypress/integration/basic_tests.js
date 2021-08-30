/// <reference types="Cypress" />-````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````

const TEST_USER_LOGIN_TOKEN = "1234";

describe('Basic Login and Signup', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
  });

  it('Can successfully login with token', function() {
    cy.fixture('testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
    cy.visit('/');
    cy.fixture('testUser').as('testUser').then(function() {
      cy.contains(this.testUser.displayName).should('be.visible');
    });
  });
})
