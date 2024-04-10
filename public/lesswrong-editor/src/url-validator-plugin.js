import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { validateUrl } from "./url-validator-utils";

/**
 * CkEditor plugin to validate and fix link URLs
 */
export default class UrlValidator extends Plugin {
	init() {
		this.editor.model.document.on('change:data', (eventInfo) => {
			for (const change of eventInfo.source.differ.getChanges()) {
				const { type, attributeKey: key, attributeNewValue: value } = change;
				if (type === 'attribute' && key === 'linkHref' && value) {
					this._updateUrlIfInvalid(value);
				}
			}
		});
	}

	_updateUrlIfInvalid(url) {
		const newUrl = validateUrl(url);
		if (newUrl !== url) {
			this.editor.model.change((writer) => {
				this.editor.commands.get('link').execute(newUrl);
			});
		}
	}
}
