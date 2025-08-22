import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, Phone, Coffee, Volume2 } from 'lucide-react';

interface AlertSystemProps {
  alertLevel: 'normal' | 'tired' | 'drowsy';
  drowsinessData: any[];
}

const AlertSystem: React.FC<AlertSystemProps> = ({ alertLevel, drowsinessData }) => {
  const [alertHistory, setAlertHistory] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (alertLevel !== 'normal') {
      triggerAlert();
    } else {
      stopAlert();
    }
  }, [alertLevel]);

  const triggerAlert = () => {
    // Add to alert history
    const newAlert = {
      id: Date.now(),
      level: alertLevel,
      timestamp: new Date(),
      message: getAlertMessage(alertLevel)
    };
    
    setAlertHistory(prev => [newAlert, ...prev.slice(0, 9)]);

    // Play alert sound
    playAlertSound();

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('Drowsiness Alert', {
        body: newAlert.message,
        icon: '/alert-icon.png'
      });
    }
  };

  const stopAlert = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const playAlertSound = () => {
    if (!audioRef.current) {
      // Create audio context for alert sounds
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = alertLevel === 'drowsy' ? 800 : 400;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  const getAlertMessage = (level: string) => {
    switch (level) {
      case 'drowsy':
        return 'CRITICAL: Severe drowsiness detected. Pull over immediately!';
      case 'tired':
        return 'WARNING: Signs of fatigue detected. Consider taking a break.';
      default:
        return 'Driver is alert and focused.';
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'drowsy': return 'bg-red-600 border-red-500';
      case 'tired': return 'bg-yellow-600 border-yellow-500';
      default: return 'bg-green-600 border-green-500';
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  const callEmergency = () => {
    if (confirm('This will attempt to call emergency services. Continue?')) {
      window.location.href = 'tel:911';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Alert Status */}
      <div className={`p-4 rounded-lg border-2 ${getAlertColor(alertLevel)} transition-all duration-300`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {alertLevel === 'drowsy' ? (
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            ) : alertLevel === 'tired' ? (
              <Bell className="w-6 h-6" />
            ) : (
              <Coffee className="w-6 h-6" />
            )}
            <h3 className="font-semibold">
              {alertLevel === 'drowsy' ? 'CRITICAL ALERT' : 
               alertLevel === 'tired' ? 'FATIGUE WARNING' : 'STATUS NORMAL'}
            </h3>
          </div>
          {isPlaying && <Volume2 className="w-5 h-5 animate-pulse" />}
        </div>
        <p className="text-sm">{getAlertMessage(alertLevel)}</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={requestNotificationPermission}
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg text-left transition-all"
          >
            <div className="font-medium">Enable Notifications</div>
            <div className="text-sm text-gray-300">Get browser alerts for drowsiness</div>
          </button>
          
          {alertLevel === 'drowsy' && (
            <button
              onClick={callEmergency}
              className="bg-red-600 hover:bg-red-700 p-3 rounded-lg text-left transition-all"
            >
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <span className="font-medium">Emergency Call</span>
              </div>
              <div className="text-sm text-gray-300">Call emergency services</div>
            </button>
          )}
          
          <button
            onClick={playAlertSound}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-left transition-all"
          >
            <div className="flex items-center">
              <Volume2 className="w-4 h-4 mr-2" />
              <span className="font-medium">Test Alert Sound</span>
            </div>
            <div className="text-sm text-gray-300">Preview alert audio</div>
          </button>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Recent Alerts</h3>
        {alertHistory.length === 0 ? (
          <p className="text-gray-400 text-sm">No recent alerts</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {alertHistory.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded border-l-4 ${
                  alert.level === 'drowsy'
                    ? 'bg-red-900/20 border-red-500'
                    : 'bg-yellow-900/20 border-yellow-500'
                }`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{alert.level}</span>
                  <span className="text-gray-400">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Tips */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Safety Tips</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• Take a break every 2 hours or 100 miles</p>
          <p>• Get 7-8 hours of sleep before long drives</p>
          <p>• Avoid driving during your typical sleep hours</p>
          <p>• Stay hydrated and avoid heavy meals</p>
          <p>• Pull over if you feel drowsy - don't fight it</p>
        </div>
      </div>
    </div>
  );
};

export default AlertSystem;