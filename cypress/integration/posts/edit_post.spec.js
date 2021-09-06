/// <reference types="Cypress" />

describe('Posts', function() {
  beforeEach(function() {
    cy.task('dropDatabase');
    cy.fixture('testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
    cy.task('seedPosts');
  });

  it('can edit an existing post', function() {
    cy.visit('/posts/test-post/test-post');
    cy.get('.PostsPageActions-root').click();
    cy.get('.PostActions-actions').contains("Edit").click();
    cy.get('.form-component-EditTitle').click().clear().type('New Post Title');
    cy.get('.input-contents .ck-editor__editable').click().clear().type('New post body');
    cy.contains('Publish Changes').click();
    cy.get('.PostsPageTitle-root').contains('New Post Title').should('be.visible');
    cy.get('.PostsPage-postContent').contains('New post body').should('be.visible');
  });
});
