import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import StatusCard from '../components/StatusCard';
import ChartWidget from '../components/ChartWidget';
import AlertPanel from '../components/AlertPanel';
import DataTable from '../components/DataTable';
import { LogOut, Activity, Flame, Wind, ShieldAlert, DoorOpen } from 'lucide-react';

const Dashboard = () => {
  const { logout, user } = useAuth();
  const socket = useSocket();
  const [data, setData] = useState({
    temperature: 0,
    gas1: 0,
    gas2: 0,
    flame1: 0,
    flame2: 0,
    gate: 0,
    system_state: 'SAFE'
  });
  const [alerts, setAlerts] = useState([]);
  const [rfidLogs, setRfidLogs] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      try {
        const [latestRes, historyRes, rfidRes, alertsRes] = await Promise.all([
          axios.get(`${API_URL}/api/sensors/latest`, config),
          axios.get(`${API_URL}/api/sensors/history`, config),
          axios.get(`${API_URL}/api/logs/rfid`, config),
          axios.get(`${API_URL}/api/logs/alerts`, config),
        ]);
        if (latestRes.data) setData(latestRes.data);
        setHistory(historyRes.data);
        setRfidLogs(rfidRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, [user.token]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('sensor_update', (newData) => {
      setData(newData);
      setHistory(prev => [...prev.slice(-99), newData]);
    });

    socket.on('new_alerts', (newAlerts) => {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
    });

    socket.on('rfid_update', (log) => {
      setRfidLogs(prev => [log, ...prev].slice(0, 50));
    });

    return () => {
      socket.off('sensor_update');
      socket.off('new_alerts');
      socket.off('rfid_update');
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-darkBg text-slate-200">
      {/* Header */}
      <header className="glass-panel rounded-none border-b border-slate-700/50 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primaryBlue" />
          <h1 className="text-xl font-bold tracking-wider">INDUSTRIAL SAFETY DASHBOARD</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${data.system_state === 'SAFE' ? 'bg-safeGreen' : data.system_state === 'WARNING' ? 'bg-warningYellow' : 'bg-dangerRed animate-pulse'}`}></div>
            <span className="font-semibold text-sm tracking-wide">{data.system_state}</span>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-white transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard 
            title="Temperature" 
            value={`${data.temperature || 0}°C`} 
            icon={<Flame className={data.temperature > 40 ? 'text-dangerRed' : 'text-slate-400'} />} 
            status={data.temperature > 40 ? 'danger' : 'safe'}
          />
          <StatusCard 
            title="Gas Detection" 
            value={data.gas1 || data.gas2 ? 'DETECTED' : 'CLEAR'} 
            icon={<Wind className={data.gas1 || data.gas2 ? 'text-warningYellow' : 'text-slate-400'} />} 
            status={data.gas1 || data.gas2 ? 'warning' : 'safe'}
          />
          <StatusCard 
            title="Fire Detection" 
            value={data.flame1 && data.flame2 ? 'FIRE ALARM' : 'CLEAR'} 
            icon={<ShieldAlert className={data.flame1 && data.flame2 ? 'text-dangerRed' : 'text-slate-400'} />} 
            status={data.flame1 && data.flame2 ? 'danger' : 'safe'}
          />
          <StatusCard 
            title="Emergency Gate" 
            value={data.gate === 90 ? 'OPEN' : 'CLOSED'} 
            icon={<DoorOpen className={data.gate === 90 ? 'text-warningYellow' : 'text-slate-400'} />} 
            status={data.gate === 90 ? 'warning' : 'safe'}
          />
        </div>

        {/* Charts & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartWidget data={history} />
          </div>
          <div className="h-[400px]">
            <AlertPanel alerts={alerts} />
          </div>
        </div>

        {/* RFID Logs */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primaryBlue" />
            Recent Access Logs (RFID)
          </h2>
          <DataTable data={rfidLogs} />
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
