import { addRoute } from 'meteor/vulcan:lib';

addRoute({name: 'resetPassword', path: '/reset-password/:token', componentName: 'AccountsResetPassword'});
addRoute({name: 'enrollAccount', path: '/enroll-account/:token', componentName: 'AccountsEnrollAccount'});
addRoute({name: 'verifyEmail', path: '/verify-email/:token', componentName: 'AccountsVerifyEmail'});
