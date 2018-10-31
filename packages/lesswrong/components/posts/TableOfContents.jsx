import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Drawer from 'material-ui/Drawer';
import cheerio from 'cheerio';

// Number of headings below which a table of contents won't be generated.
const minHeadingsForToC = 3;

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

// Given an HTML document, extract a list of sections for a table of contents
// from it, and add anchors. The result is modified HTML with added anchors,
// plus a JSON array of sections, where each section has a
// `title`, `anchor`, and `level`, like this:
//   {
//     html: "<a anchor=...">,
//     sections: [
//       {title: "Preamble", anchor: "preamble", level: 1},
//       {title: "My Cool Idea", anchor: "mycoolidea", level: 1},
//         {title: "An Aspect of My Cool Idea", anchor:"anaspectofmycoolidea", level: 2},
//         {title: "Why This Is Neat", anchor:"whythisisneat", level: 2},
//       {title: "Conclusion", anchor: "conclusion", level: 1},
//     ]
//   }
export function extractListOfSections(postHTML)
{
  const postBody = cheerio.load(postHTML);
  let headings = [];
  let usedAnchors = {};
  
  // First, find the headings in the document, create a linear list of them,
  // and insert anchors at each one.
  let headingTags = postBody('h1,h2,h3,h4,h5,h6');
  for(let i=0; i<headingTags.length; i++) {
    let tag = headingTags[i];
    let title = cheerio(tag).text();
    let anchor = titleToAnchor(title, usedAnchors);
    cheerio(tag).attr("id", anchor);
    headings.push({
      title: title,
      anchor: anchor,
      level: tagToHeadingLevel(tag.tagName),
    });
  }
  
  if (headings.length < minHeadingsForToC)
    return null;
  
  // Filter out unused heading levels, mapping the heading levels to consecutive
  // numbers starting from 1.
  // TODO
  
  return {
    html: postBody.html(),
    sections: headings,
  }
}

// Given the text in a heading block and a dict of anchors that have been used
// in the post so far, generate an anchor, add that anchor to usedAnchors, and
// return it. An anchor is a URL-safe string that can be used for
// within-document links.
function titleToAnchor(title, usedAnchors)
{
  let charsToUse = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789";
  let sb = [];
  
  for(let i=0; i<title.length; i++) {
    let ch = title.charAt(i);
    if(charsToUse.indexOf(ch) >= 0) {
      sb.push(ch);
    } else {
      sb.push('_');
    }
  }
  
  let anchor = sb.join('');
  if(!usedAnchors[anchor])
    return anchor;
  
  let anchorSuffix = 1;
  while(usedAnchors[anchor + anchorSuffix])
    anchorSuffix++;
  return anchor+anchorSuffix;
}

function tagToHeadingLevel(tagName)
{
  switch(tagName) {
    case "h1": return 1;
    case "h2": return 2;
    case "h3": return 3;
    case "h4": return 4;
    case "h5": return 5;
    case "h6": return 6;
    default: return 0;
  }
}

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
            <a href={"#"+section.anchor}>{section.title}</a>
          </li>)}
      </ul>
      <div className={classes.comments}>Comments</div>
    </Drawer>
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
    let currentSectionMark = window.scrollY + window.innerHeight/3;
    
    function getSectionY(section) {
      let anchorName = section.anchor;
      let anchor = document.getElementById(anchorName);
      let anchorBounds = anchor.getBoundingClientRect();
      return anchorBounds.top + anchorBounds.height/2;
    }
    
    let currentSection = null;
    for(let i=0; i<sections.length; i++)
    {
      let sectionY = getSectionY(sections[i]);
      
      if(sectionY < currentSectionMark)
        currentSection = sections[i].anchor;
    }
    
    return currentSection;
  }
}

registerComponent("TableOfContents", TableOfContents,
  withStyles(styles, { name: "TableOfContents" }));
