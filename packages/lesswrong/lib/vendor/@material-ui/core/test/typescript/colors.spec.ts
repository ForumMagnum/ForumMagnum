import { colors, Color } from '@/lib/vendor/@material-ui/core/src';

const {
  amber, blue, blueGrey,
  brown, cyan, deepOrange,
  deepPurple, green, grey,
  indigo, lightBlue, lightGreen,
  lime, orange, pink,
  purple, red, teal,
  yellow, common
} = colors;

const colorList: Color[] = [
  amber,
  blue,
  blueGrey,
  brown,
  cyan,
  deepOrange,
  deepPurple,
  green,
  grey,
  indigo,
  lightBlue,
  lightGreen,
  lime,
  orange,
  pink,
  purple,
  red,
  teal,
  yellow,
];

const { black, white } = common;

[black, white].forEach((color: string) => color);
