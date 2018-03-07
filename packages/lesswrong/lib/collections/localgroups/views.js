import LocalGroups from "./collection.js"

LocalGroups.addView("all", function (terms) {
  return {
    options: {sort: {createdAt: -1}}
  };
});

LocalGroups.addView("nearby", function (terms) {
  console.log("localGroups near query:", terms)
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

LocalGroups.addView("single", function (terms) {
  return {
    selector: {_id: terms.groupId},
    options: {sort: {createdAt: -1}}
  };
});
