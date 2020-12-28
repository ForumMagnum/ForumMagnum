import { Picker } from './picker';

export const addLoginAttemptValidation = (validationFn: (attempt: {allowed: boolean, user: DbUser, methodArguments: any, ip: string}) => boolean) => {
  // TODO
}

export const onServerConnect = (fn) => {}

export const meteorSendEmail: any = (email)=>{
  console.log("Sending email not yet implemented");
  console.log(email);
}

export function initMeteorhacksPickerMiddleware() {
  // TODO
}

export function addPickerRoute(url: string, handler: any) {
  Picker.route(url, handler);
}


export const sendVerificationEmail = (userId) => console.log("This should eventually send a verificatin email")
