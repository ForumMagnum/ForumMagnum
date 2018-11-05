import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Drawer from 'material-ui/Drawer';
import classnames from 'classnames';
import Hidden from '@material-ui/core/Hidden';

const styles = theme => ({
  root: {
    padding: 15,
  },
  
  stickyContainer: {
    position: "absolute",
    right: "100%",
    marginRight: 20,
    top: 70,
    width: 250,
    height: "100%",
  },
  
  stickyBlock: {
    position: "sticky",
    fontSize: 12,
    top: 100,
    lineHeight: 1.0,
  },
  
  postTitle: {
  },
  
  chaptersList: {
    paddingLeft: 10,
  },
  
  currentSection: {
    fontWeight: "bold",
  },
  
  section: {
    marginTop: 4,
    marginBottom: 4,
  },
  
  level1: {
  },
  level2: {
    marginLeft: 10,
  },
  level3: {
    marginLeft: 20,
  },
  level4: {
    marginLeft: 30,
  },
  level5: {
    marginLeft: 40,
  },
});

class TableOfContents extends Component
{
  constructor(props) {
    super(props);
    
    this.state = {
      currentSection: null,
      drawerOpen: false,
    };
  }
  
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }
  
  levelToClassName(level) {
    const { classes } = this.props;
    switch(level) {
      case 1: return classes.level1;
      case 2: return classes.level2;
      case 3: return classes.level3;
      case 4: return classes.level4;
      default: return classes.level5;
    }
  }
  
  render() {
    const { classes, sections, document } = this.props;
    const { currentSection } = this.state;
    
    let tocBody = <React.Fragment>
      <div className={classes.postTitle}>
        {document.title}
      </div>
      <div className={classes.chaptersList}>
        {sections && sections.map((section, index) =>
          <div key={index}
            className={classnames(
              classes.section,
              this.levelToClassName(section.level),
              { [classes.currentSection]: section.anchor === currentSection }
            )}
          >
            <a onClick={(ev) => this.jumpToSection(section)}>{section.title}</a>
          </div>)}
      </div>
      <div className={classes.comments}>Comments</div>
    </React.Fragment>;
    
    return (<React.Fragment>
      <Hidden lgUp implementation="js">
        <Drawer
          docked={false}
          open={this.state.drawerOpen}
          onRequestChange={(open)=>this.setState({drawerOpen: open})}
          width={250}
          containerClassName={classes.root}
        >
          {tocBody}
        </Drawer>
      </Hidden>
      <Hidden mdDown implementation="js">
        <div className={classes.stickyContainer}>
          <div className={classes.stickyBlock}>
            {tocBody}
          </div>
        </div>
      </Hidden>
    </React.Fragment>);
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
