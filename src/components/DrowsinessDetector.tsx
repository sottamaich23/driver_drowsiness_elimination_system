import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, AlertTriangle, Eye, Activity } from 'lucide-react';
import FaceDetection from '../utils/FaceDetection';

interface DrowsinessDetectorProps {
  onDrowsinessUpdate: (data: any) => void;
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

const DrowsinessDetector: React.FC<DrowsinessDetectorProps> = ({
  onDrowsinessUpdate,
  isActive,
  onToggle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceDetectionRef = useRef<FaceDetection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [metrics, setMetrics] = useState({
    leftEAR: 0,
    rightEAR: 0,
    avgEAR: 0,
    blinkRate: 0,
    closedEyeFrames: 0,
    yawnFrames: 0
  });

  useEffect(() => {
    if (isActive) {
      startDetection();
    } else {
      stopDetection();
    }

    return () => stopDetection();
  }, [isActive]);

  const startDetection = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Initialize camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = resolve;
        });
      }

      // Initialize face detection
      faceDetectionRef.current = new FaceDetection();
      await faceDetectionRef.current.initialize();

      // Start detection loop
      detectDrowsiness();
      setIsLoading(false);
    } catch (err) {
      setError('Failed to access camera or initialize detection models');
      setIsLoading(false);
      onToggle(false);
    }
  };

  const stopDetection = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (faceDetectionRef.current) {
      faceDetectionRef.current.cleanup();
    }
  };

  const detectDrowsiness = async () => {
    if (!isActive || !videoRef.current || !canvasRef.current || !faceDetectionRef.current || !faceDetectionRef.current.ready) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas and draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Detect faces and analyze
      const result = await faceDetectionRef.current.detectDrowsiness(video);
      
      if (result) {
        setMetrics(result.metrics);
        
        // Draw landmarks and indicators
        drawFaceLandmarks(ctx, result.landmarks);
        drawEyeRegions(ctx, result.eyeRegions);
        
        // Update parent component
        onDrowsinessUpdate({
          ...result.metrics,
          alertLevel: result.alertLevel,
          confidence: result.confidence
        });
      }
    } catch (err) {
      console.error('Detection error:', err);
    }

    // Continue detection loop
    requestAnimationFrame(detectDrowsiness);
  };

  const drawFaceLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any) => {
    if (!landmarks) return;

    ctx.fillStyle = '#00ff00';
    landmarks.forEach((point: any) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const drawEyeRegions = (ctx: CanvasRenderingContext2D, eyeRegions: any) => {
    if (!eyeRegions) return;

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;

    [eyeRegions.left, eyeRegions.right].forEach(eye => {
      if (eye) {
        ctx.beginPath();
        ctx.rect(eye.x, eye.y, eye.width, eye.height);
        ctx.stroke();
      }
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Live Detection Feed</h2>
        <button
          onClick={() => onToggle(!isActive)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
            isActive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : isActive ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Loading...' : isActive ? 'Stop' : 'Start'} Detection</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700 bg-opacity-75">
            <div className="text-center">
              <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">Click Start Detection to begin monitoring</p>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Metrics */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">{metrics.avgEAR.toFixed(3)}</div>
          <div className="text-sm text-gray-400">Avg EAR</div>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">{metrics.blinkRate}</div>
          <div className="text-sm text-gray-400">Blink Rate</div>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-400">{metrics.closedEyeFrames}</div>
          <div className="text-sm text-gray-400">Closed Frames</div>
        </div>
      </div>
    </div>
  );
};

export default DrowsinessDetector;