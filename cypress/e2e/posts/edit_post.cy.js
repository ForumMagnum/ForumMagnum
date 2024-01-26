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
    cy.get('.PostActionsButton-root').first().click();
    cy.contains('.DropdownItem-title', 'Edit').click();
    cy.get('.form-component-EditTitle').click().clear().type(newPostTitle);
    cy.get('.input-contents .ck-editor__editable').click();
    
    // HACK: Clicking away from the title opens a flash-message. It auto-closes, but
    // while it's open, it can eat certain mouse clicks, causing them to close the
    // message instead of activating what was clicked on. (Not most things, but it does
    // affect the publish button). Wait until the message auto-closes.
    cy.wait(5000);
    
    cy.get('.input-contents .ck-editor__editable').click().clear().type(newPostBody);
    cy.contains('Publish Changes').click();
    cy.contains('.PostsPageTitle-root', newPostTitle).should('exist');
    cy.contains('.PostsPage-postContent', newPostBody).should('exist');
  });
});
