import React, { Component } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const scrollIndicatorColor = "#ddd";
const scrollIndicatorHoverColor = "#888";

const styles = theme => ({
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
    borderRight: "10px solid "+scrollIndicatorColor,
    
    "&:hover": {
      borderRight: "10px solid "+scrollIndicatorHoverColor,
    },
  },
  
  scrollIndicatorRight: {
    right: 0,
    borderLeft: "10px solid "+scrollIndicatorColor,
    
    "&:hover": {
      borderLeft: "10px solid "+scrollIndicatorHoverColor,
    },
  },
  
  scrollableLaTeX: {
    // Cancel out the margin created by the block elements above and below,
    // so that we can convert them into padding and get a larger touch
    // target.
    // !important to take precedence over .mjx-chtml
    marginTop: "-1em !important",
    
    paddingTop: "2em !important",
    paddingBottom: "2em !important",
    
    // Hide the scrollbar (on browsers that support it) because our scroll
    // indicator is better
    "-ms-overflow-style": "-ms-autohiding-scrollbar",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  }
});

// The body of a post/comment/etc, created by taking server-side-processed HTML
// out of the result of a GraphQL query and adding some decoration to it. In
// particular, if this is the client-side render, adds scroll indicators to
// horizontally-scrolling LaTeX blocks.
//
// This doesn't apply styling (other than for the decorators it adds) because
// it's shared between entity types, which have styling that differs.
class ContentItemBody extends Component {
  constructor(props) {
    super(props);
    this.bodyRef = React.createRef();
  }
  
  render() {
    return <div
      className={this.props.className}
      ref={this.bodyRef}
      dangerouslySetInnerHTML={this.props.dangerouslySetInnerHTML}
    />
  }
  
  componentDidMount() {
    this.markScrollableLaTeX();
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
    
    if(!Meteor.isServer && this.bodyRef && this.bodyRef.current) {
      let latexBlocks = this.bodyRef.current.getElementsByClassName("mjx-chtml");
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
  addHorizontalScrollIndicators = (block) => {
    const { classes } = this.props;
    
    // If already wrapped, don't re-wrap (so this is idempotent).
    if (block.parentElement && block.parentElement.className === classes.scrollIndicatorWrapper)
      return;
    
    const scrollIndicatorWrapper = document.createElement("div");
    scrollIndicatorWrapper.className = classes.scrollIndicatorWrapper;
    
    const scrollIndicatorLeft = document.createElement("div");
    scrollIndicatorWrapper.append(scrollIndicatorLeft);
    
    block.parentElement.insertBefore(scrollIndicatorWrapper, block);
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
}

registerComponent('ContentItemBody', ContentItemBody,
  withStyles(styles, { name: "ContentItemBody" })
);
