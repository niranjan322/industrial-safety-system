import React from 'react';
import { Bell, Flame, Wind, ShieldAlert, DoorOpen } from 'lucide-react';

const AlertPanel = ({ alerts }) => {
  
  const getIcon = (type) => {
    switch(type) {
      case 'FIRE': return <Flame className="h-5 w-5 text-dangerRed" />;
      case 'GAS': return <Wind className="h-5 w-5 text-warningYellow" />;
      case 'GATE': return <DoorOpen className="h-5 w-5 text-warningYellow" />;
      case 'RFID': return <ShieldAlert className="h-5 w-5 text-dangerRed" />;
      default: return <Bell className="h-5 w-5 text-primaryBlue" />;
    }
  };

  const getBorderColor = (type) => {
    switch(type) {
      case 'FIRE':
      case 'RFID': return 'border-dangerRed/50';
      case 'GAS':
      case 'GATE': return 'border-warningYellow/50';
      default: return 'border-slate-700';
    }
  };

  return (
    <div className="glass-panel p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-primaryBlue" />
        <h2 className="text-lg font-semibold text-slate-200">Recent Alerts</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {alerts.length === 0 ? (
          <div className="text-slate-500 text-center mt-10">No alerts found</div>
        ) : (
          alerts.map((alert, index) => (
            <div key={index} className={`flex items-start gap-3 p-3 rounded-lg bg-darkBg border ${getBorderColor(alert.type)}`}>
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div>
                <p className="text-sm text-slate-200 font-medium">{alert.message}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertPanel;
