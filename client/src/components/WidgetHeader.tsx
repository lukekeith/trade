import { observer } from 'mobx-react-lite';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { WIDGET_ICONS, WIDGET_NAMES, type WidgetType } from '../types/widget';
import '../styles/WidgetHeader.scss';

interface WidgetHeaderProps {
  widgetType: WidgetType;
  onWidgetChange?: (newType: WidgetType) => void;
  availableWidgets?: WidgetType[];
  actions?: ReactNode; // Custom actions (e.g., add button for watchlist)
}

export const WidgetHeader = observer(({
  widgetType,
  onWidgetChange,
  availableWidgets = ['chart', 'watchlist', 'trends'],
  actions
}: WidgetHeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const Icon = WIDGET_ICONS[widgetType];
  const widgetName = WIDGET_NAMES[widgetType];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleWidgetSelect = (newType: WidgetType) => {
    if (onWidgetChange && newType !== widgetType) {
      onWidgetChange(newType);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="WidgetHeader">
      <div className="WidgetHeader__Content">
        <div className="WidgetHeader__TitleWrapper" ref={dropdownRef}>
          <button
            className="WidgetHeader__Title"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Icon size={16} className="WidgetHeader__Icon" />
            <h2>{widgetName}</h2>
          </button>

          {isDropdownOpen && (
            <div className="WidgetHeader__Dropdown">
              {availableWidgets.map((type) => {
                const DropdownIcon = WIDGET_ICONS[type];
                const name = WIDGET_NAMES[type];
                const isActive = type === widgetType;

                return (
                  <button
                    key={type}
                    className={`WidgetHeader__DropdownItem ${isActive ? 'WidgetHeader__DropdownItem--active' : ''}`}
                    onClick={() => handleWidgetSelect(type)}
                  >
                    <DropdownIcon size={16} />
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {actions && <div className="WidgetHeader__Actions">{actions}</div>}
      </div>
    </div>
  );
});
