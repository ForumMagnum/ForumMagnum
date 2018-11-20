import React, { PureComponent, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withErrorBoundary from '../../common/withErrorBoundary'

const styles = theme => ({
  root: {
  },
  
  chaptersList: {
  },
});

class TableOfContentsList extends Component
{
  constructor(props) {
    super(props);
    
    this.state = {
      currentSection: null,
      drawerOpen: false,
    };
  }
  
  componentDidMount() {
    window.addEventListener('scroll', this.updateHighlightedSection);
    this.updateHighlightedSection();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateHighlightedSection);
  }
  
  render() {
    const { classes, sections, document, drawerStyle } = this.props;
    const { currentSection } = this.state;
    const { TableOfContentsRow, TableOfContentsDrawerRow } = Components;
    const Row = drawerStyle ? TableOfContentsDrawerRow : TableOfContentsRow;
    
    if (!sections || !document)
      return <div/>
    
    return <div className={classes.root}>
      <Row key="postTitle"
        href="#"
        onClick={ev => this.jumpToY(0, ev)}
      >
        {document.title}
      </Row>
      <div className={classes.chaptersList}>
        {sections && sections.map((section, index) =>
          <Row
            key={section.anchor}
            indentLevel={section.level}
            highlighted={section.anchor === currentSection}
            href={"#"+section.anchor}
            onClick={(ev) => this.jumpToAnchor(section.anchor, ev)}
          >
            {section.title}
          </Row>
        )}
      </div>
      <Row key="comments"
        href="#comments"
        onClick={(ev) => this.jumpToAnchor("comments", ev)}
      >
        Comments
      </Row>
    </div>;
  }
  

  // Return the screen-space current section mark - that is, the spot on the
  // screen where the current-post will transition when its heading passes.
  getCurrentSectionMark() {
    return Math.min(150, window.innerHeight/4);
  }
  
  // Return the screen-space Y coordinate of an anchor. (Screen-space meaning
  // if you've scrolled, the scroll is subtracted from the effective Y
  // position.)
  getAnchorY(anchorName) {
    let anchor = document.getElementById(anchorName);
    let anchorBounds = anchor.getBoundingClientRect();
    return anchorBounds.top + anchorBounds.height/2;
  }
  
  jumpToAnchor(anchor, ev) {
    if (Meteor.isServer) return;
    
    let sectionYdocumentSpace = this.getAnchorY(anchor) + window.scrollY;
    this.jumpToY(sectionYdocumentSpace, ev);
  }
  
  jumpToY(y, ev) {
    if (Meteor.isServer) return;
    
    if (ev && (ev.button>0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey))
      return;
    
    if (this.props.onClickSection) {
      this.props.onClickSection();
    }
    
    window.scrollTo({
      top: y - this.getCurrentSectionMark() + 1,
      behavior: "smooth"
    });
    
    if (ev)
      ev.preventDefault();
  }
  
  updateHighlightedSection = () => {
    let newCurrentSection = this.getCurrentSection();
    if(newCurrentSection !== this.state.currentSection) {
      this.setState({
        currentSection: newCurrentSection,
      });
    }
  }
  
  getCurrentSection = () => {
    const { sections } = this.props;
    
    if (Meteor.isServer)
      return null;
    
    // The current section is whichever section a spot 1/3 of the way down the
    // window is inside. So the selected section is the section whose heading's
    // Y is as close to the 1/3 mark as possible without going over.
    let currentSectionMark = this.getCurrentSectionMark();
    
    let currentSection = null;
    for(let i=0; i<sections.length; i++)
    {
      let sectionY = this.getAnchorY(sections[i].anchor);
      
      if(sectionY < currentSectionMark)
        currentSection = sections[i].anchor;
    }
    
    return currentSection;
  }
}

registerComponent("TableOfContentsList", TableOfContentsList,
  withErrorBoundary, withStyles(styles, { name: "TableOfContentsList" }));

