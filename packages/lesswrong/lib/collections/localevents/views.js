import LocalEvents from "./collection.js"

LocalEvents.addDefaultView(function(terms) {
  return {
    selector: {groupId: terms.groupId},
  }
})

LocalEvents.addView("all", function (terms) {
  return {
    options: {sort: {createdAt: -1}}
  };
});

LocalEvents.addView("nearby", function (terms) {
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

LocalEvents.addView("single", function (terms) {
  return {
    selector: {_id: terms.eventId},
    options: {sort: {createdAt: -1}}
  };
});
