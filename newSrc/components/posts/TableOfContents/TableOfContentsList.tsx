import React, { Component } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import withErrorBoundary from '../../common/withErrorBoundary'
import { isServer } from '../../../lib/executionEnvironment';
import { withNavigation } from '../../../lib/routeUtil';

const topSection = "top";

interface TableOfContentsListProps {
  sectionData: any,
  document?: PostsBase,
  onClickSection?: any,
  drawerStyle: boolean,
  history?: any
}
interface TableOfContentsListState {
  currentSection: any,
  drawerOpen: boolean,
}

class TableOfContentsList extends Component<TableOfContentsListProps,TableOfContentsListState> {
  state: TableOfContentsListState = {
    currentSection: {anchor: topSection},
    drawerOpen: false,
  }

  componentDidMount() {
    window.addEventListener('scroll', this.updateHighlightedSection);
    this.updateHighlightedSection();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateHighlightedSection);
  }

  render() {
    const { sectionData, document} = this.props;
    const { currentSection } = this.state;
    const { TableOfContentsRow, AnswerTocRow } = Components;
    // const Row = TableOfContentsRow;

    if (!sectionData)
      return <div/>

    const { sections } = sectionData;

    const title = (document && document.title) || (sectionData.document && sectionData.document.title);

    return <div>
      <div>
        <TableOfContentsRow key="postTitle"
          href="#"
          onClick={ev => this.jumpToY(0, ev)}
          highlighted={currentSection && currentSection.anchor === topSection}
          title
        >
          {title?.trim()}
        </TableOfContentsRow>
        {sections && sections.map((section, index) => {
          return (
            <TableOfContentsRow
              key={section.anchor}
              indentLevel={section.level}
              divider={section.divider}
              highlighted={section.anchor === currentSection}
              href={"#"+section.anchor}
              onClick={(ev) => this.jumpToAnchor(section.anchor, ev)}
              answer={!!section.answer}
            >
                {section.answer ?
                  <AnswerTocRow answer={section.answer} />
                  :
                  <span>{section.title?.trim()}</span>
                }
            </TableOfContentsRow>
          )
        })}
      </div>
    </div>
  }


  // Return the screen-space current section mark - that is, the spot on the
  // screen where the current-post will transition when its heading passes.
  getCurrentSectionMark() {
    return window.innerHeight/3
  }

  // Return the screen-space Y coordinate of an anchor. (Screen-space meaning
  // if you've scrolled, the scroll is subtracted from the effective Y
  // position.)
  getAnchorY(anchorName: string): number|null {
    let anchor = document.getElementById(anchorName);
    if (anchor) {
      let anchorBounds = anchor.getBoundingClientRect();
      return anchorBounds.top + (anchorBounds.height/2);
    } else {
      return null
    }
  }

  jumpToAnchor(anchor: string, ev: MouseEvent|null) {
    if (isServer) return;

    const anchorY = this.getAnchorY(anchor);
    if (anchorY !== null) {
      const { history } = this.props
      history.push(`#${anchor}`)
      let sectionYdocumentSpace = anchorY + window.scrollY;
      this.jumpToY(sectionYdocumentSpace, ev);
    }
  }

  jumpToY(y: number, ev: MouseEvent|null) {
    if (isServer) return;

    if (ev && (ev.button>0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey))
      return;

    if (this.props.onClickSection) {
      this.props.onClickSection();
    }
    try {
      window.scrollTo({
        top: y - this.getCurrentSectionMark() + 1,
        behavior: "smooth"
      });

      if (ev) ev.preventDefault();
    } catch(e) {
      // eslint-disable-next-line no-console
      console.warn("scrollTo not supported, using link fallback", e)
    }

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
    const { sectionData } = this.props;
    const sections = sectionData && sectionData.sections

    if (isServer)
      return null;
    if (!sections)
      return null;

    // The current section is whichever section a spot 1/3 of the way down the
    // window is inside. So the selected section is the section whose heading's
    // Y is as close to the 1/3 mark as possible without going over.
    let currentSectionMark = this.getCurrentSectionMark();

    let currentSection = null;
    for(let i=0; i<sections.length; i++)
    {
      let sectionY = this.getAnchorY(sections[i].anchor);

      if(sectionY && sectionY < currentSectionMark)
        currentSection = sections[i].anchor;
    }

    if (currentSection === null) {
      // Was above all the section headers, so return the special "top" section
      return { anchor: topSection}
    }

    return currentSection;
  }
}

const TableOfContentsListComponent = registerComponent(
  "TableOfContentsList", TableOfContentsList, {
    hocs: [withErrorBoundary, withNavigation]
  }
);

declare global {
  interface ComponentTypes {
    TableOfContentsList: typeof TableOfContentsListComponent
  }
}
