/// <reference types="Cypress" />

import { testUser } from '../../fixtures/users/testUser.ts';

describe('Comments', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.loginAs(testUser);
  });

  it('can add a new comment', function() {
    cy.visit('/posts/test-seeded-post/test-seeded-post');
    cy.get('#new-comment-form').type('Test comment');
    cy.get('#new-comment-submit').click();
    cy.contains('.CommentBody-root', 'Test comment').should('exist');
  });
});
