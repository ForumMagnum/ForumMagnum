import { Picker } from 'meteor/meteorhacks:picker'
import cookieParser from 'cookie-parser'


if (Picker) Picker.middleware(cookieParser())
/// Add a route which renders by putting things into the http response body
/// directly, rather than using all the Meteor/Apollo/etc stuff.
export const addStaticRoute = (url: string, handler) => {
  Picker.route(url, handler);
}
