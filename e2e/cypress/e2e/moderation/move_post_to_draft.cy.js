/// <reference types="Cypress" />

import { testAdmin } from '../../fixtures/users/testAdmin.ts';
import { testOtherUser } from '../../fixtures/users/testOtherUser.ts';
import { testPost } from '../../fixtures/posts/testPost.ts';

describe('Moderators', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
  });

  it('can move posts to drafts, hiding them from public view', function() {
    cy.loginAs(testAdmin);
    cy.visit('/posts/test-seeded-post');
    cy.get('.PostsPageActions-root').click();
    cy.contains(testPost.title).should('exist');
    cy.contains('li', 'Move to Draft').click();

    /** this stops the test from auto-failing when the operation_not_allowed 
     * exception is thrown. */
    cy.on('uncaught:exception', () => {
      return false;
    })

    cy.loginAs(testOtherUser);
    cy.reload(true);

    cy.contains(testPost.title).should('not.exist');
  });
})
