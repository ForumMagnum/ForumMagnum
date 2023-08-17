
/// <reference types="Cypress" />

describe('Comments', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
    cy.fixture('posts/testPost').as('testPost');
    cy.fixture('comments/testComment').as('testComment');
  });

  it('can edit an existing comment', function() {
    cy.visit(`posts/${this.testPost._id}/${this.testPost.slug}`);
    cy.contains('.CommentsItem-root', this.testComment.contents.html).find(".CommentsItemMeta-menu").click();
    cy.get('ul[role="menu"]').contains('li', 'Edit').click();
    const newCommentText = 'Edited comment';
    cy.get('.comments-edit-form .ck-editor__editable').click().clear().type(newCommentText);
    cy.contains('button', 'Save').click();
    cy.contains('.CommentBody-root', newCommentText).should('exist');
  });
});
