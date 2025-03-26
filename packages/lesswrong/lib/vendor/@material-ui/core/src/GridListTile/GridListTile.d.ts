import * as React from 'react';
import { StandardProps } from '..';

export interface GridListTileProps
  extends StandardProps<React.HTMLAttributes<HTMLLIElement>, GridListTileClassKey> {
  cols?: number;
  component?: React.ReactType<GridListTileProps>;
  rows?: number;
}

export type GridListTileClassKey = 'root' | 'tile' | 'imgFullHeight' | 'imgFullWidth';

declare const GridListTile: React.ComponentType<GridListTileProps>;

export default GridListTile;
