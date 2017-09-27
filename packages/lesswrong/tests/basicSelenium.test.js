// let webdriver = require('selenium-webdriver');
// let chrome = require('selenium-webdriver/chrome');
// let test = require('selenium-webdriver/testing');
// let driver = new webdriver.Builder()
//     .forBrowser('chrome')
//     .setFirefoxOptions( /* … */)
//     .setChromeOptions( /* … */)
//     .build();
//
// let assert = require('assert');
// import {expect} from 'Chai';
//
// const myService = "localhost:3000"
// const myTitle = "LessWrong 2.0"
//
// // Testing data
// const testUsername1 = "JohnnyTest"
// const testUserEmail1 = "johnnytest@gmail.com"
// const testPassword1 = "testtest"
//
//
//
// const getUsernameField = () => driver.findElement(webdriver.By.id("usernameOrEmail"))
// const getPasswordField = () => driver.findElement(webdriver.By.id("password"))
// const getLoginSubmit = () => driver.findElement(webdriver.By.css(".accounts-ui.ready button[type='submit']"))
// const getUsersMenu = () => driver.findElement(webdriver.By.className("users-menu"))
//
//
// test.describe( 'Test Suite' , function(){
//     test.before(function(){
//         driver.get( myService );
//         // driver.findElement(webdriver.By.id(username)).sendKeys(my_username);
//         // driver.findElement(webdriver.By.id(submit)).click();
//     });
//     test.after(function(){
//         driver.quit();
//     });
//
//     test.it( 'Title is Correct' , function(){
//         driver.getTitle().then(function(title) {
//             expect(title).equals(myTitle);
//         })
//     });
//     test.it( 'User can log in' , function() {
//         getUsersMenu().click()
//         getUsernameField().sendKeys(testUsername1)
//         getPasswordField().sendKeys(testPassword1)
//         getLoginSubmit().getAttribute("innerText")
//         .then((text) => {
//           expect(text).equals("SIGN IN");
//         })
//         .then(getLoginSubmit().click())
//         .then(getUsersMenu().getAttribute("innerText"))
//         .then((text) => expect(text).equals(testUsername1))
//       })
// });
