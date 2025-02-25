import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { validateUrl } from "./url-validator-utils";
import type Document from "@ckeditor/ckeditor5-engine/src/model/document";


/**
 * CkEditor plugin to validate and fix link URLs
 */
export default class UrlValidator extends Plugin {
	init() {
		this.editor.model.document.on('change:data', (eventInfo) => {
			// JB: Downcast the event source to a document (which it should be). For
			// some reason my language server is able to figure out what type this is
			// from just the fact that it's the second argument of the .on(), but
			// when actually compiled with webpack it just comes out as "object".
			const source: Document = eventInfo.source as Document;

			for (const change of source?.differ?.getChanges()) {
				if (change.type === "attribute") {
					const key = change.attributeKey;
					const value = change.attributeNewValue as string;
					if (key === 'linkHref' && value) {
						this._updateUrlIfInvalid(value);
					}
				}
			}
		});
	}

	_updateUrlIfInvalid(url: string) {
		const newUrl = validateUrl(url);
		if (newUrl !== url) {
			this.editor.model.change((writer) => {
				this.editor.commands.get('link')?.execute(newUrl);
			});
		}
	}
}
