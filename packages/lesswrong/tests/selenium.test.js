import webdriver from "selenium-webdriver";
import chrome from 'selenium-webdriver/chrome'
import test from 'selenium-webdriver/testing';
import chai from 'chai';

const expect = chai.expect
const assert = chai.assert

const chromeDesktop = {
    prefs: {
        profile: {
            managed_default_content_settings: {
                images: 2
            }
        }
    }
};
let chromeCapabilities = webdriver.Capabilities.chrome();
chromeCapabilities.set('chromeOptions', chromeDesktop);
let driver = new webdriver.Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .build();

const getUsersMenu = () => driver.findElement(webdriver.By.className("users-menu"))
const getUsernameField = () => driver.findElement(webdriver.By.id("usernameOrEmail"))
const getPasswordField = () => driver.findElement(webdriver.By.id("password"))
const getSubmitButton = () => driver.findElement(webdriver.By.css("form.accounts-ui button"))
const getLoginErrors = () => driver.findElement(webdriver.By.css(".message.error"))

const userNotFoundError = "User not found (Use the intercom if you think that user should exist already)"

test.describe( 'Login' , function(){
    test.before(function(){
        driver.get("localhost:3000");
    });
    test.after(function(){
        driver.quit();
    });
    test.it( 'title is correct', function() {
      driver.getTitle().then(function(title){
          expect(title).equals("LessWrong 2.0");
      })
    })
    test.it( 'returns user not found error' , function(){
        getUsersMenu().click()
        .then(() => {
          getUsernameField().sendKeys("fakeuser@gmail.com")
          getPasswordField().sendKeys("wrongpassword")
          getSubmitButton().click()
          .then(()=> {
            getLoginErrors().getAttribute('innerHTML')
            .then(title => expect(title).equals(userNotFoundError))
          })
        })
    });
});
