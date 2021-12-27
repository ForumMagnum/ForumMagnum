/// <reference types="Cypress" />

describe('Posts', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
  });
  
  it('can create new post and view it', function() {
    cy.visit('/newPost');
    cy.get('.EditTitle-root').type('Test post 123');
    cy.get('.ck-editor__editable').type('Test body 123');
    cy.contains("Submit").click();
    cy.url().should('include', 'test-post-123');
    cy.contains("Test post 123");
    cy.contains("Test body 123");
  });
});
