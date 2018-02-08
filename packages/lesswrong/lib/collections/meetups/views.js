import Meetups from "./collection.js"

// notifications for a specific user (what you see in the notifications menu)
Meetups.addView("nearby", function (terms) {
  return {
    selector: {
      mongoLocation: {$near: [ terms.lat, terms.lng ]},
    },
    sort: {createdAt: null}
  };
});
