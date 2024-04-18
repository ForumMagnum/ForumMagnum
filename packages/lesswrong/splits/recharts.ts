// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, YAxis, XAxis, AreaChart, Area, LineChart, Line, Tooltip } from 'recharts';

export type WrappedReCharts = {
  BarChart:            typeof BarChart,
  Bar:                 typeof Bar,
  CartesianGrid:       typeof CartesianGrid,
  ResponsiveContainer: typeof ResponsiveContainer,
  YAxis:               typeof YAxis,
  XAxis:               typeof XAxis,
  AreaChart:           typeof AreaChart,
  Area:                typeof Area,
  LineChart:           typeof LineChart,
  Line:                typeof Line,
  Tooltip:             typeof Tooltip,
};

declare global {
  interface Window {
    recharts: WrappedReCharts|null;
  }
}

const wrappedRecharts: WrappedReCharts = { BarChart, Bar, CartesianGrid, ResponsiveContainer, YAxis, XAxis, AreaChart, Area, LineChart, Line, Tooltip };

(window as any).recharts = wrappedRecharts;
