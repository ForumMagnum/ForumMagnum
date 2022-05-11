
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
	removeProvnameers: [ 'instagram', 'twitter', 'googleMaps', 'flickr', 'facebook', 'spotify', 'vimeo', 'dailymotion'],
	extraProvnameers: [
		{
			id: 'Elicit',
			url: /^(?:forecast.)?elicit.org\/binary\/questions\/([a-zA-Z0-9_-]+)/,
			html: ([match, questionId]) => `
				<div data-elicit-name="${questionId}" style="position:relative;height:50px;background-color: rgba(0,0,0,0.05);display: flex;justify-content: center;align-items: center;" class="elicit-binary-prediction">
					<div style=>Elicit Prediction (<a href="${match}">${match}</a>)</div>
				</div>
			`
		},
		{
			id: 'Metaculus',
			url: /^metaculus\.com\/questions\/([a-zA-Z0-9]{1,6})?/,
			html: ([match, questionNumber]) => `
				<div data-metaculus-name="${questionNumber}" style="background-color: #2c3947;" class="metaculus-preview">
					<iframe style="height: 400px; wnameth: 100%; border: none;" src="https://d3s0w6fek99l5b.cloudfront.net/s/1/questions/embed/${questionNumber}/?plot=pdf"/>
				</div>
			`
		},
		{
		  id: 'Thoughtsaver',
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
	  "id": "#2016 LessWrong Diaspora Survey Analysis: Part Two (LessWrong Use, Successorship, Diaspora)",
	  "link": "/posts/S9B9FgaTgB9yCEi3k/2016-lesswrong-diaspora-survey-analysis-part-two-lesswrong",
	  "text": "2016 LessWrong Diaspora Survey Analysis: Part Two (LessWrong Use, Successorship, Diaspora)"
	},
	  {
		"id": "#Notes From an Apocalypse",
		"link": "/posts/iuNSrBoX2W5qHCAAo/notes-from-an-apocalypse",
		"text": "Notes From an Apocalypse"
	  },
	  {
		"id": "#Self-Organised Neural Networks:\nA simple, natural and efficient way to intelligence",
		"link": "/posts/rCP5iTYLtfcoC8NXd/self-organised-neural-networks-a-simple-natural-and",
		"text": "Self-Organised Neural Networks:\nA simple, natural and efficient way to intelligence"
	  },
	  {
		"id": "#Diseased thinking: dissolving questions about disease",
		"link": "/posts/895quRDaK6gR2rM82/diseased-thinking-dissolving-questions-about-disease",
		"text": "Diseased thinking: dissolving questions about disease"
	  },
	  {
		"id": "#Discussion with Eliezer Yudkowsky on AGI interventions",
		"link": "/posts/CpvyhFy9WvCNsifkY/discussion-with-eliezer-yudkowsky-on-agi-interventions",
		"text": "Discussion with Eliezer Yudkowsky on AGI interventions"
	  },
	  {
		"id": "#Dying Outside",
		"link": "/posts/bshZiaLefDejvPKuS/dying-outside",
		"text": "Dying Outside"
	  },
	  {
		"id": "#DeepMind: Generally capable agents emerge from open-ended play",
		"link": "/posts/mTGrrX8SZJ2tQDuqz/deepmind-generally-capable-agents-emerge-from-open-ended",
		"text": "DeepMind: Generally capable agents emerge from open-ended play"
	  },
	  {
		"id": "#Dark Arts of Rationality",
		"link": "/posts/4DBBQkEQvNEWafkek/dark-arts-of-rationality",
		"text": "Dark Arts of Rationality"
	  },
	  {
		"id": "#Don't die with dignity; instead play to your outs",
		"link": "/posts/xF7gBJYsy6qenmmCS/don-t-die-with-dignity-instead-play-to-your-outs",
		"text": "Don't die with dignity; instead play to your outs"
	  },
	  {
		"id": "#Dark Matters",
		"link": "/posts/rNFzvii8LtCL5joJo/dark-matters",
		"text": "Dark Matters"
	  },
	  {
		"id": "#DARPA Digital Tutor: Four Months to Total Technical Expertise?",
		"link": "/posts/vbWBJGWyWyKyoxLBe/darpa-digital-tutor-four-months-to-total-technical-expertise",
		"text": "DARPA Digital Tutor: Four Months to Total Technical Expertise?"
	  },
	  {
		"id": "#Debate on Instrumental Convergence between LeCun, Russell, Bengio, Zador, and More",
		"link": "/posts/WxW6Gc6f2z3mzmqKs/debate-on-instrumental-convergence-between-lecun-russell",
		"text": "Debate on Instrumental Convergence between LeCun, Russell, Bengio, Zador, and More"
	  },
	  {
		"id": "#dalle2 comments",
		"link": "/posts/XCtFBWoMeFwG8myYh/dalle2-comments",
		"text": "dalle2 comments"
	  },
	  {
		"id": "#Draft report on AI timelines",
		"link": "/posts/KrJfoZzpSDpnrv9va/draft-report-on-ai-timelines",
		"text": "Draft report on AI timelines"
	  },
	  {
		"id": "#Discontinuous progress in history: an update",
		"link": "/posts/CeZXDmp8Z363XaM6b/discontinuous-progress-in-history-an-update",
		"text": "Discontinuous progress in history: an update"
	  },
	  {
		"id": "#Do a cost-benefit analysis of your technology usage",
		"link": "/posts/fri4HdDkwhayCYFaE/do-a-cost-benefit-analysis-of-your-technology-usage",
		"text": "Do a cost-benefit analysis of your technology usage"
	  },
	  {
		"id": "#Dear Self; We Need To Talk About Social Media",
		"link": "/posts/fwNskn4dosKng9BCB/dear-self-we-need-to-talk-about-social-media",
		"text": "Dear Self; We Need To Talk About Social Media"
	  },
	  {
		"id": "#Doing your good deed for the day",
		"link": "/posts/r8stxYL29NF9w53am/doing-your-good-deed-for-the-day",
		"text": "Doing your good deed for the day"
	  },
	  {
		"id": "#Double Crux — A Strategy for Mutual Understanding",
		"link": "/posts/exa5kmvopeRyfJgCy/double-crux-a-strategy-for-mutual-understanding",
		"text": "Double Crux — A Strategy for Mutual Understanding"
	  },
	  {
		"id": "#Dangers of steelmanning / principle of charity",
		"link": "/posts/wW9mcj8GP5avS5ovW/dangers-of-steelmanning-principle-of-charity",
		"text": "Dangers of steelmanning / principle of charity"
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

