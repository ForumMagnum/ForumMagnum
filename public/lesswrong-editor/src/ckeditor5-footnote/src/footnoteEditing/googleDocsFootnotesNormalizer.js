import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import Matcher from '@ckeditor/ckeditor5-engine/src/view/matcher';
import { ATTRIBUTES, CLASSES, ELEMENTS } from '../constants';

export default class GoogleDocsFootnotesNormalizer {
	isActive() {
		return true;
	}
	execute(data) {
		const writer = new UpcastWriter( data.content.document );

		const range = writer.createRangeIn( data.content );

		const footnoteBacklinkMatcher = new Matcher({
			name: 'a',
			attributes: {
				id: /^ftnt\d+$/
			}
		})

		const backlinks = []
		for ( const value of range ) {
			const { item } = value
			if (value.type === 'elementStart') {
				backlinks.push(item)
			}
		}
		for (const item of backlinks) {
			writer.replace(item, writer.createElement('p', {[ATTRIBUTES.footnoteContent]: ''}, item.getChildren()))
			writer.setAttribute(ATTRIBUTES.footnoteContent, '', item)
		}
	}
}
