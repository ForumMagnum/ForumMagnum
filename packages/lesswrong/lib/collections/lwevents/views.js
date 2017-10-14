import LWEvents from "./collection.js"

// notifications for a specific user (what you see in the notifications menu)
LWEvents.addView("adminView", function (terms) {
  return {
    selector: {name: terms.name || null},
    options: {sort: {createdAt: -1}}
  };
});
