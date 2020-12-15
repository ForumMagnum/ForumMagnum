import { app } from './expressServer';
import { parseQuery } from '../../../lib/routeUtil';
import { Picker } from './picker';
import URL from 'url';

export const addLoginAttemptValidation = (validationFn: (attempt: {allowed: boolean, user: DbUser, methodArguments: any, ip: string}) => boolean) => {
  // TODO
}

export const onServerConnect = (fn) => {}

export const meteorSendEmail: any = ()=>{} //TODO

export function initMeteorhacksPickerMiddleware() {
  // TODO
}

export function addPickerRoute(url: string, handler: any) {
  Picker.route(url, handler);
}


export const sendVerificationEmail = (userId) => console.log("This should eventually send a verificatin email")
