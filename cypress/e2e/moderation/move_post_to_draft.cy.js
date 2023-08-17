/// <reference types="Cypress" />

describe('Moderators', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testAdmin').as('testAdmin');
    cy.fixture('users/testOtherUser').as('testOtherUser');
    cy.fixture('posts/testPost').as('testPost');
  });

  it('can move posts to drafts, hiding them from public view', function() {
    cy.loginAs(this.testAdmin);
    cy.visit('/posts/test-seeded-post');
    cy.get('.PostActionsButton-root').click();
    cy.contains(this.testPost.title).should('exist');
    cy.contains('.DropdownItem-title', 'Move to draft').click();

    /** this stops the test from auto-failing when the operation_not_allowed 
     * exception is thrown. */
    cy.on('uncaught:exception', () => {
      return false;
    })

    cy.loginAs(this.testOtherUser);
    cy.reload(true);

    cy.contains(this.testPost.title).should('not.exist');
  });
})
