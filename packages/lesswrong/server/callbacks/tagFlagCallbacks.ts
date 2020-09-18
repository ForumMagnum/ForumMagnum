import { makeEditableOptions, TagFlags } from "../../lib/collections/tagFlags/collection";
import { addEditableCallbacks } from "../editor/make_editable_callbacks";

addEditableCallbacks({collection: TagFlags, options: makeEditableOptions})
