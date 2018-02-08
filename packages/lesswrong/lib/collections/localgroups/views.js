import LocalGroups from "./collection.js"

// notifications for a specific user (what you see in the notifications menu)
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
