import { registerSetting } from '../vulcan-lib';

registerSetting('forms.warnUnsavedChanges', false, 'Warn user about unsaved changes before leaving route', true);

import './components';

export * from './utils';
export { default as FormWrapper } from '../../components/vulcan-forms/FormWrapper';
