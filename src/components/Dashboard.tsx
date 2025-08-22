import React, { useRef, useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Calendar } from 'lucide-react';
import Chart from 'chart.js/auto';

interface DashboardProps {
  drowsinessData: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ drowsinessData }) => {
  const earChartRef = useRef<HTMLCanvasElement>(null);
  const alertChartRef = useRef<HTMLCanvasElement>(null);
  const earChart = useRef<Chart | null>(null);
  const alertChart = useRef<Chart | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  useEffect(() => {
    if (drowsinessData.length > 0) {
      updateCharts();
    }
  }, [drowsinessData, timeRange]);

  useEffect(() => {
    return () => {
      earChart.current?.destroy();
      alertChart.current?.destroy();
    };
  }, []);

  const updateCharts = () => {
    const filteredData = filterDataByTimeRange(drowsinessData, timeRange);
    
    updateEARChart(filteredData);
    updateAlertChart(filteredData);
  };

  const filterDataByTimeRange = (data: any[], range: string) => {
    const now = Date.now();
    const timeLimit = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    }[range];
    
    return data.filter(item => now - item.timestamp <= timeLimit);
  };

  const updateEARChart = (data: any[]) => {
    if (!earChartRef.current) return;

    if (earChart.current) {
      earChart.current.destroy();
    }

    const ctx = earChartRef.current.getContext('2d')!;
    
    earChart.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
        datasets: [
          {
            label: 'Left Eye EAR',
            data: data.map(item => item.leftEAR),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          },
          {
            label: 'Right Eye EAR',
            data: data.map(item => item.rightEAR),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          },
          {
            label: 'Average EAR',
            data: data.map(item => item.avgEAR),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#e5e7eb'
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' }
          },
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' },
            min: 0,
            max: 0.4
          }
        }
      }
    });
  };

  const updateAlertChart = (data: any[]) => {
    if (!alertChartRef.current) return;

    if (alertChart.current) {
      alertChart.current.destroy();
    }

    const ctx = alertChartRef.current.getContext('2d')!;
    
    const alertCounts = data.reduce((acc, item) => {
      acc[item.alertLevel] = (acc[item.alertLevel] || 0) + 1;
      return acc;
    }, {});

    alertChart.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Normal', 'Tired', 'Drowsy'],
        datasets: [{
          data: [
            alertCounts.normal || 0,
            alertCounts.tired || 0,
            alertCounts.drowsy || 0
          ],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#e5e7eb',
              padding: 20
            }
          }
        }
      }
    });
  };

  const getStats = () => {
    if (drowsinessData.length === 0) {
      return {
        avgEAR: 0,
        totalAlerts: 0,
        drowsyPercentage: 0,
        sessionDuration: 0
      };
    }

    const avgEAR = drowsinessData.reduce((sum, item) => sum + item.avgEAR, 0) / drowsinessData.length;
    const drowsyCount = drowsinessData.filter(item => item.alertLevel === 'drowsy').length;
    const totalAlerts = drowsinessData.filter(item => item.alertLevel !== 'normal').length;
    const drowsyPercentage = (drowsyCount / drowsinessData.length) * 100;
    
    const sessionStart = drowsinessData[0]?.timestamp || Date.now();
    const sessionEnd = drowsinessData[drowsinessData.length - 1]?.timestamp || Date.now();
    const sessionDuration = (sessionEnd - sessionStart) / 1000 / 60; // minutes

    return {
      avgEAR: avgEAR.toFixed(3),
      totalAlerts,
      drowsyPercentage: drowsyPercentage.toFixed(1),
      sessionDuration: sessionDuration.toFixed(0)
    };
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {(['1h', '6h', '24h'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Average EAR</p>
              <p className="text-2xl font-bold text-blue-400">{stats.avgEAR}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Alerts</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.totalAlerts}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Drowsy Episodes</p>
              <p className="text-2xl font-bold text-red-400">{stats.drowsyPercentage}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Session Duration</p>
              <p className="text-2xl font-bold text-green-400">{stats.sessionDuration}m</p>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Eye Aspect Ratio Over Time</h3>
          <div className="h-80">
            <canvas ref={earChartRef}></canvas>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Alert Distribution</h3>
          <div className="h-80">
            <canvas ref={alertChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Session Summary
        </h3>
        {drowsinessData.length === 0 ? (
          <p className="text-gray-400">No data available. Start detection to see analytics.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Points Collected:</span>
                  <span>{drowsinessData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Normal State:</span>
                  <span className="text-green-400">
                    {((drowsinessData.filter(d => d.alertLevel === 'normal').length / drowsinessData.length) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fatigue Episodes:</span>
                  <span className="text-yellow-400">
                    {drowsinessData.filter(d => d.alertLevel === 'tired').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Critical Alerts:</span>
                  <span className="text-red-400">
                    {drowsinessData.filter(d => d.alertLevel === 'drowsy').length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <div className="space-y-2 text-sm text-gray-300">
                {parseInt(stats.drowsyPercentage) > 10 && (
                  <p>• High drowsiness detected - consider stopping for rest</p>
                )}
                {parseInt(stats.sessionDuration) > 120 && (
                  <p>• Long driving session - take a 15-minute break</p>
                )}
                {parseFloat(stats.avgEAR) < 0.2 && (
                  <p>• Low average EAR - ensure proper lighting and camera position</p>
                )}
                <p>• Maintain regular sleep schedule for better alertness</p>
                <p>• Stay hydrated during long drives</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;