import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertTriangle, Activity, Settings, BarChart3, Phone } from 'lucide-react';
import DrowsinessDetector from './components/DrowsinessDetector';
import Dashboard from './components/Dashboard';
import AlertSystem from './components/AlertSystem';
import CalibrationPanel from './components/CalibrationPanel';

function App() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentView, setCurrentView] = useState<'detector' | 'dashboard' | 'settings'>('detector');
  const [drowsinessData, setDrowsinessData] = useState<any[]>([]);
  const [alertLevel, setAlertLevel] = useState<'normal' | 'tired' | 'drowsy'>('normal');

  const handleDrowsinessUpdate = (data: any) => {
    setDrowsinessData(prev => [...prev.slice(-50), { ...data, timestamp: Date.now() }]);
    setAlertLevel(data.alertLevel);
  };

  const getStatusColor = () => {
    switch (alertLevel) {
      case 'drowsy': return 'bg-red-500';
      case 'tired': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusText = () => {
    switch (alertLevel) {
      case 'drowsy': return 'DROWSINESS DETECTED';
      case 'tired': return 'FATIGUE WARNING';
      default: return 'ALERT & FOCUSED';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Driver Drowsiness Elimination System</h1>
              <p className="text-sm text-gray-400">Real-time safety monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor()}`}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>{getStatusText()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentView('detector')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentView === 'detector'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Live Detection
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentView === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {currentView === 'detector' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-[calc(100vh-180px)]">
            <div className="lg:col-span-2">
              <DrowsinessDetector 
                onDrowsinessUpdate={handleDrowsinessUpdate}
                isActive={isDetecting}
                onToggle={setIsDetecting}
              />
            </div>
            <div className="space-y-6">
              <AlertSystem alertLevel={alertLevel} drowsinessData={drowsinessData} />
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <Dashboard drowsinessData={drowsinessData} />
        )}

        {currentView === 'settings' && (
          <CalibrationPanel />
        )}
      </main>
    </div>
  );
}

export default App;