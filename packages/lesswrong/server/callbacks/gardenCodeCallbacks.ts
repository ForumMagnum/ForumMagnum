import { makeEditableOptions, GardenCodes } from "../../lib/collections/gardencodes/collection";
import { addEditableCallbacks } from "../editor/make_editable_callbacks";

addEditableCallbacks({collection: GardenCodes, options: makeEditableOptions})
