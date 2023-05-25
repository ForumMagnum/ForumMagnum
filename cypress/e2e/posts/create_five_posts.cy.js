/// <reference types="Cypress" />

describe('Posts', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
  });
  
  it('can create five but not six posts per day', function() {
    // We do 4 rather 5 because we already have 1 post from the test seeded post
    for (let i = 0; i < 4; i++) {
      cy.visit('/newPost');
      cy.get('.EditTitle-root').type('Test post 123');
      cy.get('.ck-editor__editable').type('Test body 123');
      cy.contains("Submit").click();
      cy.url().should('include', 'test-post-123');
      cy.contains("Test post 123");
      cy.contains("Test body 123");  
    }

    cy.visit('/newPost');
    cy.contains("Users cannot post more than 5 posts a day");
  });
});
