import { observer } from 'mobx-react-lite';
import { Application } from '../stores/Application';
import { TrendsPanel } from './TrendsPanel';
import { ChartPanel } from './ChartPanel';
import { TrendsWidget } from './TrendsWidget';
import type { WidgetType } from '../types/widget';

interface PanelProps {
  panelId: 'left' | 'center' | 'right';
}

export const Panel = observer(({ panelId }: PanelProps) => {
  // Get the current widget type for this panel from the UI store
  const widgetType: WidgetType =
    panelId === 'left' ? Application.ui.leftPanelWidget :
    panelId === 'center' ? Application.ui.centerPanelWidget :
    Application.ui.rightPanelWidget;

  // Handle widget change for this panel
  const handleWidgetChange = (newType: WidgetType) => {
    if (panelId === 'left') {
      Application.ui.setLeftPanelWidget(newType);
    } else if (panelId === 'center') {
      Application.ui.setCenterPanelWidget(newType);
    } else {
      Application.ui.setRightPanelWidget(newType);
    }
  };

  // Render the appropriate widget based on the type
  switch (widgetType) {
    case 'watchlist':
      return <TrendsPanel onWidgetChange={handleWidgetChange} />;
    case 'chart':
      return <ChartPanel onWidgetChange={handleWidgetChange} />;
    case 'trends':
      return <TrendsWidget onWidgetChange={handleWidgetChange} />;
    default:
      return null;
  }
});
