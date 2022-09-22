import { Cypress, cy } from "local-cypress";

const randomBytes = (count: number) => {
  const buffer = new Uint8Array(count);
  crypto.getRandomValues(buffer);
  return Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Cypress.Commands.add('loginAs' as keyof Cypress.Chainable<any>, user => {
  const loginToken = randomBytes(12).toString();
  cy.task('associateLoginToken', {user, loginToken});
  cy.setCookie('loginToken', loginToken);
});
