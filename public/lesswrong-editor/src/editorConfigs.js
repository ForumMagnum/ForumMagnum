
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
		}
	]
}


//For development purposes, ensure deletion later
const fetchSuggestions = () => {
  return [
	  {
		"id": "#iuNSrBoX2W5qHCAAo",
		"link": "notes-from-an-apocalypse",
		"userId": "37775",
		"name": "Notes From an Apocalypse"
	  },
	  {
		"id": "#rCP5iTYLtfcoC8NXd",
		"link": "self-organised-neural-networks-a-simple-natural-and",
		"userId": "37775",
		"name": "Self-Organised Neural Networks:\nA simple, natural and efficient way to intelligence"
	  },
	  {
		"id": "#895quRDaK6gR2rM82",
		"link": "diseased-thinking-dissolving-questions-about-disease",
		"userId": "37775",
		"name": "Diseased thinking: dissolving questions about disease"
	  },
	  {
		"id": "#CpvyhFy9WvCNsifkY",
		"link": "discussion-with-eliezer-yudkowsky-on-agi-interventions",
		"userId": "37775",
		"name": "Discussion with Eliezer Yudkowsky on AGI interventions"
	  },
	  {
		"id": "#bshZiaLefDejvPKuS",
		"link": "dying-outside",
		"userId": "37775",
		"name": "Dying Outside"
	  },
	  {
		"id": "#mTGrrX8SZJ2tQDuqz",
		"link": "deepmind-generally-capable-agents-emerge-from-open-ended",
		"userId": "37775",
		"name": "DeepMind: Generally capable agents emerge from open-ended play"
	  },
	  {
		"id": "#4DBBQkEQvNEWafkek",
		"link": "dark-arts-of-rationality",
		"userId": "37775",
		"name": "Dark Arts of Rationality"
	  },
	  {
		"id": "#xF7gBJYsy6qenmmCS",
		"link": "don-t-die-with-dignity-instead-play-to-your-outs",
		"userId": "37775",
		"name": "Don't die with dignity; instead play to your outs"
	  },
	  {
		"id": "#rNFzvii8LtCL5joJo",
		"link": "dark-matters",
		"userId": "37775",
		"name": "Dark Matters"
	  },
	  {
		"id": "#vbWBJGWyWyKyoxLBe",
		"link": "darpa-digital-tutor-four-months-to-total-technical-expertise",
		"userId": "37775",
		"name": "DARPA Digital Tutor: Four Months to Total Technical Expertise?"
	  },
	  {
		"id": "#WxW6Gc6f2z3mzmqKs",
		"link": "debate-on-instrumental-convergence-between-lecun-russell",
		"userId": "37775",
		"name": "Debate on Instrumental Convergence between LeCun, Russell, Bengio, Zador, and More"
	  },
	  {
		"id": "#XCtFBWoMeFwG8myYh",
		"link": "dalle2-comments",
		"userId": "37775",
		"name": "dalle2 comments"
	  },
	  {
		"id": "#KrJfoZzpSDpnrv9va",
		"link": "draft-report-on-ai-timelines",
		"userId": "37775",
		"name": "Draft report on AI timelines"
	  },
	  {
		"id": "#CeZXDmp8Z363XaM6b",
		"link": "discontinuous-progress-in-history-an-update",
		"userId": "37775",
		"name": "Discontinuous progress in history: an update"
	  },
	  {
		"id": "#fri4HdDkwhayCYFaE",
		"link": "do-a-cost-benefit-analysis-of-your-technology-usage",
		"userId": "37775",
		"name": "Do a cost-benefit analysis of your technology usage"
	  },
	  {
		"id": "#fwNskn4dosKng9BCB",
		"link": "dear-self-we-need-to-talk-about-social-media",
		"userId": "37775",
		"name": "Dear Self; We Need To Talk About Social Media"
	  },
	  {
		"id": "#r8stxYL29NF9w53am",
		"link": "doing-your-good-deed-for-the-day",
		"userId": "37775",
		"name": "Doing your good deed for the day"
	  },
	  {
		"id": "#exa5kmvopeRyfJgCy",
		"link": "double-crux-a-strategy-for-mutual-understanding",
		"userId": "37775",
		"name": "Double Crux — A Strategy for Mutual Understanding"
	  },
	  {
		"id": "#wW9mcj8GP5avS5ovW",
		"link": "dangers-of-steelmanning-principle-of-charity",
		"userId": "37775",
		"name": "Dangers of steelmanning / principle of charity"
	  },
	  {
		"id": "#4FcxgdvdQP45D6Skg",
		"link": "disguised-queries",
		"userId": "37775",
		"name": "Disguised Queries"
	  }
  ]
}





const mentionConfig = {
  feeds: [
	{
	  marker: '#',
	  feed: fetchSuggestions, //[ '@Barney', '@Lily', '@Marry Ann', '@Marshall', '@Robin', '@Ted', '@Vlad' ],
	  minimumCharacters: 1
	}
  ]
}

export const postEditorConfig = {
	blockToolbar: [
		'imageUpload',
		'insertTable',
		'horizontalLine',
		'mathDisplay',
		'mediaEmbed',
		'footnote'
	],
	toolbar: {
		items: [
			'restyledCommentButton',
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
			'codeBlock',
			'|',
			'trackChanges',
			'math',
			'footnote',
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
    mention: mentionConfig
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
  	mention: mentionConfig
};

