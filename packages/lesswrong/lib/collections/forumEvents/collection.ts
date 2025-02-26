import schema from "./schema";
import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { makeEditable } from "../../editor/make_editable";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const ForumEvents: ForumEventsCollection = createCollection({
  collectionName: "ForumEvents",
  typeName: "ForumEvent",
  schema,
  resolvers: getDefaultResolvers("ForumEvents"),
  mutations: getDefaultMutations("ForumEvents"),
  logChanges: true,
});

addUniversalFields({collection: ForumEvents});

makeEditable({
  collection: ForumEvents,
  options: {
    fieldName: "frontpageDescription",
    label: "Frontpage description",
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    getLocalStorageId: (forumEvent) => {
      return {
        id: `forumEvent:frontpageDescription:${forumEvent?._id ?? "create"}`,
        verify: true,
      };
    },
    permissions: {
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
});

makeEditable({
  collection: ForumEvents,
  options: {
    fieldName: "frontpageDescriptionMobile",
    label: "Frontpage description (mobile)",
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    getLocalStorageId: (forumEvent) => {
      return {
        id: `forumEvent:frontpageDescriptionMobile:${forumEvent?._id ?? "create"}`,
        verify: true,
      };
    },
    permissions: {
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
});

makeEditable({
  collection: ForumEvents,
  options: {
    fieldName: "postPageDescription",
    label: "Post page description",
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    getLocalStorageId: (forumEvent) => {
      return {
        id: `forumEvent:postPageDescription:${forumEvent?._id ?? "create"}`,
        verify: true,
      };
    },
    permissions: {
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
});

export default ForumEvents;
