import { Meteor } from 'meteor/meteor';
import { Accounts } from '../lib/meteorAccounts';
import { ForwardedWhitelist } from '../../../server/forwarded_whitelist';
import { Email } from 'meteor/email';
import { Picker } from 'meteor/meteorhacks:picker'
import cookieParser from 'cookie-parser'

export const addLoginAttemptValidation = (validationFn: (attempt: {allowed: boolean, user: DbUser, methodArguments: any, ip: string}) => boolean) => {
  Accounts.validateLoginAttempt((attempt) => {
    const ip = attempt.connection && ForwardedWhitelist.getClientIP(attempt.connection);
    return validationFn({
      allowed: attempt.allowed,
      user: attempt.user,
      methodArguments: attempt.methodArguments,
      ip: ip,
    });
  });
}

export const onServerConnect = (fn) => Meteor.onConnection(fn);

export const meteorSendEmail = Email.send

export function initMeteorhacksPickerMiddleware() {
  if (Picker)
    Picker.middleware(cookieParser())
}

export function addPickerRoute(url: string, handler: any) {
  Picker.route(url, handler);
}
