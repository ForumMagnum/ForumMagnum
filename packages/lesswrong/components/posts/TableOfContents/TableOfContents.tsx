import React, { useState, useEffect, useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import withErrorBoundary from '../../common/withErrorBoundary'

const styles = (theme: ThemeType): JssStyles => ({
  stickyBlock: {
    position: "sticky",
    fontSize: 12,
    top: 120,
    lineHeight: 1.0,
    marginLeft:1,
    paddingLeft:theme.spacing.unit*2,
    textAlign:"left",
    height:"80vh",
    overflowY:"scroll",
    direction:"rtl",
    "&::-webkit-scrollbar": {
      width: 1,
    },

    /* Track */
    "&::-webkit-scrollbar-track": {
        background: "none",
    },

    /* Handle */
    "&::-webkit-scrollbar-thumb": {
        background: theme.palette.grey[300],
    },

    /* Handle on hover */
    "&::-webkit-scrollbar-thumb:hover": {
        background: theme.palette.grey[700],
    },

    [theme.breakpoints.down('sm')]:{
      display:'none'
    }
  },
});

// Context used to share a reference used to share the table of contents
// between the ToC itself, and the Header. The Header uses the ToC to change
// its icon (if a ToC is present) and to put the ToC inside NavigationMenu; it
// needs this Context because it doesn't have access to the post, which is on
// the wrong side of a whole lot of plumbing.
//
// The reference is to a function setToC, which puts the ToC in the state of
// Layout.
type setToCFn = (document: PostsBase|null, sectionData: any)=>void
export const TableOfContentsContext = React.createContext<setToCFn|null>(null);

const TableOfContents = ({sectionData, document, classes}: {
  sectionData: any,
  document: PostsBase,
  classes: ClassesType,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const setToC = useContext(TableOfContentsContext);

  useEffect(() => {
    if (setToC)
      setToC(document, sectionData);
    
    return () => {
      if (setToC)
        setToC(null, null);
    }
  }, [document, sectionData, setToC]);

  if (!sectionData || !document)
    return <div/>

  return (
    <div className={classes.stickyBlock}>
      <Components.TableOfContentsList
        sectionData={sectionData}
        document={document}
        drawerStyle={false}
      />
    </div>
  );
}

const TableOfContentsComponent = registerComponent(
  "TableOfContents", TableOfContents, {
    styles,
    hocs: [withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    TableOfContents: typeof TableOfContentsComponent
  }
}
