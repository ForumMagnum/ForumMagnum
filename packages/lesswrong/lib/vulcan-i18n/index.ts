import { registerSetting } from '../vulcan-lib';

registerSetting('locale', 'en', 'Your app\'s locale (“en”, “fr”, etc.)');

export { default as FormattedMessage } from './message';
export { intlShape } from './shape';
export { default as IntlProvider } from './provider';
