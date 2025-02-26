import Localgroups from "./collection"

declare global {
  interface LocalgroupsViewTerms extends ViewTermsBase {
    view?: LocalgroupsViewName
    filters?: string|Array<string>
    groupId?: string
    userId?: string
    lng?: number
    lat?: number
    includeInactive?: boolean
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
      inactive: terms.includeInactive ? null : false,
      deleted: false
    }
  };
});

Localgroups.addView("userOrganizesGroups", function (terms: LocalgroupsViewTerms) {
  return {
    selector: {
      organizerIds: terms.userId,
      inactive: null
    },
    options: {sort: {name: 1}}
  };
});

Localgroups.addView("userActiveGroups", function (terms: LocalgroupsViewTerms) {
  return {
    selector: {
      organizerIds: terms.userId,
      inactive: false
    },
    options: {sort: {name: 1}}
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

Localgroups.addView("all", function (terms: LocalgroupsViewTerms) {
  return {
    options: {sort: {name: 1}}
  };
});

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
      },
      $or: [
        {isOnline: false}, {isOnline: {$exists: false}}
      ]
    },
    options: {
      sort: {
        createdAt: null,
        _id: null
      }
    }
  };
});

Localgroups.addView("single", function (terms: LocalgroupsViewTerms) {
  return {
    selector: {_id: terms.groupId},
    options: {sort: {createdAt: -1}}
  };
});

Localgroups.addView("local", function () {
  return {
    selector: {$or: [
      {isOnline: false}, {isOnline: {$exists: false}}
    ]},
    options: {sort: {name: 1}}
  };
});
Localgroups.addView("online", function () {
  return {
    selector: {isOnline: true},
    options: {sort: {name: 1}}
  };
});
