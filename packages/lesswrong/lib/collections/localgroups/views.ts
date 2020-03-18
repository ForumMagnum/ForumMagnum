import Localgroups from "./collection"
import { ensureIndex } from '../../collectionUtils';

Localgroups.addDefaultView(terms => {
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

Localgroups.addView("userInactiveGroups", function (terms) {
  return {
    selector: {
      organizerIds: terms.userId,
      inactive: true
    }
  };
});
ensureIndex(Localgroups, { organizerIds: 1, inactive: 1 });

Localgroups.addView("all", function (terms) {
  return {
    options: {sort: {createdAt: -1}}
  };
});
ensureIndex(Localgroups, { createdAt: -1 });

Localgroups.addView("nearby", function (terms) {
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

Localgroups.addView("single", function (terms) {
  return {
    selector: {_id: terms.groupId},
    options: {sort: {createdAt: -1}}
  };
});
