import { makeEditableOptions, Chapters } from './collection.js'
import { addEditableCallbacks } from '../../../server/editor/make_editable_callbacks.js';

addEditableCallbacks({collection: Chapters, options: makeEditableOptions})