import { Accounts } from '../lib/meteorAccounts';
import { ForwardedWhitelist } from '../../../server/forwarded_whitelist';
import { Email } from 'meteor/email';
import { Picker } from 'meteor/meteorhacks:picker'
import cookieParser from 'cookie-parser'

export const addLoginAttemptValidation = (validationFn: (attempt: {allowed: boolean, user: DbUser, methodArguments: any, ip: string}) => boolean) => {
  // TODO
}

export const onServerConnect = (fn) => {}

export const meteorSendEmail: any = ()=>{} //TODO

export function initMeteorhacksPickerMiddleware() {
  // TODO
}

export function addPickerRoute(url: string, handler: any) {
  // TODO
}


export const sendVerificationEmail = (userId) => console.log("This should eventually send a verificatin email")
