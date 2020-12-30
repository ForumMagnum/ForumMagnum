import Localgroups from "./collection"
import { ensureIndex } from '../../collectionUtils';

declare global {
  interface LocalgroupsViewTerms extends ViewTermsBase {
    view?: LocalgroupsViewName
    filters?: string|Array<string>
    groupId?: string
    userId?: string
    lng?: number
    lat?: number
  }
}

Localgroups.addDefaultView((terms: LocalgroupsViewTerms) => {
  let selector: any = {};
  if(Array.isArray(terms.filters) && terms.filters.length) {
    selector.types = {$in: terms.filters};
  } else if (typeof terms.filters === "string") { //If there is only single value we can't distinguish between Array and value
    selector.types = {$in: [terms.filters]};
  }
  return {
    selector: {
      ...selector, 
      inactive: false
    }
  };
});

Localgroups.addView("userInactiveGroups", function (terms: LocalgroupsViewTerms) {
  return {
    selector: {
      organizerIds: terms.userId,
      inactive: true
    }
  };
});
ensureIndex(Localgroups, { organizerIds: 1, inactive: 1 });

Localgroups.addView("all", function (terms: LocalgroupsViewTerms) {
  return {
    options: {sort: {createdAt: -1}}
  };
});
ensureIndex(Localgroups, { createdAt: -1 });

Localgroups.addView("nearby", function (terms: LocalgroupsViewTerms) {
  return {
    selector: {
      mongoLocation: {
        $near: {
          $geometry: {
               type: "Point" ,
               coordinates: [ terms.lng, terms.lat ]
          },
        },
      }
    },
    options: {
      sort: {
        createdAt: null,
        _id: null
      }
    }
  };
});
ensureIndex(Localgroups, { mongoLocation: "2dsphere", inactive: 1 });

Localgroups.addView("single", function (terms: LocalgroupsViewTerms) {
  return {
    selector: {_id: terms.groupId},
    options: {sort: {createdAt: -1}}
  };
});
