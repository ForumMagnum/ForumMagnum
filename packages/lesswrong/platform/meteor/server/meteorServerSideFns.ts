import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { Picker } from 'meteor/meteorhacks:picker'
import cookieParser from 'cookie-parser'

export const onServerConnect = (fn) => Meteor.onConnection(fn);

export const meteorSendEmail = Email.send

export function initMeteorhacksPickerMiddleware() {
  if (Picker)
    Picker.middleware(cookieParser())
}

export function addPickerRoute(url: string, handler: any) {
  Picker.route(url, handler);
}
