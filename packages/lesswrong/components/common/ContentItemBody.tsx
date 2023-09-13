import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { isServer } from '../../lib/executionEnvironment';
import { linkIsExcludedFromPreview } from '../linkPreview/HoverPreviewLink';
import { isEAForum } from '../../lib/instanceSettings';
import withUser from './withUser';
import { withLocation } from '../../lib/routeUtil';
import Mark from 'mark.js';
import { captureException } from '../../lib/utils/errorUtil';

const styles = (theme: ThemeType): JssStyles => ({
  scrollIndicatorWrapper: {
    display: "block",
    position: "relative",
    
    paddingLeft: 13,
    paddingRight: 13,
  },
  
  hidden: {
    display: "none !important",
  },
  
  scrollIndicator: {
    position: "absolute",
    top: "50%",
    marginTop: -28,
    cursor: "pointer",
    
    // Scroll arrows use the CSS Triangle hack - see
    // https://css-tricks.com/snippets/css/css-triangle/ for a full explanation
    borderTop: "20px solid transparent",
    borderBottom: "20px solid transparent",
  },
  
  scrollIndicatorLeft: {
    left: 0,
    borderRight: `10px solid ${theme.palette.grey[310]}`,
    
    "&:hover": {
      borderRight: `10px solid ${theme.palette.grey[620]}`,
    },
  },
  
  scrollIndicatorRight: {
    right: 0,
    borderLeft: `10px solid ${theme.palette.grey[310]}`,
    
    "&:hover": {
      borderLeft: `10px solid ${theme.palette.grey[620]}`,
    },
  },
  
  scrollableLaTeX: {
    // Cancel out the margin created by the block elements above and below,
    // so that we can convert them into padding and get a larger touch
    // target.
    // !important to take precedence over .mjx-chtml
    marginTop: "-1em !important",
    marginBottom: "-1em !important",
    
    paddingTop: "2em !important",
    paddingBottom: "2em !important",
    
    // Hide the scrollbar (on browsers that support it) because our scroll
    // indicator is better
    "-ms-overflow-style": "-ms-autohiding-scrollbar",
    "&::-webkit-scrollbar": {
      display: "none",
    },
    scrollbarWidth: "none",
  },

});

interface ExternalProps {
  dangerouslySetInnerHTML: { __html: string };
  className?: string;
  description?: string;
  // Only Implemented for Tag Hover Previews
  noHoverPreviewPrefetch?: boolean;
  nofollow?: boolean;
  idInsertions?: Record<string, React.ReactNode>;
  highlightedSubstrings?: string[];
}
interface ContentItemBodyProps extends ExternalProps, WithStylesProps, WithUserProps, WithLocationProps {}
interface ContentItemBodyState {
  updatedElements: boolean,
}

// The body of a post/comment/etc, created by taking server-side-processed HTML
// out of the result of a GraphQL query and adding some decoration to it. In
// particular, if this is the client-side render, adds scroll indicators to
// horizontally-scrolling LaTeX blocks.
//
// This doesn't apply styling (other than for the decorators it adds) because
// it's shared between entity types, which have styling that differs.
//
// Props:
//    className <string>: Name of an additional CSS class to apply to this element.
//    dangerouslySetInnerHTML: Follows the same convention as
//      dangerouslySetInnerHTML on a div, ie, you set the HTML content of this
//      by passing dangerouslySetInnerHTML={{__html: "<p>foo</p>"}}.
//    description: (Optional) A human-readable string describing where this
//      content came from. Used in error logging only, not displayed to users.
class ContentItemBody extends Component<ContentItemBodyProps,ContentItemBodyState> {
  bodyRef: any
  replacedElements: Array<any>
  
  constructor(props: ContentItemBodyProps) {
    super(props);
    this.bodyRef = React.createRef();
    this.replacedElements = [];
    this.state = {updatedElements:false}
  }

  componentDidMount () {
    this.applyLocalModifications();
  }

  componentDidUpdate(prevProps: ContentItemBodyProps) {
    const htmlChanged = prevProps.dangerouslySetInnerHTML?.__html !== this.props.dangerouslySetInnerHTML?.__html;
    const highlightedSubstringsChanged = prevProps.highlightedSubstrings !== this.props.highlightedSubstrings;
    if (htmlChanged || highlightedSubstringsChanged) {
      this.replacedElements = [];
      this.applyLocalModifications();
    }
  }
  
  applyLocalModifications() {
    try {
      this.markScrollableLaTeX();
      this.collapseFootnotes();
      this.markHoverableLinks();
      this.markElicitBlocks();
      this.hideStrawPollLoggedOut();
      this.applyIdInsertions();
      this.setState({updatedElements: true})
      
    } catch(e) {
      // Don't let exceptions escape from here. This ensures that, if client-side
      // modifications crash, the post/comment text still remains visible.
      captureException(e);
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }
  
  
  render() {
    const html = this.props.nofollow ? addNofollowToHTML(this.props.dangerouslySetInnerHTML.__html) : this.props.dangerouslySetInnerHTML.__html
    
    return (<React.Fragment>
      <div
        className={classNames(this.props.classes.root, this.props.className)}
        ref={this.bodyRef}
        dangerouslySetInnerHTML={{__html: html}}
      />
      {
        this.replacedElements.map(replaced => {
          return ReactDOM.createPortal(
            replaced.replacementElement,
            replaced.container
          );
        })
      }
    </React.Fragment>);
  }
  
  // Given an HTMLCollection, return an array of the elements inside it. Note
  // that this is covering for a browser-specific incompatibility: in Edge 17
  // and earlier, HTMLCollection has `length` and `item` but isn't iterable.
  htmlCollectionToArray(collection: HTMLCollectionOf<HTMLElement>) {
    if (!collection) return [];
    let ret: Array<HTMLElement> = [];
    for (let i=0; i<collection.length; i++)
      ret.push(collection.item(i)!);
    return ret;
  }
  
  // Find LaTeX elements inside the body, check whether they're wide enough to
  // need horizontal scroll, and if so, give them
  // `classes.hasHorizontalScroll`. 1They will have a scrollbar regardless;
  // this gives them additional styling which makes the scrollability
  // obvious, if your browser hides scrollbars like Mac does and most
  // mobile browsers do).
  // This is client-only because it requires measuring widths.
  markScrollableLaTeX = () => {
    const { classes } = this.props;
    
    if(!isServer && this.bodyRef && this.bodyRef.current) {
      let latexBlocks = this.htmlCollectionToArray(this.bodyRef.current.getElementsByClassName("mjx-chtml"));
      for(let i=0; i<latexBlocks.length; i++) {
        let latexBlock = latexBlocks[i];
        if (!latexBlock.classList.contains("MJXc-display")) {
          // Skip inline LaTeX
          continue;
        }
        latexBlock.className += " " + classes.scrollableLaTeX;
        if(latexBlock.scrollWidth > latexBlock.clientWidth) {
          this.addHorizontalScrollIndicators(latexBlock);
        }
      }
    }
  }
  
  // Given an HTML block element which has horizontal scroll, give it scroll
  // indicators: left and right arrows that tell you scrolling is possible.
  // That is, wrap it in this DOM structure and replce it in-place in the
  // browser DOM:
  //
  //   <div class={classes.scrollIndicatorWrapper}>
  //     <div class={classes.scrollIndicator,classes.scrollIndicatorLeft}/>
  //     {block}
  //     <div class={classes.scrollIndicator,classes.scrollIndicatorRight}/>
  //   </div>
  //
  // Instead of doing it with React, we do it with legacy DOM APIs, because
  // this needs to work when we take some raw non-REACT HTML from the database,
  // rather than working in a normal React-component-tree context.
  //
  // Attaches a handler to `block.onscrol` which shows and hides the scroll
  // indicators when it's scrolled all the way.
  addHorizontalScrollIndicators = (block: HTMLElement) => {
    const { classes } = this.props;
    
    // If already wrapped, don't re-wrap (so this is idempotent).
    if (block.parentElement && block.parentElement.className === classes.scrollIndicatorWrapper)
      return;
    
    const scrollIndicatorWrapper = document.createElement("div");
    scrollIndicatorWrapper.className = classes.scrollIndicatorWrapper;
    
    const scrollIndicatorLeft = document.createElement("div");
    scrollIndicatorWrapper.append(scrollIndicatorLeft);
    
    block.parentElement?.insertBefore(scrollIndicatorWrapper, block);
    block.remove();
    scrollIndicatorWrapper.append(block);
    
    const scrollIndicatorRight = document.createElement("div");
    scrollIndicatorWrapper.append(scrollIndicatorRight);
    
    // Update scroll indicator classes, either for the first time (when newly
    // constructed) or when we've scrolled. We apply `classes.hidden` when the
    // scroll position is within 1px (exclusive) of an edge, rather than when
    // it's exactly at an edge, because in at least one tested browser (Chrome
    // on Windows) scrolling actually stopped a fraction of a pixel short of
    // where `scrollWidth` said it would.
    const updateScrollIndicatorClasses = () => {
      scrollIndicatorLeft.className = classNames(
        classes.scrollIndicator, classes.scrollIndicatorLeft,
        { [classes.hidden]: block.scrollLeft < 1 });
      scrollIndicatorRight.className = classNames(
        classes.scrollIndicator, classes.scrollIndicatorRight,
        { [classes.hidden]: block.scrollLeft+block.clientWidth+1 > block.scrollWidth });
    }
    
    scrollIndicatorLeft.onclick = (ev) => {
      block.scrollLeft = Math.max(block.scrollLeft-block.clientWidth, 0);
    };
    scrollIndicatorRight.onclick = (ev) => {
      block.scrollLeft += Math.min(block.scrollLeft+block.clientWidth, block.scrollWidth-block.clientWidth);
    };
    
    updateScrollIndicatorClasses();
    block.onscroll = (ev) => updateScrollIndicatorClasses();
  };

  forwardAttributes = (node: HTMLElement) => {
    const result: Record<string, unknown> = {};
    const attrs = node.attributes ?? [];
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      if (attr.name === "class") {
        result.className = attr.value;
      } else {
        result[attr.name] = attr.value;
      }
    }
    return result;
  }

  collapseFootnotes = () => {
    const body = this.bodyRef?.current;
    if (!isEAForum || !body) {
      return;
    }

    const footnotes = body.querySelector(".footnotes");
    if (footnotes) {
      let innerHTML = footnotes.innerHTML;
      if (footnotes.tagName !== "SECTION") {
        innerHTML = `<section>${innerHTML}</section>`;
      }
      const collapsedFootnotes = (
        <Components.CollapsedFootnotes
          footnotesHtml={innerHTML}
          attributes={this.forwardAttributes(footnotes)}
        />
      );
      this.replaceElement(footnotes, collapsedFootnotes);
    }
  }

  markHoverableLinks = () => {
    if(this.bodyRef?.current) {
      const linkTags = this.htmlCollectionToArray(this.bodyRef.current.getElementsByTagName("a"));
      for (let linkTag of linkTags) {
        const tagContentsHTML = linkTag.innerHTML;
        const href = linkTag.getAttribute("href");
        if (!href || linkIsExcludedFromPreview(href))
          continue;
        const id = linkTag.getAttribute("id") ?? undefined;
        const rel = linkTag.getAttribute("rel") ?? undefined;
        const replacementElement = <Components.HoverPreviewLink
          href={href}
          innerHTML={tagContentsHTML}
          contentSourceDescription={this.props.description}
          id={id}
          rel={rel}
          noPrefetch={this.props.noHoverPreviewPrefetch}
        />
        this.replaceElement(linkTag, replacementElement);
      }
    }
  }

  markElicitBlocks = () => {
    if(this.bodyRef?.current) {
      const elicitBlocks = this.htmlCollectionToArray(this.bodyRef.current.getElementsByClassName("elicit-binary-prediction"));
      for (const elicitBlock of elicitBlocks) {
        if (elicitBlock.dataset?.elicitId) {
          const replacementElement = <Components.ElicitBlock questionId={elicitBlock.dataset.elicitId}/>
          this.replaceElement(elicitBlock, replacementElement)
        }
        
      }
    }
  }

  hideStrawPollLoggedOut = () => {
    const { currentUser } = this.props;
    const { location } = this.props;
    const { pathname } = location;

    if(!currentUser && this.bodyRef?.current) {
      const strawpollBlocks = this.htmlCollectionToArray(this.bodyRef.current.getElementsByClassName("strawpoll-embed"));
      for (const strawpollBlock of strawpollBlocks) {
        const replacementElement = <Components.StrawPollLoggedOut pathname={pathname}/>
        this.replaceElement(strawpollBlock, replacementElement)
      }
    }
  }
  
  applyIdInsertions = () => {
    if (!this.props.idInsertions) return;
    for (let id of Object.keys(this.props.idInsertions)) {
      const addedElement = this.props.idInsertions[id];
      const container = document.getElementById(id);
      // TODO: Check that it's inside this ContentItemBody
      if (container) this.insertElement(container, <>{addedElement}</>);
    }
  }
  
  replaceElement = (replacedElement: HTMLElement, replacementElement: JSX.Element) => {
    const replacementContainer = document.createElement("span");
    if (replacementContainer) {
      this.replacedElements.push({
        replacementElement: replacementElement,
        container: replacementContainer,
      });
      replacedElement.parentElement?.replaceChild(replacementContainer, replacedElement);
    }
  }
  
  insertElement = (container: HTMLElement, insertedElement: JSX.Element) => {
    const insertionContainer = document.createElement("span");
    this.replacedElements.push({
      replacementElement: insertedElement,
      container: insertionContainer,
    });
    container.prepend(insertionContainer);
  }
}


const addNofollowToHTML = (html: string): string => {
  return html.replace(/<a /g, '<a rel="nofollow" ')
}

const ContentItemBodyComponent = registerComponent<ExternalProps>("ContentItemBody", ContentItemBody, {
  styles,
  hocs: [
    withUser,
    withLocation
  ],
});

declare global {
  interface ComponentTypes {
    ContentItemBody: typeof ContentItemBodyComponent
  }
}
