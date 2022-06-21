// import React, { useState } from 'react';
// import { useMulti } from '../../lib/crud/withMulti';
// import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
// import { Components, registerComponent } from '../../lib/vulcan-lib';
// import DescriptionIcon from '@material-ui/icons/Description';

// const styles = (theme: ThemeType): JssStyles => ({
//   root: {
//     boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
//     marginBottom: 20,
//     background: "white",
//     width: "100%",
//     overflow: "hidden",
//     position: "relative",
//     // display: "flex"

//     // maxHeight: 200
//   },
//   text: {
//     padding: 12,
//     position: "relative",
//     maxWidth: 600
//   },
//   title: {
//     ...theme.typography.display0,
//     ...theme.typography.postStyle,
//     marginTop: 0,
//     marginBottom: 2,
//     fontVariant: "small-caps",
//   },
//   description: {
//     ...theme.typography.body2,
//     ...theme.typography.postStyle,
//   },
//   author: {
//     ...theme.typography.body2,
//     ...theme.typography.postStyle,
//     color: theme.palette.text.dim,
//     fontStyle: "italic",
//     marginBottom: 10
//   },
//   sequenceImage: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     height: 150,
//     width: 220,

//     [theme.breakpoints.down('xs')]: {
//       marginTop: 0,
//       marginBottom: 0,
//       position: "absolute",
//       overflow: 'hidden',
//       right: 0,
//       bottom: 0,
//       height: "100%",
//     },

//     // Overlay a white-to-transparent gradient over the image
//     "&:after": {
//       content: "''",
//       position: "absolute",
//       width: "100%",
//       height: "100%",
//       left: 0,
//       top: 0,
//       background: `linear-gradient(to top, ${theme.palette.panelBackground.default} 0%, ${theme.palette.panelBackground.translucent2} 50%, transparent 100%)`,
//     }
//   },
//   sequenceImageImg: {
//     width: "100%",
//     [theme.breakpoints.down('xs')]: {
//       height: "100%",
//       width: 'auto'
//     },
//   },
//   postIcon: {
//     height: 12,
//     width: 12,
//     marginRight: 4,
//     color: theme.palette.grey[500]
//   },
//   postTitle: {
//     ...theme.typography.smallFont,
//     ...theme.typography.commentStyle,
//     display: "block"
//   },
//   columns: {
//     display: "flex"
//   },
//   left: {
//     width: "50%",
//     borderRight: "solid 1px rgba(0,0,0,.1)"
//   },
//   right: {
//     width: "50%",
//     background: theme.palette.panelBackground.default,
//     padding: 16
//   }
// });

// export const SequencesRowItem2 = ({sequence, showAuthor=true, classes}: {
//   sequence: SequencesPageFragment,
//   showAuthor?: boolean,
//   classes: ClassesType,
// }) => {
//   const { UsersName, ContentStyles, TagSmallPostLink, ContentItemTruncated, LinkCard } = Components
  
//   const getSequenceUrl = () => {
//     return '/s/' + sequence._id
//   }
//   const url = getSequenceUrl()
//   const [expanded, setExpanded] = useState<boolean>(false)

//   const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

//   const { results: chapters } = useMulti({
//     terms: {
//       view: "SequenceChapters",
//       sequenceId: sequence._id,
//       limit: 100
//     },
//     collectionName: "Chapters",
//     fragmentName: 'ChaptersFragment',
//     enableTotal: false
//   });

//   return <LinkCard className={classes.root} to={'/s/' + sequence._id}>

//     <div className={classes.columns}>
//       <div className={classes.left}>
//         <div className={classes.sequenceImage}>
//           <img className={classes.sequenceImageImg}
//             src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,dpr_2.0,g_custom,h_96,q_auto,w_292/v1/${
//               sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"
//             }`}
//             />
//         </div>
//         <div className={classes.text}>
//           <div className={classes.title}>{sequence.title}</div>
//           { showAuthor && sequence.user &&
//             <div className={classes.author}>
//               by <UsersName user={sequence.user} />
//             </div>}
//           <ContentStyles contentType="postHighlight" className={classes.description}>
//             <ContentItemTruncated
//               maxLengthWords={100}
//               graceWords={20}
//               rawWordCount={sequence.contents?.wordCount || 0}
//               expanded={expanded}
//               getTruncatedSuffix={() => null}
//               dangerouslySetInnerHTML={{__html: sequence.contents?.htmlHighlight || ""}}
//               description={`sequence ${sequence._id}`}
//             />
//           </ContentStyles>
//         </div>
//       </div>
//       <div className={classes.right}>
//         {chapters?.map((chapter) => <span key={chapter._id}>
//             {chapter.posts?.map(post => <SequencesSmallPostLink 
//                                           key={chapter._id + post._id} 
//                                           post={post}
//                                           hideMeta
//                                         />
//             )}
//           </span>
//         )}
//       </div>
//     </div>
//   </LinkCard>
// }

// const SequencesRowItemComponent = registerComponent('SequencesRowItem2', SequencesRowItem2, {styles});

// declare global {
//   interface ComponentTypes {
//     SequencesRowItem2: typeof SequencesRowItemComponent
//   }
// }

