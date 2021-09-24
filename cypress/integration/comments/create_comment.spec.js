/// <reference types="Cypress" />

describe('Comments', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/freshTestUser').as('freshTestUser').then(() => {
      cy.loginAs(this.freshTestUser);
    });
  });

  it('can add a new comment', function() {
    cy.visit('/posts/test-seeded-post/test-seeded-post');
    cy.get('#new-comment-form').type('Test comment');
    cy.get('#new-comment-submit').click();
    cy.contains('.CommentBody-root', 'Test comment').should('be.visible');
  });
});
