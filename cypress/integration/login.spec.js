/// <reference types="Cypress" />-````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````

describe('Basic Login and Signup', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUser').as('testUser');
  });

  it('Can successfully login with token', function() {
    cy.loginAs(this.testUser);
    cy.visit('/');
    cy.contains(this.testUser.displayName).should('be.visible');
  });
})
