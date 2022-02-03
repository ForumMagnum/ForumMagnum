/// <reference types="Cypress" />

describe('Posts', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
    cy.fixture('posts/testPost').as('testPost');
  });

  it('can edit an existing post', function() {
    cy.visit(`posts/${this.testPost._id}/${this.testPost.slug}`);
    const newPostTitle = 'New Post Title';
    const newPostBody = 'New post body';
    cy.get('.PostsPageActions-root').click();
    cy.contains('.PostActions-actions li', 'Edit').click();
    cy.get('.form-component-EditTitle').click().clear().type(newPostTitle);
    cy.get('.input-contents .ck-editor__editable').click().clear().type(newPostBody);
    cy.contains('Publish Changes').click();
    cy.contains('.PostsPageTitle-root', newPostTitle).should('exist');
    cy.contains('.PostsPage-postContent', newPostBody).should('exist');
  });
});
