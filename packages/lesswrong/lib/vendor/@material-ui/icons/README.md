# @material-ui/icons

This package provides the Google [Material icons](https://material.io/tools/icons/) packaged as a set of [React](https://facebook.github.io/react/) components.

## Installation

Install the package in your project directory with:

```sh
npm install @material-ui/icons
```

These components use the Material-UI [SvgIcon](https://material-ui.com/api/svg-icon/) component to
render the SVG path for each icon, and so a have a peer-dependency on the `next` release of Material-UI.

If you are not already using Material-UI in your project, you can add it with:

```sh
// with npm
npm install @/lib/vendor/@material-ui/core/src

// with yarn
yarn add @/lib/vendor/@material-ui/core/src
```

## Usage

You can use [material.io/tools/icons](https://material.io/tools/icons/?style=baseline) to find a specific icon.
When importing an icon, keep in mind that the names of the icons are `PascalCase`, for instance:
- [`delete`](https://material.io/tools/icons/?icon=delete&style=baseline) is exposed as `@/lib/vendor/@material-ui/icons/src/Delete`
- [`delete forever`](https://material.io/tools/icons/?icon=delete_forever&style=baseline) is exposed as `@/lib/vendor/@material-ui/icons/src/DeleteForever`

For *"themed"* icons, append the theme name to the icon name. For instance with the
- The Outlined [`delete`](https://material.io/tools/icons/?icon=delete&style=outline) icon is exposed as `@/lib/vendor/@material-ui/icons/src/DeleteOutlined`
- The Rounded [`delete`](https://material.io/tools/icons/?icon=delete&style=rounded) icon is exposed as `@/lib/vendor/@material-ui/icons/src/DeleteRounded`
- The Two Tone [`delete`](https://material.io/tools/icons/?icon=delete&style=twotone) icon is exposed as `@/lib/vendor/@material-ui/icons/src/DeleteTwoTone`
- The Sharp [`delete`](https://material.io/tools/icons/?icon=delete&style=sharp) icon is exposed as `@/lib/vendor/@material-ui/icons/src/DeleteSharp`

There are three exceptions to this rule:
- [`3d_rotation`](https://material.io/tools/icons/?icon=3d_rotation&style=baseline) is exposed as `@/lib/vendor/@material-ui/icons/src/ThreeDRotation`
- [`4k`](https://material.io/tools/icons/?icon=4k&style=baseline) is exposed as `@/lib/vendor/@material-ui/icons/src/FourK`
- [`360`](https://material.io/tools/icons/?icon=360&style=baseline) is exposed as `@/lib/vendor/@material-ui/icons/src/ThreeSixty`

## Imports

- If your environment doesn't support tree-shaking, the **recommended** way to import the icons is the following:
```jsx
import AccessAlarmIcon from '@/lib/vendor/@material-ui/icons/src/AccessAlarm';
import ThreeDRotation from '@/lib/vendor/@material-ui/icons/src/ThreeDRotation';
```

- If your environment support tree-shaking you can also import the icons this way:
```jsx
import { AccessAlarm, ThreeDRotation } from '@material-ui/icons';
```

Note: Importing named exports in this way will result in the code for *every icon* being included in your project, so is not recommended unless you configure [tree-shaking](https://webpack.js.org/guides/tree-shaking/). It may also impact Hot Module Reload performance.

## Upgrading

If you are upgrading an existing project from Material-UI 0.x.x, you will need to revise the import paths
from `material-ui/svg-icons/<category>/<icon-name>` to `@/lib/vendor/@material-ui/icons/src/<IconName>`.

[Here](https://github.com/mui-org/material-ui/tree/master/packages/material-ui-codemod#svg-icon-imports)'s a `jscodeshift` [codemod](https://github.com/facebook/codemod) to help you upgrade.
