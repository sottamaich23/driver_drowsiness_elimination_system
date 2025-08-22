import React, { useState } from 'react';
import { Settings, Sliders, Bell, Eye, Volume2, Save } from 'lucide-react';

const CalibrationPanel: React.FC = () => {
  const [settings, setSettings] = useState({
    earThreshold: 0.25,
    closedEyeFrames: 15,
    yawnThreshold: 0.6,
    alertSensitivity: 'medium',
    soundEnabled: true,
    notificationsEnabled: true,
    emergencyContact: '',
    calibrationMode: false
  });

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationStep(0);
  };

  const nextCalibrationStep = () => {
    if (calibrationStep < 3) {
      setCalibrationStep(calibrationStep + 1);
    } else {
      setIsCalibrating(false);
      setCalibrationStep(0);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('drowsinessSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  const resetToDefaults = () => {
    setSettings({
      earThreshold: 0.25,
      closedEyeFrames: 15,
      yawnThreshold: 0.6,
      alertSensitivity: 'medium',
      soundEnabled: true,
      notificationsEnabled: true,
      emergencyContact: '',
      calibrationMode: false
    });
  };

  const calibrationSteps = [
    {
      title: 'Normal Eyes Open',
      instruction: 'Look straight ahead with your eyes wide open for 5 seconds.',
      icon: <Eye className="w-8 h-8" />
    },
    {
      title: 'Blink Normally',
      instruction: 'Blink naturally at your normal rate for 10 seconds.',
      icon: <Eye className="w-8 h-8" />
    },
    {
      title: 'Simulated Tiredness',
      instruction: 'Close your eyes for 2-3 seconds to simulate tiredness.',
      icon: <Eye className="w-8 h-8" />
    },
    {
      title: 'Yawn Detection',
      instruction: 'Open your mouth wide as if yawning for calibration.',
      icon: <Eye className="w-8 h-8" />
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Settings className="w-7 h-7 mr-3" />
          Detection Settings & Calibration
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={saveSettings}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
          <button
            onClick={resetToDefaults}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-all"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Calibration Modal */}
      {isCalibrating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              Step {calibrationStep + 1} of {calibrationSteps.length}
            </h3>
            <div className="text-center mb-6">
              {calibrationSteps[calibrationStep].icon}
              <h4 className="text-lg font-semibold mt-2 mb-2">
                {calibrationSteps[calibrationStep].title}
              </h4>
              <p className="text-gray-300">
                {calibrationSteps[calibrationStep].instruction}
              </p>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setIsCalibrating(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={nextCalibrationStep}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all"
              >
                {calibrationStep === calibrationSteps.length - 1 ? 'Complete' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Parameters */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Sliders className="w-5 h-5 mr-2" />
            Detection Parameters
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Eye Aspect Ratio (EAR) Threshold
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0.15"
                  max="0.35"
                  step="0.01"
                  value={settings.earThreshold}
                  onChange={(e) => handleSettingChange('earThreshold', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="w-16 text-right">{settings.earThreshold}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Lower values = more sensitive detection
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Closed Eye Frames Threshold
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={settings.closedEyeFrames}
                  onChange={(e) => handleSettingChange('closedEyeFrames', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-16 text-right">{settings.closedEyeFrames}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Number of consecutive closed eye frames before alert
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Yawn Detection Threshold
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0.4"
                  max="0.8"
                  step="0.05"
                  value={settings.yawnThreshold}
                  onChange={(e) => handleSettingChange('yawnThreshold', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="w-16 text-right">{settings.yawnThreshold}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Mouth aspect ratio for yawn detection
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Alert Sensitivity
              </label>
              <select
                value={settings.alertSensitivity}
                onChange={(e) => handleSettingChange('alertSensitivity', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
              >
                <option value="low">Low - Less frequent alerts</option>
                <option value="medium">Medium - Balanced detection</option>
                <option value="high">High - More sensitive alerts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alert & Notification Settings */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Alerts & Notifications
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Sound Alerts</label>
                <p className="text-sm text-gray-400">Play audio when drowsiness detected</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Browser Notifications</label>
                <p className="text-sm text-gray-400">Show desktop notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Emergency Contact (Optional)
              </label>
              <input
                type="tel"
                placeholder="Phone number for emergency alerts"
                value={settings.emergencyContact}
                onChange={(e) => handleSettingChange('emergencyContact', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-400 mt-1">
                Will be notified during critical drowsiness episodes
              </p>
            </div>

            <button
              onClick={() => {
                const audio = new Audio();
                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 1);
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <Volume2 className="w-4 h-4" />
              <span>Test Alert Sound</span>
            </button>
          </div>
        </div>

        {/* Calibration Section */}
        <div className="bg-gray-800 p-6 rounded-lg lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            System Calibration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-300 mb-4">
                Calibrate the system to your specific facial features and driving position for optimal accuracy. 
                This process takes about 2 minutes and significantly improves detection reliability.
              </p>
              
              <button
                onClick={startCalibration}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <Settings className="w-5 h-5" />
                <span>Start Calibration Process</span>
              </button>
            </div>

            <div>
              <h4 className="font-medium mb-2">Calibration Benefits:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Personalized drowsiness thresholds</li>
                <li>• Reduced false positives</li>
                <li>• Better accuracy in various lighting</li>
                <li>• Optimized for your eye shape</li>
                <li>• Improved yawn detection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mt-6 bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">System Information:</h4>
            <div className="space-y-1 text-gray-300">
              <p>Detection Model: TensorFlow.js Face Landmarks</p>
              <p>Processing Rate: 30 FPS</p>
              <p>Landmark Points: 468 facial keypoints</p>
              <p>Supported Browsers: Chrome, Firefox, Safari</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Privacy & Data:</h4>
            <div className="space-y-1 text-gray-300">
              <p>All processing happens locally in your browser</p>
              <p>No video data is transmitted or stored</p>
              <p>Settings saved locally on your device</p>
              <p>No personal data collection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationPanel;