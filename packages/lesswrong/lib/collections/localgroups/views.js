import Localgroups from "./collection.js"

Localgroups.addDefaultView(terms => {
  let selector = {};
  if(Array.isArray(terms.filters) && terms.filters.length) {
    console.log("LocalGroups defaultView:", terms.filters)
    selector.types = {$in: terms.filters};
  } else if (typeof terms.filters === "string") { //If there is only single value we can't distinguish between Array and value
  console.log("LocalGroups defaultView:", terms.filters)
    selector.types = {$in: [terms.filters]};
  }
  return {
    selector
  };
});

Localgroups.addView("all", function (terms) {
  return {
    options: {sort: {createdAt: -1}}
  };
});

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

Localgroups.addView("single", function (terms) {
  return {
    selector: {_id: terms.groupId},
    options: {sort: {createdAt: -1}}
  };
});
