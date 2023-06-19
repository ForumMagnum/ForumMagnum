/// <reference types="Cypress" />

describe('Posts', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUser').as('testUser');
    cy.fixture('users/testOtherUser').as('testOtherUser');
  });
  
  it('can vote on a new post, and karma updates', async function() {
    // First have testUser create a post
    cy.loginAs(this.testUser);
    cy.visit('/newPost');
    cy.get('.EditTitle-root').type('Test post 123');
    cy.get('.ck-editor__editable').type('Test body 123');
    cy.contains("Submit").click();
    cy.url().should('include', 'test-post-123');
    cy.contains("Test post 123");
    cy.contains("Test body 123");
    
    // Check its score (should be 1, since testUser has no karma)
    cy.get('.PostsVote-voteScore').contains('1');
    
    // Now log in as a the other user, and upvote it
    cy.loginAs(this.testOtherUser);
    cy.reload(true);
    cy.get('.VoteArrowIcon-up').click();
    
    // Wait a second for the server to respond to the vote
    cy.wait(1000);
    
    // Now the post should have a higher score
    cy.get('.PostsVote-voteScore').contains('2');
    
    // Navigate to testUser's profile and check that they got a karma point
    cy.visit('/users/test-user');
    cy.get('[title="1 karma"]').should('exist');
  });
});

