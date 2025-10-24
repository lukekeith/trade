import type { LucideIcon } from 'lucide-react';
import { BarChart3, List, TrendingUp } from 'lucide-react';

export type WidgetType = 'chart' | 'watchlist' | 'trends';

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
}

export const WIDGET_ICONS: Record<WidgetType, LucideIcon> = {
  chart: BarChart3,
  watchlist: List,
  trends: TrendingUp,
};

export const WIDGET_NAMES: Record<WidgetType, string> = {
  chart: 'Chart',
  watchlist: 'Watchlist',
  trends: 'Trends',
};
