/// <reference types="Cypress" />

describe('Groups', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testOtherUser').as('testOtherUser');
    cy.fixture('localgroups/testGroup').as('testGroup');
    cy.fixture('users/testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
  });

  it('can create a post in a group', function() {
    // Go to local group page and click "New event"
    cy.visit(`/groups/test-seeded-localgroup`);
    cy.contains('New event').click();
    cy.url().should('include', 'newPost');
    
    // Fill in some event fields and submit
    cy.get('.EditTitle-root').type('Test event 123');
    cy.get('.ck-editor__editable').type('Test body 123');
    cy.contains("Submit").click();
    
    // Wait for submission to finish
    cy.url().should('include', 'test-event-123');
    
    // Log in as the other user
    cy.loginAs(this.testOtherUser);
    cy.reload(true);
    
    // Try to edit the post. This should work because we're a group organizer.
    cy.get('.PostActionsButton-root').first().click();
    cy.contains('.DropdownItem-title', 'Edit').click();
    const newEventBody = "Modied test body 123";
    cy.get('.input-contents .ck-editor__editable').click().clear().type(newEventBody);
    cy.contains('Publish Changes').click();
    cy.contains('.PostsPage-postContent', newEventBody).should('exist');
  });
});

