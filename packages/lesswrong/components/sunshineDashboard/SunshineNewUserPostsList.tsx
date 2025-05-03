import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper'
import { postGetCommentCountStr, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { hasRejectedContentSectionSetting } from '../../lib/instanceSettings';
import { useDialog } from '../common/withDialog';
import { DialogContent } from '../widgets/DialogContent';

const styles = (theme: ThemeType) => ({
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
  },
  post: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1em",
  },
  postBody: {
    marginTop: 12,
    fontSize: "1rem",
    '& li, & h1, & h2, & h3': {
      fontSize: "1rem"
    }
  },
  meta: {
    display: 'inline-block'
  },
  vote: {
    marginRight: 10
  },
  rejectButton: {
    marginLeft: 'auto',
  },
  llmScore: {
    cursor: 'pointer',
  },
  llmScoreSentenceBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 5,
    alignItems: 'center',
  },
  llmScoreSentence: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    maxWidth: '70%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',

  },
  llmScoreSentenceScore: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    maxWidth: '20%',
  },
})

const SunshineNewUserPostsList = ({posts, user, classes}: {
  posts?: SunshinePostsList[],
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList
}) => {
  const { MetaInfo, FormatDate, PostsTitle, SmallSideVote, PostActionsButton, ContentStyles, LinkPostMessage, RejectContentButton, RejectedReasonDisplay, LWDialog } = Components
  const { openDialog } = useDialog();

  // Highlight the given HTML by wrapping every sentence that has an LLM score in a
  // span whose background colour is determined by that score. Higher scores are shown
  // in a stronger red, lower scores in green. Hovering over a sentence will reveal the
  // score via the browser’s native `title` tooltip.
  function highlightHtml(
    html: string,
    sentenceScores: { sentence: string; score: number }[]
  ) {
    if (!html || sentenceScores.length === 0) return html;

    // Filter first; if no sentences remain, return html unmodified.
    // Only consider sentences that have a non-trivial length *and* a non-zero
    // score (the design calls for leaving score-0 sentences uncoloured).
    const meaningfulSentences = sentenceScores.filter(
      (s) =>
        s.score > 0 &&
        s.sentence &&
        s.sentence.trim().length >= 3
    );
    if (meaningfulSentences.length === 0) return html;

    // Parse the HTML into a detached DOM tree.
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div class="root">${html}</div>`, 'text/html');

    // Colour helper (score 0 → green, 1 → red).
    const scores = meaningfulSentences.map((s) => s.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore || 1;
    const scoreToColour = (score: number) => {
      const ratio = (score - minScore) / scoreRange;
      const hue = 120 - (ratio * 120);
      return `hsl(${hue}, 100%, 85%)`;
    };

    // Normalization util: strip basic markdown syntax and collapse spaces.
    const normalize = (str: string) =>
      str
        .replace(/^\s*[>*+-]\s+/, '') // bullets & blockquotes
        .replace(/^\s*#+\s+/, '') // heading #'s
        .replace(/^\s*\d+\.\s+/, '') // numbered list "1. "
        .replace(/[*_`~]/g, '') // emphasis markers
        .replace(/\s+/g, ' ')
        .trim();

    const processedSet = new Set<string>();
    const root = doc.body.firstElementChild as HTMLElement;

    // --- Pass 1: highlight whole-elements that match the sentence text exactly ---
    meaningfulSentences.forEach(({ sentence, score }) => {
      const target = normalize(sentence);
      if (!target) return;

      const treeWalker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode(node) {
          // Only consider elements that contain some text content.  We no longer
          // insist that an element be a leaf node, because sentences may span
          // multiple inline elements such as <strong>…</strong> or <em>…</em>.
          // By allowing non-leaf nodes we can match list items like:
          //   <li><strong>Title</strong>: rest of sentence</li>
          // which previously failed to highlight.
          return node.textContent?.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        },
      });

      let el: Node | null = treeWalker.nextNode();
      while (el) {
        const elText = normalize(el.textContent || '');
        if (elText === target) {
          (el as HTMLElement).style.backgroundColor = scoreToColour(score);
          (el as HTMLElement).title = `Score: ${score.toFixed(2)}`;
          (el as HTMLElement).classList.add('llm-highlight');
          processedSet.add(sentence);
          break;
        }
        el = treeWalker.nextNode();
      }
    });

    // --- Pass 2: fallback to substring search within remaining text nodes ---
    const remaining = meaningfulSentences.filter((s) => !processedSet.has(s.sentence));
    if (remaining.length === 0) return root.innerHTML;

    // Build map sentence → span template
    const sentenceToSpan = new Map<string, HTMLElement>();
    remaining.forEach(({ sentence, score }) => {
      const span = doc.createElement('span');
      span.className = 'llm-highlight';
      span.style.backgroundColor = scoreToColour(score);
      span.title = `Score: ${score.toFixed(2)}`;
      sentenceToSpan.set(sentence, span);
    });

    // Helper to process text nodes recursively.
    const processTextNode = (node: Text) => {
      const txt = node.textContent || '';
      if (!txt.trim()) return;

      for (const [sentence, spanTemplate] of sentenceToSpan) {
        const idx = txt.indexOf(sentence);
        if (idx !== -1) {
          const before = txt.slice(0, idx);
          const match = txt.slice(idx, idx + sentence.length);
          const after = txt.slice(idx + sentence.length);

          if (before) node.parentNode!.insertBefore(doc.createTextNode(before), node);

          const span = spanTemplate.cloneNode() as HTMLElement;
          span.textContent = match;
          node.parentNode!.insertBefore(span, node);

          if (after) {
            const afterNode = doc.createTextNode(after);
            node.parentNode!.insertBefore(afterNode, node);
            processTextNode(afterNode);
          }

          node.parentNode!.removeChild(node);
          sentenceToSpan.delete(sentence);
          return;
        }
      }
    };

    // Collect and process all text nodes.
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let text: Text | null = walker.nextNode() as Text | null;
    const nodes: Text[] = [];
    while (text) {
      nodes.push(text);
      text = walker.nextNode() as Text | null;
    }
    nodes.forEach(processTextNode);

    return root.innerHTML;
  }

  function handleLLMScoreClick(
    automatedContentEvaluation: SunshinePostsList_contents_automatedContentEvaluations,
    htmlContent: string | null | undefined
  ) {
    const highlightedHtml = highlightHtml(
      htmlContent || "",
      automatedContentEvaluation.sentenceScores || []
    );

    openDialog({
      name: "LLMScoreDialog",
      contents: () => (
        <LWDialog open={true}>
          <DialogContent>
            <div>
              <p>LLM Score: {automatedContentEvaluation.score}</p>
              <p>Post with highlighted sentences:</p>
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            </div>
          </DialogContent>
        </LWDialog>
      ),
    });
  }

 
  if (!posts) return null

  const newPosts = user.reviewedAt ? posts.filter(post => post.postedAt > user.reviewedAt!) : posts

  return (
    <div>
      {newPosts.map(post=><div className={classes.post} key={post._id}>
        <div className={classes.row}>
          <div>
            <Link to={`/posts/${post._id}`}>
              <PostsTitle post={post} showIcons={false} wrap/> 
              {(post.status !==2) && <MetaInfo>[Spam] {post.status}</MetaInfo>}
            </Link>
            <div>
              <span className={classes.meta}>
                <span className={classes.vote}>
                  <SmallSideVote document={post} collectionName="Posts"/>
                </span>
                <MetaInfo>
                  <FormatDate date={post.postedAt}/>
                </MetaInfo>
                <MetaInfo>
                  <Link to={`${postGetPageUrl(post)}#comments`}>
                    {postGetCommentCountStr(post)}
                  </Link>
                </MetaInfo>
              </span>
            </div>
          </div>
          
          {hasRejectedContentSectionSetting.get() && <span className={classes.rejectButton}>
            {post.rejected && <RejectedReasonDisplay reason={post.rejectedReason}/>}
            {post.contents?.automatedContentEvaluations && (
              <span
                className={classes.llmScore}
                onClick={() =>
                  handleLLMScoreClick(
                    post.contents!.automatedContentEvaluations!,
                    post.contents!.html
                  )
                }
              >
              LLM Score: {post.contents?.automatedContentEvaluations.score.toFixed(2)}
              </span>
            )}
            <RejectContentButton contentWrapper={{ collectionName: 'Posts', content: post }}/>
          </span>}
          
          <PostActionsButton post={post} />
        </div>
        {!post.draft && <div className={classes.postBody}>
          <LinkPostMessage post={post}/>
          <ContentStyles contentType="postHighlight">
            <div dangerouslySetInnerHTML={{__html: (post.contents?.html || "")}} />
          </ContentStyles>
        </div>}
      </div>)}
    </div>
  )
}

const SunshineNewUserPostsListComponent = registerComponent('SunshineNewUserPostsList', SunshineNewUserPostsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUserPostsList: typeof SunshineNewUserPostsListComponent
  }
}
