/// <reference types="Cypress" />

describe('Messages', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
    cy.fixture('users/testOtherUser').as('testOtherUser');
  });
  
  it('can receive and send messages', function() {
    const testReply = 'Test reply';
    cy.visit(`/users/${this.testOtherUser.slug}`);
    cy.get('a').contains('Message').click();
    cy.contains('Test seeded message').should('be.visible');
    cy.get('.ck-editor__editable').type(testReply);
    cy.contains("Submit").click();
    cy.contains('.MessageItem-messageBody', testReply).should('be.visible');
  });
});
