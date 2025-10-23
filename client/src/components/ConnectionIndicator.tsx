import { observer } from 'mobx-react-lite';
import { Application } from '../stores/Application';
import './ConnectionIndicator.scss';

export const ConnectionIndicator = observer(() => {
  const isConnected = Application.ui.isConnected;

  return (
    <div className="connection-indicator">
      <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
    </div>
  );
});
