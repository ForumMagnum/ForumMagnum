/// <reference types="Cypress" />

import { testUser } from '../../fixtures/users/testUser.ts';
import { testAdmin } from '../../fixtures/users/testAdmin.ts';
import { testPost as bannedUserPost } from '../../fixtures/posts/testPost.ts';

describe('Moderators', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
  });

  it('can ban users and remove their content from public view', function() {
    // the not-yet-banned user should see a logged in view of the forum
    cy.loginAs(testUser);
    cy.visit('/');
    cy.contains(testUser.displayName).should('exist');

    cy.loginAs(testAdmin);
    cy.visit('/');
    cy.contains(bannedUserPost.title).should('exist');
    cy.visit(`/users/${testUser.slug}/edit`);
    cy.get('.form-section-ban-and-purge-user .form-section-heading-toggle').click();
    cy.get('.input-deleteContent .MuiCheckbox-root').click()
    cy.get('input[name="banned"]').click();
    cy.get('.rdtNext').click(); // jumping to next month via the date picker
    cy.get('.rdtDay.rdtNew[data-value="1"]').click();
    cy.contains('button', 'Submit').click();
    cy.loginAs(testUser);
    cy.visit('/');
    cy.reload(true);

    // the banned user's post should no longer be on the front page
    cy.contains(bannedUserPost.title).should('not.exist');

    // the banned user should see a logged out version of the forum
    cy.contains(testUser.displayName).should('not.exist');
    cy.contains('.UsersAccountMenu-userButton', 'Login').should('exist');
  });
})
