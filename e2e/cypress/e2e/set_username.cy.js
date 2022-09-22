/// <reference types="Cypress" />

import { testUserUnsetUsername } from '../fixtures/users/testUserUnsetUsername.ts';

describe('Basic Login and Signup', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
  });

  it('Prompts users to set their display name after signup.', function() {
    const newDisplayname = 'New User 123123';
    const newUsername = 'new-user-123123';
    cy.loginAs(testUserUnsetUsername);
    cy.visit('/');
    cy.contains('Please choose a username').should('exist');
    cy.get('input[type="text"]').type(newDisplayname);
    cy.get('.NewUserCompleteProfile-submitButtonSection > button').click();
    cy.contains(`a[href="/users/${newUsername}"]`, newDisplayname).should('exist');
  });
})
