import React from 'react';

const StatusCard = ({ title, value, icon, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'danger': return 'border-dangerRed/50 bg-dangerRed/10 text-dangerRed';
      case 'warning': return 'border-warningYellow/50 bg-warningYellow/10 text-warningYellow';
      case 'safe': return 'border-safeGreen/50 bg-safeGreen/10 text-safeGreen';
      default: return 'border-slate-700 bg-darkPanel text-slate-200';
    }
  };

  return (
    <div className={`glass-panel p-6 border-l-4 ${status === 'danger' ? 'border-l-dangerRed' : status === 'warning' ? 'border-l-warningYellow' : status === 'safe' ? 'border-l-safeGreen' : 'border-l-primaryBlue'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h3 className={`text-2xl font-bold mt-2 ${status === 'danger' ? 'text-dangerRed' : status === 'warning' ? 'text-warningYellow' : 'text-slate-200'}`}>
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${getStatusColor()}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
