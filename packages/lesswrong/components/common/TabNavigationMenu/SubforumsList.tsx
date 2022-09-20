import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { forumTypeSetting } from "../../../lib/instanceSettings";
import { useUserLocation } from "../../../lib/collections/users/helpers";
import { useFilterSettings } from "../../../lib/filterSettings";

// const TabNavigationEventSingleLine = ({
//   event,
//   onClick,
//   classes,
// }: {
//   event: PostsList;
//   onClick: () => void;
//   classes: ClassesType;
// }) => {
//   const { TabNavigationSubItem } = Components;

//   // MenuItem takes a component and passes unrecognized props to that component,
//   // but its material-ui-provided type signature does not include this feature.
//   // Cast to any to work around it, to be able to pass a "to" parameter.
//   const MenuItemUntyped = MenuItem as any;

//   return (
//     <MenuItemUntyped
//       onClick={onClick}
//       component={Link}
//       to={postGetPageUrl(event)}
//       classes={{ root: classes.eventWrapper }}
//     >
//       <TabNavigationSubItem className={classes.event}>
//         {displayTime && displayTime !== " " && (
//           <span className={classNames(classes.displayTime, { [classes.yesterday]: displayTime === YESTERDAY_STRING })}>
//             {displayTime}
//           </span>
//         )}
//         <span className={classes.title}>{event.title}</span>
//       </TabNavigationSubItem>
//     </MenuItemUntyped>
//   );
// };

const SubforumsList = ({ currentUser, onClick }) => {
  const {filterSettings} = useFilterSettings();
  
  //, TODO use function for this
  const subscribedTags = filterSettings.tags.filter((tag) => tag.filterMode === "Subscribed" || tag.filterMode >= 25);
  
  
  
  return <></>
  // return (
  //   <span>
  //     <AnalyticsContext pageSubSectionContext="menuSubforumsList">
  //       {/* <TabNavigationEventsList onClick={onClick} terms={globalTerms} /> */}
  //       <div>
  //         {results.map((event) => (
  //           <LWTooltip
  //             key={event._id}
  //             placement="right-start"
  //             title={<EventSidebarTooltip event={event} classes={classes} />}
  //           >
  //             <MenuItemUntyped
  //               onClick={onClick}
  //               component={Link}
  //               to={postGetPageUrl(event)}
  //               classes={{ root: classes.eventWrapper }}
  //             >
  //               <TabNavigationSubItem className={classes.event}>
  //                 {displayTime && displayTime !== " " && (
  //                   <span
  //                     className={classNames(classes.displayTime, {
  //                       [classes.yesterday]: displayTime === YESTERDAY_STRING,
  //                     })}
  //                   >
  //                     {displayTime}
  //                   </span>
  //                 )}
  //                 <span className={classes.title}>{event.title}</span>
  //               </TabNavigationSubItem>
  //             </MenuItemUntyped>
  //           </LWTooltip>
  //         ))}
  //       </div>
  //     </AnalyticsContext>
  //   </span>
  );
};

const SubforumsListComponent = registerComponent("SubforumsList", SubforumsList);

declare global {
  interface ComponentTypes {
    SubforumsList: typeof SubforumsListComponent;
  }
}
