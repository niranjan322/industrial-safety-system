import React from 'react';

const DataTable = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-darkBg/50 text-slate-400 border-b border-slate-700">
          <tr>
            <th className="px-4 py-3 font-medium">Date & Time</th>
            <th className="px-4 py-3 font-medium">Card ID</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {data.length === 0 ? (
            <tr>
              <td colSpan="3" className="px-4 py-6 text-center text-slate-500">No logs available</td>
            </tr>
          ) : (
            data.map((log, index) => (
              <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono">{log.card_id}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    log.status === 'Authorized' 
                      ? 'bg-safeGreen/10 text-safeGreen border border-safeGreen/20' 
                      : 'bg-dangerRed/10 text-dangerRed border border-dangerRed/20'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
