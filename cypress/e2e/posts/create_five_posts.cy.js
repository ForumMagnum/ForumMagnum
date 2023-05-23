/// <reference types="Cypress" />

describe('Posts', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
  });
  
  it('can create five but not six posts per day', function() {
    for (let i = 0; i < 5; i++) {
      cy.log(`creating post ${i}`)
      cy.visit('/newPost');
      cy.get('.EditTitle-root').type('Test post 123');
      cy.get('.ck-editor__editable').type('Test body 123');
      cy.contains("Submit").click();
      cy.url().should('include', 'test-post-123');
      cy.contains("Test post 123");
      cy.contains("Test body 123");  
      cy.log(`created post ${i}`)
    }

    cy.reload();
    cy.visit('/newPost');
    cy.contains("Users cannot post more than 5 posts a day");
  });
});
