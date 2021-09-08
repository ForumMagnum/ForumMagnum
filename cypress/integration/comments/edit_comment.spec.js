
/// <reference types="Cypress" />

describe('Comments', function() {
  beforeEach(function() {
    cy.task('dropDatabase');
    cy.fixture('testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
    cy.task('seedDatabase');
  });

  it('can edit an existing comment', function() {
    cy.visit('/posts/test-seeded-post/test-seeded-post');
    cy.contains('.CommentsItem-root', 'Test seeded comment').find(".CommentsItem-menu").click();
    cy.get('ul[role="menu"]').contains('li', 'Edit').click();
    cy.get('.comments-edit-form .ck-editor__editable').click().clear().type('Edited comment');
    cy.contains('button', 'Save').click();
    cy.contains('.CommentBody-root', 'Edited comment').should('be.visible');
  });
});
