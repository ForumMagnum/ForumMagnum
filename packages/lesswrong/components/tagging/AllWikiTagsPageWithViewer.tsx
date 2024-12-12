// import React, { useState } from 'react';
// import { registerComponent, Components } from '../../lib/vulcan-lib';
// import { useTagBySlug } from './useTag';
// import { useCurrentUser } from '../common/withUser';
// import { AnalyticsContext } from "../../lib/analyticsEvents";
// import { Link } from '../../lib/reactRouterWrapper';
// import AddBoxIcon from '@material-ui/icons/AddBox';
// import { useDialog } from '../common/withDialog';
// import { taggingNameCapitalSetting, taggingNameIsSet, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
// import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
// import { defineStyles, useStyles } from '../hooks/useStyles';
// import SearchIcon from '@material-ui/icons/Search';

// const styles = defineStyles("AllWikiTagsPageWithViewer", (theme: ThemeType) => ({
//   root: {
//     padding: "0 100px",
//     maxWidth: 1000,
//   },
//   topSection: {
//     marginBottom: 32,
//   },
//   addTagButton: {
//     verticalAlign: "middle",
//   },
//   titleClass: {
//     fontSize: "4rem",
//     fontWeight: 500,
//     marginBottom: 32,
//   },
//   searchContainer: {
//     display: "flex",
//     alignItems: "center",
//     width: 400,
//     // marginTop: theme.spacing.unit * 4,
//   },
//   searchIcon: {
//     // position: 'absolute',
//     // right: '15px',
//     // top: '50%',
//     // transform: 'translateY(-70%)',
//     color: theme.palette.grey[500],
//     marginLeft: -25,
//   },
//   searchBar: {
//     width: "100%",
//     padding: 8,
//     fontSize: "1.0rem",
//     boxSizing: "border-box",
//   },
//   mainContent: {
//     display: "flex",
//     gap: "32px",
//     flexGrow: 1,
//     // overflow: 'hidden',
//   },
//   wikiTagNestedList: {
//     flexShrink: 0,
//     width: 300,
//     // overflowY: 'auto',
//   },
//   wikitagName: {
//     fontSize: "1.5rem",
//     fontWeight: 700,
//     // fontFamily: theme.palette.fonts.serifStack,
//     marginBottom: 16,
//   },
//   viewer: {
//     flexShrink: 0,
//     width: '100%',
//     maxWidth: 600,
//     padding: "24px 42px",
//     backgroundColor: "white",
//     display: 'flex',
//     flexDirection: 'column',
//     position: 'sticky',
//     top: 80,
//     height: '100vh',
//     overflowY: 'auto',
//   },
//   viewerContent: {
//     flexGrow: 1,
//     display: 'flex',
//     flexDirection: 'column',
//   },
//   wikitagDescription: {
//     fontSize: "1rem",
//     fontWeight: 400,
//     flexGrow: 1,
//     overflowY: 'auto',
//   },
//   wikitagHeader: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   pinMessage: {
//     color: theme.palette.grey[700],
//     fontSize: '1.2rem',
//     fontStyle: 'italic',
//     //don't wrap
//     whiteSpace: 'nowrap',
//     flexShrink: 0,
//   },
// }))

// interface WikiTagMockup {
//   "coreTag"?: string;
//   _id: string;
//   name: string;
//   slug: string;
//   postCount: number;
//   description_html: string;
//   description_length: number;
//   viewCount?: number;
//   parentTagId?: string | null;
// }

// const AllWikiTagsPageWithViewer = () => {
//   const classes = useStyles(styles);
//   const { openDialog } = useDialog();
//   const currentUser = useCurrentUser();
//   // const { tag, loading } = useTagBySlug("portal", "AllWikiTagsPageWithViewerFragment");

//   const { SectionButton, SectionTitle, ContentStyles, ToCColumn, WikiTagNestedList, Typography } = Components;
//   const [selectedWikiTag, setSelectedWikiTag] = useState<WikiTagMockup | null>(null);
//   const [pinnedWikiTag, setPinnedWikiTag] = useState<WikiTagMockup | null>(null);

//   const handleHover = (wikitag: WikiTagMockup | null) => {
//     if (!pinnedWikiTag && wikitag && (wikitag.description_length > 0 || wikitag.postCount > 0)) {
//       setSelectedWikiTag(wikitag);
//     }
//   };

//   const handleClick = (wikitag: WikiTagMockup) => {
//     if (pinnedWikiTag && pinnedWikiTag._id === wikitag._id) {
//       setPinnedWikiTag(null);
//       setSelectedWikiTag(null);
//     } else if (wikitag.description_length > 0 || wikitag.postCount > 0) {
//       setPinnedWikiTag(wikitag);
//       setSelectedWikiTag(wikitag);
//     }
//   };

//   const handleBackgroundClick = (e: React.MouseEvent) => {
//     if (e.target === e.currentTarget) {
//       setPinnedWikiTag(null);
//       setSelectedWikiTag(null);
//     }
//   };

//   // remove leading and trailing `"` and \n from the html
//   const cleanedHtml = selectedWikiTag?.description_html?.replace(/^"|"$/g, '').replace(/\\n/g, '') ?? '';

//   return (
//     <AnalyticsContext pageContext="allWikiTagsPage">
//       <div className={classes.root} onClick={handleBackgroundClick}>

//         {/* <div>CURRENTLY SET WIKITAG: {pinnedWikiTag?.name}</div>
//         <div>CURRENTLY HOVERED WIKITAG: {selectedWikiTag?.name}</div> */}


//         <div className={classes.topSection}>
//             <SectionTitle title="Concepts" titleClassName={classes.titleClass}>
//               <SectionButton>
//                 {currentUser && tagUserHasSufficientKarma(currentUser, "new") && <Link
//                   to={tagCreateUrl}
//                 >
//                   <AddBoxIcon className={classes.addTagButton}/>
//                   New {taggingNameCapitalSetting.get()}
//                 </Link>}
//                 {!currentUser && <a onClick={(ev) => {
//                   openDialog({
//                     componentName: "LoginPopup",
//                     componentProps: {}
//                   });
//                   ev.preventDefault();
//                 }}>
//                   <AddBoxIcon className={classes.addTagButton}/>
//                   New {taggingNameCapitalSetting.get()}
//                 </a>}
//               </SectionButton>
//             </SectionTitle>

//             <div className={classes.searchContainer}>
//               <input
//                 type="text"
//                 className={classes.searchBar}
//                 placeholder="What would you like to read about?"
//               />
//               <SearchIcon className={classes.searchIcon} />
//             </div>
//         </div>
//         <div className={classes.mainContent} onClick={handleBackgroundClick}>


//           <div className={classes.wikiTagNestedList}>
//             <WikiTagNestedList 
//               onHover={handleHover} 
//               onClick={handleClick}
//               pinnedWikiTag={pinnedWikiTag}
//             />
//           </div>


//           <div className={classes.viewer} onClick={handleBackgroundClick}>
//             <ContentStyles contentType="tag" className={classes.viewerContent}>
//               <div>
//                 <div className={classes.wikitagHeader}>
//                   <Typography variant="display3" className={classes.wikitagName}>
//                     {selectedWikiTag?.name ?? 'Select a concept to view details'}
//                   </Typography>
//                   {selectedWikiTag && (
//                     <div className={classes.pinMessage}>
//                       {pinnedWikiTag ? 'Click anywhere to unpin' : 'Click to pin'}
//                     </div>
//                   )}
//                 </div>
//                 <div className={classes.wikitagDescription}>
//                   {selectedWikiTag ? (
//                     <div dangerouslySetInnerHTML={{ __html: cleanedHtml }} />
//                   ) : (
//                     <div>Please select a concept from the list to see its description.</div>
//                   )}
//                 </div>
//               </div>
//             </ContentStyles>
//           </div>


//         </div>
//       </div>
//     </AnalyticsContext>
//   );
// }

// const AllWikiTagsPageWithViewerComponent = registerComponent("AllWikiTagsPageWithViewer", AllWikiTagsPageWithViewer);

// export default AllWikiTagsPageWithViewerComponent;

// declare global {
//   interface ComponentTypes {
//     AllWikiTagsPageWithViewer: typeof AllWikiTagsPageWithViewerComponent
//   }
// }
