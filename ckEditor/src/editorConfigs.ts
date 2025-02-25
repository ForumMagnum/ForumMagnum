import type { MathConfig } from "./ckeditor5-math/math";

const headingOptions = {
	options: [
		{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
		{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
		{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
		{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' }	
	]
};

const mathConfig: MathConfig = {
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
			html: ([match, questionId]: RegExpMatchArray) => `
				<div data-elicit-id="${questionId}" style="position:relative;height:50px;background-color: rgba(0,0,0,0.05);display: flex;justify-content: center;align-items: center;" class="elicit-binary-prediction">
					<div style=>Elicit Prediction (<a href="${match}">${match}</a>)</div>
				</div>
			`
		},
		{
			name: 'Metaculus',
			url: /^metaculus\.com\/questions\/([a-zA-Z0-9]{1,6})?/,
			html: ([match, questionNumber]: RegExpMatchArray) => `
				<div data-metaculus-id="${questionNumber}" style="background-color: #2c3947;" class="metaculus-preview">
					<iframe style="height: 400px; width: 100%; border: none;" src="https://d3s0w6fek99l5b.cloudfront.net/s/1/questions/embed/${questionNumber}/?plot=pdf"/>
				</div>
			`
		},
		{
		  name: 'Thoughtsaver',
		  url: /^app.thoughtsaver.com\/embed\/([a-zA-Z0-9?&_=-]*)/,
		  html: ([match,urlParams]: RegExpMatchArray) => `
		    <div class="thoughtSaverFrameWrapper">
		      <iframe class="thoughtSaverFrame" title="Thought Saver flashcard quiz" src="https://app.thoughtsaver.com/embed/${urlParams}"></iframe>
		    </div>
		  `
		},
		{
			name: "Manifold",
			url: /^manifold\.markets\/(?:embed\/)?(\w+\/[\w-]+)$/,
			html: ([match, longslug]: RegExpMatchArray) => `
				<div data-manifold-id="${longslug}" class="manifold-preview">
					<iframe style="height: 405px; width: 100%; border: 1px solid gray;" src="https://manifold.markets/embed/${longslug}"/>
				</div>
			`
		},
		{
			name: "Neuronpedia",
			url: /^neuronpedia\.org\/([^?]+)\?(?=.*embed=true(&|$))(\w+=[a-zA-Z0-9\-_.!~*'()%]+)(?:&\w+=[a-zA-Z0-9\-_.!~*'()%+]+)*$/,
			html: ([match]: RegExpMatchArray) => `
				<div class="neuronpedia-preview">
					<iframe style="height: 360px; max-width: 639px; border: 1px solid gray; border-radius: 6; overflow: hidden;" scrolling="no" src="https://${match}"/>
				</div>
			`,
		},
		{
			name: "StrawPoll",
			url: /^https:\/\/strawpoll\.com\/(polls\/)?([\w-]+)$/,
			html: ([match, _urlFragment, pollId]: RegExpMatchArray) => `
				<div class="strawpoll-embed" id="strawpoll_${pollId}" style="height: 480px; max-width: 640px; width: 100%; margin: 0 auto; display: flex; flex-direction: column;">
					<iframe title="StrawPoll Embed" id="strawpoll_iframe_${pollId}" src="https://strawpoll.com/embed/polls/${pollId}" style="position: static; visibility: visible; display: block; width: 100%; flex-grow: 1;" frameborder="0" allowfullscreen allowtransparency>Loading...</iframe>
					<script async src="https://cdn.strawpoll.com/dist/widgets.js" charset="utf-8"></script>
				</div>
			`
		},
		{
			name: "Metaforecast",
			url: /^metaforecast\.org\/questions\/([\w-]+)$/,
			html: ([match, slug]: RegExpMatchArray) => `
				<div data-metaforecast-id="${slug}" class="metaforecast-preview">
					<iframe style="height: 405px; width: 100%; border: 1px solid gray;" src="https://metaforecast.org/questions/embed/${slug}"/>
				</div>
			`
		},
		{
			name: 'OWID',
			url: /^ourworldindata\.org\/grapher\/([\w-]+).*/,
			html: ([match, slug]: RegExpMatchArray) => {
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
			html: ([match]: RegExpMatchArray) => {
				return `
					<div class="estimaker-preview">
						<iframe style="height: 400px; width: 100%; border: none;" src="https://${match}"/>
					</div>
				`
			}
		},
		{
			name: 'Viewpoints',
			url: /^viewpoints\.xyz\/polls\/([\w-]+)$/,
			html: ([match, slug]: RegExpMatchArray) => {
				return `
					<div data-viewpoints-slug="${slug}" class="viewpoints-preview">
						<iframe style="height: 400px; width: 100%; border: none;" src="https://viewpoints.xyz/embed/polls/${slug}"/>
					</div>
				`
			}
		},
		{
			name: 'Calendly',
			url: /^calendly\.com\/[\w-]+(\/[\w-]+)?\/?$/,
			html: ([match]: RegExpMatchArray) => {
				return `
					<div class="calendly-preview">
						<iframe
							sandbox="allow-scripts allow-same-origin allow-forms"
							src="https://${match}"
						/>
					</div>
				`
			}
		},
		{
			name: 'LW Artifacts',
			// Regex should match URLS of the form: lwartifacts.vercel.app/artifacts/income
			url: /^lwartifacts\.vercel\.app\/artifacts\/([a-zA-Z0-9_-]+)/,
			html: ([match]: RegExpMatchArray) => `
				<div data-lwartifacts-id="${match}" class="lwartifacts-preview">
					<iframe style="height: 500px; width: 100%; border: none;" src="https://${match}"/>
				</div>
			`
		},
	],
};

export const postEditorConfig = {
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
