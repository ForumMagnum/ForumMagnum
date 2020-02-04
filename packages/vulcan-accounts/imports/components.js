import { importComponent } from 'meteor/vulcan:lib';

importComponent("AccountsButton", () => require('./ui/components/Button.jsx'));
importComponent("AccountsButtons", () => require('./ui/components/Buttons.jsx'));
importComponent("AccountsField", () => require('./ui/components/Field.jsx'));
importComponent("AccountsFields", () => require('./ui/components/Fields.jsx'));
importComponent("AccountsForm", () => require('./ui/components/Form.jsx'));
importComponent("AccountsFormMessage", () => require('./ui/components/FormMessage.jsx'));
importComponent("AccountsFormMessages", () => require('./ui/components/FormMessages.jsx'));
importComponent("AccountsStateSwitcher", () => require('./ui/components/StateSwitcher.jsx'));
importComponent("AccountsLoginForm", () => require('./ui/components/LoginForm.jsx'));
importComponent("AccountsLoginFormInner", () => require('./ui/components/LoginFormInner.jsx'));
importComponent("AccountsPasswordOrService", () => require('./ui/components/PasswordOrService.jsx'));
importComponent("AccountsSocialButtons", () => require('./ui/components/SocialButtons.jsx'));
