/// <reference types="Cypress" />



describe('Basic Login and Signup', function() {
  beforeEach(function() {
    // reset the database prior to every test
    cy.resetDatabase()

    // Create default admin user
    cy.fixture('defaultUser').as('defaultUser').then(async () => {
      cy.createUser(this.defaultUser)
    })
  })
  it('Can successfully login with token', function() {
    cy.login(this.defaultUser)
    cy.visit('/')
    cy.contains(this.defaultUser.username)
  })
  it('Successfully sign up with basic user', function() {
    const randomUserName = `testUser${Date.now()}`
    cy.visit('/')
    cy.contains("Login").click()
    cy.contains("Sign up").click()
    cy.get('#username')
      .type(randomUserName)
    cy.get('#email')
      .type(`${randomUserName}@example.com`)
    cy.get('#password')
      .type('examplePassword1234')
    cy.contains("Sign up").click()
    cy.get('.users-menu')
    cy.contains('Recommended Sequences')
  })
  it('Successfully logs in and out with default user', function() {
    const { username, password } = this.defaultUser
    cy.visit('/')
    cy.contains("Login").click()
    cy.get('#usernameOrEmail').type(username)
    cy.get('#password').type(password)
    cy.contains("Sign in").click()
    cy.contains("Recommended Reading")
    cy.contains(username).click()
    cy.contains("Log Out").click()
    cy.contains("Rationality: A-Z")
  })
  it('Generates a "username already taken" error', function() {
    const { username } = this.defaultUser
    cy.visit('/')
    cy.contains("Login").click()
    cy.contains("Sign up").click()
    cy.get('#username')
      .type(username)
    cy.get('#email')
      .type(`${username}@example.com`)
    cy.get('#password')
      .type('examplePassword1234')
    cy.contains("Sign up").click()
    cy.contains('Username already exists')
  })
})

