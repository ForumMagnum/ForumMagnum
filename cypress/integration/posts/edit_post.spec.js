/// <reference types="Cypress" />

describe('Posts', function() {
  beforeEach(function() {
    cy.task('dropDatabase');
    cy.fixture('testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
    cy.task('seedDatabase');
  });

  it('can edit an existing post', function() {
    cy.visit('/posts/test-seeded-post/test-seeded-post');
    cy.get('.PostsPageActions-root').click();
    cy.contains('.PostActions-actions', 'Edit').click();
    cy.get('.form-component-EditTitle').click().clear().type('New Post Title');
    cy.get('.input-contents .ck-editor__editable').click().clear().type('New post body');
    cy.contains('Publish Changes').click();
    cy.contains('.PostsPageTitle-root', 'New Post Title').should('be.visible');
    cy.contains('.PostsPage-postContent', 'New post body').should('be.visible');
  });
});
