
const headingOptions = {
	options: [
		{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
		{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
		{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
		{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' }	
	]
};

const mathConfig = {
	engine: 'mathjax',
	outputType: 'span',
	forceOutputType: true,
	enablePreview: true
}

const embedConfig = {
	toolbar: [ 'comment' ],
	previewsInData: true,
	removeProviders: [ 'instagram', 'twitter', 'googleMaps', 'flickr', 'facebook', 'spotify', 'vimeo', 'dailymotion'],
	extraProviders: [
		{
			name: 'Elicit',
			url: /^(?:forecast.)?elicit.org\/binary\/questions\/([a-zA-Z0-9_-]+)/,
			html: ([match, questionId]) => `
				<div data-elicit-id="${questionId}" style="position:relative;height:50px;background-color: rgba(0,0,0,0.05);display: flex;justify-content: center;align-items: center;" class="elicit-binary-prediction">
					<div style=>Elicit Prediction (<a href="${match}">${match}</a>)</div>
				</div>
			`
		},
		{
			name: 'Metaculus',
			url: /^metaculus\.com\/questions\/([a-zA-Z0-9]{1,6})?/,
			html: ([match, questionNumber]) => `
				<div data-metaculus-id="${questionNumber}" style="background-color: #2c3947;" class="metaculus-preview">
					<iframe style="height: 400px; width: 100%; border: none;" src="https://d3s0w6fek99l5b.cloudfront.net/s/1/questions/embed/${questionNumber}/?plot=pdf"/>
				</div>
			`
		},
		{
		  name: 'Thoughtsaver',
		  url: /^app.thoughtsaver.com\/embed\/([a-zA-Z0-9?&_=-]*)/,
		  html: ([match,urlParams]) => `
		    <div class="thoughtSaverFrameWrapper">
		      <iframe class="thoughtSaverFrame" title="Thought Saver flashcard quiz" src="https://app.thoughtsaver.com/embed/${urlParams}"></iframe>
		    </div>
		  `
		},
		{
			name: "Manifold",
			url: /^manifold\.markets\/(?:embed\/)?(\w+\/[\w-]+)$/,
			html: ([match, longslug]) => `
				<div data-manifold-id="${longslug}" class="manifold-preview">
					<iframe style="height: 405px; width: 100%; border: 1px solid gray;" src="https://manifold.markets/embed/${longslug}"/>
				</div>
			`
		},
		{
			name: "StrawPoll",
			url: /^https:\/\/strawpoll\.com\/polls\/([\w-]+)$/,
			html: ([match, pollId]) => `
				<div class="strawpoll-embed" id="strawpoll_${pollId}" style="height: 480px; max-width: 640px; width: 100%; margin: 0 auto; display: flex; flex-direction: column;">
					<iframe title="StrawPoll Embed" id="strawpoll_iframe_${pollId}" src="https://strawpoll.com/embed/polls/${pollId}" style="position: static; visibility: visible; display: block; width: 100%; flex-grow: 1;" frameborder="0" allowfullscreen allowtransparency>Loading...</iframe>
					<script async src="https://cdn.strawpoll.com/dist/widgets.js" charset="utf-8"></script>
				</div>
			`
		}
		,
		{
			name: "Metaforecast",
			url: /^metaforecast\.org\/questions\/([\w-]+)$/,
			html: ([match, slug]) => `
				<div data-metaforecast-id="${slug}" class="metaforecast-preview">
					<iframe style="height: 405px; width: 100%; border: 1px solid gray;" src="https://metaforecast.org/questions/embed/${slug}"/>
				</div>
			`
		},
		{
			name: 'OWID',
			url: /^ourworldindata\.org\/grapher\/([\w-]+).*/,
			html: ([match, slug]) => {
				return `
					<div data-owid-slug="${slug}" class="owid-preview">
						<iframe style="height: 400px; width: 100%; border: none;" src="https://${match}"/>
					</div>
				`
			}
		},
		{
			name: 'Estimaker',
			url: /^estimaker\.app\/_\/([\w-]+).*/,
			html: ([match]) => {
				return `
					<div class="estimaker-preview">
						<iframe style="height: 400px; width: 100%; border: none;" src="https://${match}"/>
					</div>
				`
			}
		},
	]
}

export const postEditorConfig = {
	toolbar: {
		items: [
			'|',
			'heading',
			'|',
			'bold',
			'italic',
			'strikethrough',
			'|',
			'link',
			'|',
			'blockQuote',
			'bulletedList',
			'numberedList',
			'|',
			'imageUpload',
		],
		shouldNotGroupWhenFull: true,
	},
	image: {
		toolbar: [
			'imageTextAlternative',
			'comment',
			'toggleImageCaption',
		],
	},
	heading: headingOptions,
	table: {
		contentToolbar: [
			'tableColumn', 'tableRow', 'mergeTableCells',
			'tableProperties', 'tableCellProperties'
		],
		tableToolbar: [ 'comment' ]
	},
	math: mathConfig,
	mediaEmbed: embedConfig,
};

export const commentEditorConfig = {
	toolbar: [
		'heading',
		'|',
		'bold',
		'italic',
		'strikethrough',
		'|',
		'link',
		'|',
		'blockQuote',
		'bulletedList',
		'numberedList',
		'|',
		'math',
		'footnote',
	],
	image: {
		toolbar: [
			'imageTextAlternative'
		]
	},
	heading: headingOptions,
	table: {
		contentToolbar: [
			'tableColumn', 'tableRow', 'mergeTableCells',
			'tableProperties', 'tableCellProperties'
		],
		tableToolbar: [ 'comment' ]
	},
	math: mathConfig,
	mediaEmbed: embedConfig,
};

