// EXPERIMENT (experiment/iframe-layout-ronny-exp3): the source of Experiment 3's second demo post, "How
// content blocks behave next to widgets" (see packages/lesswrong/server/layoutDemo/blocksDemoHtml.ts).
// Placeholder until the content block designs are decided.
export const BLOCKS_DEMO_POST_HTML = `<p>This post shows how each kind of content block behaves next to a widget the text wraps around. It is being written now.</p>
<!--widget:forecast-card right 33%-->
<p>Paragraphs flow beside a widget: their lines get shorter while the widget is next to them, and run the full width of the column below it. This paragraph is long enough to show that. Text wraps beside a widget only when at least 300 pixels of text fit next to it; on narrower screens the widget shows full width instead, and every block below simply follows it.</p>
<h2>Headings</h2>
<p>More blocks will follow here.</p>
`;
