import { Picker } from './picker';

export const onServerConnect = (fn) => {}

export const meteorSendEmail: any = (email)=>{
  console.log("Sending email not yet implemented");
  console.log(email);
}

export function initMeteorhacksPickerMiddleware() {}

export function addPickerRoute(url: string, handler: any) {
  Picker.route(url, handler);
}

