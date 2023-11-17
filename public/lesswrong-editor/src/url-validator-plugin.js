import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

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
		const newUrl = this._validateUrl(url);
		if (newUrl !== url) {
			this.editor.model.change((writer) => {
				this.editor.commands.get('link').execute(newUrl);
			});
		}
	}

	_validateUrl(url) {
		try {
			// This will validate the URL - importantly, it will fail if the
			// protocol is missing
			new URL(url);
		} catch (e) {
			if (url.search(/[^@]+@[^.]+\.[^\n\r\f]+$/) === 0) {
				// Add mailto: to email addresses
				return this._tryToFixUrl(url, `mailto:${url}`);
			} else if (url.search(/\/.*/) === 0) {
				// This is probably _meant_ to be relative. We could prepend the
				// siteUrl from instanceSettings, but this seems unnecessarily
				// risky - let's just do nothing.
			} else if (url.search(/(https?:)?\/\//) !== 0) {
				// Add https:// to anything else
				return this._tryToFixUrl(url, `https://${url}`);
			}
		}

	  return url;
	}

	_tryToFixUrl(oldUrl, newUrl) {
		try {
			// Only return the edited version if this actually fixed the problem
			new URL(newUrl);
			return newUrl;
		} catch (e) {
			return oldUrl;
		}
	}
}
