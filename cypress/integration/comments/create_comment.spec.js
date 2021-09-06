/// <reference types="Cypress" />

describe('Comments', function() {
  beforeEach(function() {
    cy.task('dropDatabase');
    cy.fixture('testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
    cy.task('seedPosts');
  });

  it('can add a new comment', function() {
    cy.visit('/posts/test-post/test-post');
    cy.get('#new-comment-form').type('Test comment body');
    cy.get('#new-comment-submit').click();
    cy.get('.CommentBody-root').contains('Test comment body').should('be.visible');
  });
});
