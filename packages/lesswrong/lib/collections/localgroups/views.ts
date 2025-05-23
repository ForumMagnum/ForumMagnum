import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface LocalgroupsViewTerms extends ViewTermsBase {
    view: LocalgroupsViewName | 'default'
    filters?: string|Array<string>
    groupId?: string
    userId?: string
    lng?: number
    lat?: number
    includeInactive?: boolean
  }
}

function defaultView(terms: LocalgroupsViewTerms) {
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
}

function userOrganizesGroups(terms: LocalgroupsViewTerms) {
  return {
    selector: {
      organizerIds: terms.userId,
      inactive: null
    },
    options: {sort: {name: 1}}
  };
}

function userActiveGroups(terms: LocalgroupsViewTerms) {
  return {
    selector: {
      organizerIds: terms.userId,
      inactive: false
    },
    options: {sort: {name: 1}}
  };
}

function userInactiveGroups(terms: LocalgroupsViewTerms) {
  return {
    selector: {
      organizerIds: terms.userId,
      inactive: true
    }
  };
}

function all(terms: LocalgroupsViewTerms) {
  return {
    options: {sort: {name: 1}}
  };
}

function nearby(terms: LocalgroupsViewTerms) {
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
}

function single(terms: LocalgroupsViewTerms) {
  return {
    selector: {_id: terms.groupId},
    options: {sort: {createdAt: -1}}
  };
}

function local() {
  return {
    selector: {$or: [
      {isOnline: false}, {isOnline: {$exists: false}}
    ]},
    options: {sort: {name: 1}}
  };
}

function online() {
  return {
    selector: {isOnline: true},
    options: {sort: {name: 1}}
  };
}

export const LocalgroupsViews = new CollectionViewSet('Localgroups', {
  userOrganizesGroups,
  userActiveGroups,
  userInactiveGroups,
  all,
  nearby,
  single,
  local,
  online
}, defaultView);
