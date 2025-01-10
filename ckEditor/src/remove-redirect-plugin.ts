import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import Matcher from '@ckeditor/ckeditor5-engine/src/view/matcher';
import type { ClipboardPipeline } from '@ckeditor/ckeditor5-clipboard';

/**
 * CkEditor plugin to replace pasted redirect links with their target (currently only for google redirects)
 *
 * An issue with this is that we can't distinguish someone actually trying to paste in a redirect link from
 * doing it accidentally as a result of using google docs publish to web. There isn't really a way round this.
 * Changing the link only on paste helps with this a bit, because you can still manually insert a redirect link if you want.
 */
export default class RemoveRedirect extends Plugin {
	init() {
		const clipboardPipeline: ClipboardPipeline = this.editor.plugins.get('ClipboardPipeline')
		clipboardPipeline.on('inputTransformation', ( _, data ) => {
				if ( data.content ) {
					const writer = new UpcastWriter( data.content.document );
					
					const documentRange = writer.createRangeIn(data.content);
					const urlElems = this._getRedirectUrls(documentRange);

					for (const {item, url} of urlElems) {
						writer.setAttribute('href', url, item);
					}
				}
			}
		);
	}

	_getRedirectUrls(documentRange: AnyBecauseTodo) {
		// Regex match examples:
		// https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page&sa=D&source=editors&ust=1667922372715536&usg=AOvVaw2NyT5CZhfsrRY_zzMs2UUJ
		//                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ <- first match group matches this, stopping at the first &
		// https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page
		//															^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ <- if there are no more params (no &), match up to the end of the string
		const hrefPattern = /^https\:\/\/www\.google\.com\/url\?q=(\S+?)(\&|$)/;
		// NOTE: Currently we only care about google redirect links because these appear on links copy pasted from "publish to web" google docs,
		// if we need to add more in future we should make an array of matchers and iterate over them
		const redirectUrlMatcher = new Matcher({
			name: 'a',
			attributes: {
				href: hrefPattern,
			}
		});

		return [...documentRange].map(({ item, type }) => {
			if (!(type === 'elementStart' && redirectUrlMatcher.match(item))) return null;

			const url = item.getAttribute('href').match(hrefPattern)[1];
			return {item, url};
		}).filter(x => x !== null);
	}
}
