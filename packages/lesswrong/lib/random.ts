import { Random } from 'meteor/random';

export const randomId = () => {
  return Random.id();
}

export const randomSecret = () => {
  return Random.secret();
}
