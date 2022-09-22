/// <reference types="Cypress" />

import { testUser } from '../../fixtures/users/testUser.ts';
import { testOtherUser } from '../../fixtures/users/testOtherUser.ts';

describe('Messages', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.loginAs(testUser);
  });
  
  it('can receive and send messages', function() {
    const testReply = 'Test reply';
    cy.visit(`/users/${testOtherUser.slug}`);
    cy.get('[data-cy=message]').click();
    cy.contains('Test seeded message').should('exist');
    cy.get('.ck-editor__editable').type(testReply);
    cy.contains("Submit").click();
    cy.contains('.MessageItem-messageBody', testReply).should('exist');
  });
});
