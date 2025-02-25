import schema from "./schema";
import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import { makeEditable } from "../../editor/make_editable";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ForumEvents: ForumEventsCollection = createCollection({
  collectionName: "ForumEvents",
  typeName: "ForumEvent",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ForumEvents', {endDate: 1});
    return indexSet;
  },
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
