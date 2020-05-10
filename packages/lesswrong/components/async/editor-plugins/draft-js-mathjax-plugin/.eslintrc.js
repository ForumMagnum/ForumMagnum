module.exports = {
  "extends": "airbnb",
  "plugins": [
    "react",
    "jsx-a11y",
    "import"
  ],
  "env": {
    "browser": true,
  },
  "rules": {
    "semi": ["error", "never"],
    "no-underscore-dangle" : "off",
    "react/prop-types": "off",
    "react/jsx-filename-extension": "off",
    "jsx-a11y/no-static-element-interactions": "off"
  }
};
