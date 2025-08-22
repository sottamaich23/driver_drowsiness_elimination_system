import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

export default class FaceDetection {
  private detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
  private isInitialized = false;
  private closedEyeFrameCount = 0;
  private yawnFrameCount = 0;
  private blinkCount = 0;
  private lastBlinkTime = 0;

  // Public getter to check if detection is ready
  get ready(): boolean {
    return this.isInitialized && this.detector !== null;
  }

  // EAR calculation constants
  private readonly EAR_THRESHOLD = 0.25;
  private readonly CLOSED_EYE_FRAME_THRESHOLD = 15;
  private readonly YAWN_THRESHOLD = 0.6;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize TensorFlow.js backend
      await tf.ready();
      
      // Load face landmarks detection model
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        refineLandmarks: true
      };

      this.detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize face detection:', error);
      throw error;
    }
  }

  async detectDrowsiness(video: HTMLVideoElement) {
    if (!this.detector || !this.isInitialized) {
      throw new Error('Face detection not initialized');
    }

    try {
      const faces = await this.detector.estimateFaces(video);
      
      if (faces.length === 0) {
        return null;
      }

      const face = faces[0];
      const keypoints = face.keypoints;

      // Extract eye landmarks
      const leftEyeLandmarks = this.getEyeLandmarks(keypoints, 'left');
      const rightEyeLandmarks = this.getEyeLandmarks(keypoints, 'right');
      const mouthLandmarks = this.getMouthLandmarks(keypoints);

      // Calculate Eye Aspect Ratios
      const leftEAR = this.calculateEAR(leftEyeLandmarks);
      const rightEAR = this.calculateEAR(rightEyeLandmarks);
      const avgEAR = (leftEAR + rightEAR) / 2;

      // Calculate mouth aspect ratio for yawn detection
      const mouthAR = this.calculateMouthAR(mouthLandmarks);

      // Detect closed eyes
      const eyesClosed = avgEAR < this.EAR_THRESHOLD;
      if (eyesClosed) {
        this.closedEyeFrameCount++;
      } else {
        if (this.closedEyeFrameCount > 0) {
          this.blinkCount++;
        }
        this.closedEyeFrameCount = 0;
      }

      // Detect yawning
      const isYawning = mouthAR > this.YAWN_THRESHOLD;
      if (isYawning) {
        this.yawnFrameCount++;
      } else {
        this.yawnFrameCount = 0;
      }

      // Calculate blink rate (per minute)
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastBlinkTime;
      let blinkRate = 0;
      if (timeDiff >= 60000) { // 1 minute
        blinkRate = this.blinkCount;
        this.blinkCount = 0;
        this.lastBlinkTime = currentTime;
      }

      // Determine alertness level
      const alertLevel = this.determineAlertLevel(avgEAR, this.closedEyeFrameCount, this.yawnFrameCount);

      return {
        landmarks: keypoints,
        eyeRegions: {
          left: this.getEyeRegion(leftEyeLandmarks),
          right: this.getEyeRegion(rightEyeLandmarks)
        },
        metrics: {
          leftEAR,
          rightEAR,
          avgEAR,
          blinkRate,
          closedEyeFrames: this.closedEyeFrameCount,
          yawnFrames: this.yawnFrameCount
        },
        alertLevel,
        confidence: this.calculateConfidence(avgEAR, this.closedEyeFrameCount)
      };
    } catch (error) {
      console.error('Error during drowsiness detection:', error);
      throw error;
    }
  }

  private getEyeLandmarks(keypoints: any[], eye: 'left' | 'right') {
    // MediaPipe Face Mesh landmark indices for eyes
    const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
    
    const indices = eye === 'left' ? leftEyeIndices : rightEyeIndices;
    return indices.map(i => keypoints[i]).filter(point => point);
  }

  private getMouthLandmarks(keypoints: any[]) {
    // MediaPipe Face Mesh landmark indices for mouth
    const mouthIndices = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318];
    return mouthIndices.map(i => keypoints[i]).filter(point => point);
  }

  private calculateEAR(eyeLandmarks: any[]) {
    if (eyeLandmarks.length < 6) return 0;

    try {
      // Use key eye points for EAR calculation
      const p1 = eyeLandmarks[1]; // Top eyelid
      const p2 = eyeLandmarks[5]; // Bottom eyelid
      const p3 = eyeLandmarks[0]; // Left corner
      const p4 = eyeLandmarks[3]; // Right corner

      // Calculate distances
      const verticalDist1 = this.euclideanDistance(p1, p2);
      const verticalDist2 = this.euclideanDistance(eyeLandmarks[2], eyeLandmarks[4]);
      const horizontalDist = this.euclideanDistance(p3, p4);

      // EAR formula
      const ear = (verticalDist1 + verticalDist2) / (2 * horizontalDist);
      return ear || 0;
    } catch (error) {
      return 0;
    }
  }

  private calculateMouthAR(mouthLandmarks: any[]) {
    if (mouthLandmarks.length < 6) return 0;

    try {
      // Use key mouth points
      const top = mouthLandmarks[3];
      const bottom = mouthLandmarks[9];
      const left = mouthLandmarks[0];
      const right = mouthLandmarks[6];

      const verticalDist = this.euclideanDistance(top, bottom);
      const horizontalDist = this.euclideanDistance(left, right);

      return verticalDist / horizontalDist || 0;
    } catch (error) {
      return 0;
    }
  }

  private euclideanDistance(point1: any, point2: any) {
    if (!point1 || !point2) return 0;
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getEyeRegion(eyeLandmarks: any[]) {
    if (eyeLandmarks.length === 0) return null;

    const xs = eyeLandmarks.map(p => p.x);
    const ys = eyeLandmarks.map(p => p.y);

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  }

  private determineAlertLevel(avgEAR: number, closedFrames: number, yawnFrames: number): 'normal' | 'tired' | 'drowsy' {
    // Critical drowsiness conditions
    if (closedFrames > this.CLOSED_EYE_FRAME_THRESHOLD || yawnFrames > 10) {
      return 'drowsy';
    }

    // Fatigue warning conditions  
    if (avgEAR < this.EAR_THRESHOLD * 1.2 || closedFrames > this.CLOSED_EYE_FRAME_THRESHOLD / 2 || yawnFrames > 5) {
      return 'tired';
    }

    return 'normal';
  }

  private calculateConfidence(avgEAR: number, closedFrames: number): number {
    // Simple confidence calculation based on detection quality
    let confidence = 1.0;
    
    if (avgEAR === 0) confidence *= 0.5; // Poor detection
    if (closedFrames > 0) confidence *= 0.8; // Some uncertainty during closed eyes
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  cleanup() {
    if (this.detector) {
      this.detector = null;
    }
    this.isInitialized = false;
  }
}