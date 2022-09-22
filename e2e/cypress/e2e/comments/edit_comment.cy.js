/// <reference types="Cypress" />

import { testUser } from '../../fixtures/users/testUser.ts';
import { testPost } from '../../fixtures/posts/testPost.ts';
import { testComment } from '../../fixtures/comments/testComment.ts';

describe('Comments', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.loginAs(testUser);
  });

  it('can edit an existing comment', function() {
    cy.visit(`posts/${testPost._id}/${testPost.slug}`);
    cy.contains('.CommentsItem-root', testComment.contents.html).find(".CommentsItem-menu").click();
    cy.get('ul[role="menu"]').contains('li', 'Edit').click();
    const newCommentText = 'Edited comment';
    cy.get('.comments-edit-form .ck-editor__editable').click().clear().type(newCommentText);
    cy.contains('button', 'Save').click();
    cy.contains('.CommentBody-root', newCommentText).should('exist');
  });
});
