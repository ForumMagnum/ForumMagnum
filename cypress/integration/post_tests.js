/// <reference types="Cypress" />



describe('Basic Login and Signup', function() {
  beforeEach(function() {
    // reset the database prior to every test
    cy.exec(`mongo meteor --eval "db.dropDatabase()" --port 3001`)

    // Create default admin user
    cy.fixture('defaultUser').as('defaultUser').then(() => {
      cy.createUser(this.defaultUser)
    })
  })
  it('can create new post and view it', function() {
    cy.login(this.defaultUser)
    cy.visit('/newPost')
    cy.get('.EditTitle-root').type("Test Post 25")
    cy.get('.public-DraftEditor-content').type("Wooop!")
    cy.contains("Publish").click()
    cy.url().should('include', 'test-post-25')
    cy.contains("Wooop!")
  })
})