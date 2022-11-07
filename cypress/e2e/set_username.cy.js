/// <reference types="Cypress" />

describe('Basic Login and Signup', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUserUnsetUsername').as('testUserUnsetUsername');
  });

  it('Prompts users to set their display name after signup.', function() {
    const newDisplayname = 'New User 123123';
    const newUsername = 'new-user-123123';
    cy.loginAs(this.testUserUnsetUsername);
    cy.visit('/');
    cy.contains('Please choose a username').should('exist');
    cy.get('input[type="text"]').type(newDisplayname);
    cy.get('.new-user-accept-tos input').click();
    cy.get('.NewUserCompleteProfile-submitButtonSection > button').click();
    cy.contains(`a[href="/users/${newUsername}"]`, newDisplayname).should('exist');
  });
})
