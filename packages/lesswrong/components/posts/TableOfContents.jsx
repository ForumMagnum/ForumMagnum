import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Drawer from 'material-ui/Drawer';

const styles = theme => ({
  root: {
    padding: 15,
  },
  
  postTitle: {
  },
  
  chaptersList: {
    paddingLeft: 15,
  },
  
  currentSection: {
    fontWeight: "bold",
  },
});

class TableOfContents extends Component
{
  constructor(props) {
    super(props);
    
    this.state = {
      currentSection: null,
    };
  }
  
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }
  
  render() {
    const { classes, sections, document } = this.props;
    const { currentSection } = this.state;
    
    return <Drawer
      open={true}
      width={250}
      containerClassName={classes.root}
    >
      <div className={classes.postTitle}>
        {document.title}
      </div>
      <ul className={classes.chaptersList}>
        {sections && sections.map((section, index) =>
          <li key={index} className={section.anchor === currentSection ? classes.currentSection : undefined}>
            <a onClick={(ev) => this.jumpToSection(section)}>{section.title}</a>
          </li>)}
      </ul>
      <div className={classes.comments}>Comments</div>
    </Drawer>
  }
  

  // Return the screen-space current section mark - that is, the spot on the
  // screen where the current-post will transition when its heading passes.
  getCurrentSectionMark() {
    return Math.min(150, window.innerHeight/4);
  }
  
  // Return the screen-space Y coordinate of a section. (Screen-space meaning
  // if you've scrolled, the scroll is subtracted from the effective Y
  // position.)
  getSectionY(section) {
    let anchorName = section.anchor;
    let anchor = document.getElementById(anchorName);
    let anchorBounds = anchor.getBoundingClientRect();
    return anchorBounds.top + anchorBounds.height/2;
  }
  
  jumpToSection(section) {
    if (Meteor.isServer) return;
    
    let sectionYdocumentSpace = this.getSectionY(section) + window.scrollY;
    
    window.scrollTo({
      top: sectionYdocumentSpace - this.getCurrentSectionMark() + 1,
      behavior: "smooth"
    });
  }
  
  handleScroll = () => {
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
      let sectionY = this.getSectionY(sections[i]);
      
      if(sectionY < currentSectionMark)
        currentSection = sections[i].anchor;
    }
    
    return currentSection;
  }
}

registerComponent("TableOfContents", TableOfContents,
  withStyles(styles, { name: "TableOfContents" }));
