// Real-time Optical Motion & Gesture Detection for Webcams & Smart Boards
// 100% Offline & Pure JavaScript (No heavy external dependencies)

export interface MotionZones {
  left: number; // 0 to 100
  right: number;
  top: number;
  bottom: number;
}

export class CameraMotionDetector {
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private animFrameId: number | null = null;
  private lastSampleTime: number = 0;

  // Detection states
  public isRunning: boolean = false;
  public motionScores: MotionZones = { left: 0, right: 0, top: 0, bottom: 0 };
  public activeZoneIndex: number | null = null;
  public holdProgress: number = 0; // 0 to 100%
  private holdStartTimestamp: number = 0;
  private readonly HOLD_DURATION_MS = 1200; // 1.2 seconds hold to lock answer
  private readonly MOTION_THRESHOLD = 18; // motion sensitivity

  public onTrigger?: (optionIndex: number) => void;
  public onStateChange?: (scores: MotionZones, activeZone: number | null, progress: number) => void;

  async start(video: HTMLVideoElement, overlayCanvas?: HTMLCanvasElement): Promise<boolean> {
    try {
      this.videoEl = video;
      this.canvasEl = overlayCanvas || null;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung pada browser ini.');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      this.videoEl.srcObject = this.stream;
      await this.videoEl.play();

      // Create downsampled offscreen canvas for high-performance motion math
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 120;
      this.offscreenCanvas.height = 90;

      this.isRunning = true;
      this.prevFrameData = null;
      this.holdProgress = 0;
      this.activeZoneIndex = null;

      this.loop(0);
      return true;
    } catch (err: any) {
      console.warn('Gagal mengaktifkan kamera:', err);
      this.stop();
      return false;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }

    this.prevFrameData = null;
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    // Sample every ~70ms (~14 FPS) to keep CPU low on smart boards & mobile
    if (timestamp - this.lastSampleTime > 70) {
      this.lastSampleTime = timestamp;
      this.analyzeMotion(timestamp);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private analyzeMotion(timestamp: number) {
    if (!this.videoEl || !this.offscreenCanvas) return;
    const width = this.offscreenCanvas.width;
    const height = this.offscreenCanvas.height;
    const offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    // Draw flipped video (mirror)
    offCtx.save();
    offCtx.scale(-1, 1);
    offCtx.drawImage(this.videoEl, -width, 0, width, height);
    offCtx.restore();

    const frame = offCtx.getImageData(0, 0, width, height);
    const data = frame.data;

    if (!this.prevFrameData) {
      this.prevFrameData = new Uint8ClampedArray(data);
      return;
    }

    // Zone bounding coordinates
    // Left Zone (mirror): x: 0 -> 40, y: 20 -> 80
    // Right Zone: x: 80 -> 120, y: 20 -> 80
    // Top Zone: x: 35 -> 85, y: 0 -> 30
    // Bottom Zone: x: 35 -> 85, y: 65 -> 90

    let leftDiff = 0, leftCount = 0;
    let rightDiff = 0, rightCount = 0;
    let topDiff = 0, topCount = 0;
    let bottomDiff = 0, bottomCount = 0;

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4;
        const curGray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const prevGray = (this.prevFrameData[i] + this.prevFrameData[i + 1] + this.prevFrameData[i + 2]) / 3;
        const diff = Math.abs(curGray - prevGray);

        if (diff > 25) {
          // Significant motion detected in pixel
          if (x < 42 && y > 20 && y < 80) {
            leftDiff += diff;
            leftCount++;
          } else if (x > 78 && y > 20 && y < 80) {
            rightDiff += diff;
            rightCount++;
          } else if (x >= 35 && x <= 85 && y < 30) {
            topDiff += diff;
            topCount++;
          } else if (x >= 35 && x <= 85 && y > 65) {
            bottomDiff += diff;
            bottomCount++;
          }
        }
      }
    }

    // Save previous frame
    this.prevFrameData.set(data);

    // Normalize scores (0 to 100)
    const leftScore = Math.min(100, Math.round((leftCount / 120) * 100));
    const rightScore = Math.min(100, Math.round((rightCount / 120) * 100));
    const topScore = Math.min(100, Math.round((topCount / 90) * 100));
    const bottomScore = Math.min(100, Math.round((bottomCount / 90) * 100));

    this.motionScores = {
      left: leftScore,
      right: rightScore,
      top: topScore,
      bottom: bottomScore,
    };

    // Determine strongest active zone above threshold
    let detectedZone: number | null = null;
    let maxScore = this.MOTION_THRESHOLD;

    if (leftScore > maxScore) {
      maxScore = leftScore;
      detectedZone = 0; // Opsi A (Tangan Kiri)
    }
    if (rightScore > maxScore) {
      maxScore = rightScore;
      detectedZone = 1; // Opsi B (Tangan Kanan)
    }
    if (topScore > maxScore) {
      maxScore = topScore;
      detectedZone = 2; // Opsi C (Kedua Tangan Naik)
    }
    if (bottomScore > maxScore) {
      maxScore = bottomScore;
      detectedZone = 3; // Opsi D (Jongkok / Tunduk)
    }

    // Dwell timer management
    if (detectedZone !== null) {
      if (this.activeZoneIndex === detectedZone) {
        // Holding same zone
        const elapsed = timestamp - this.holdStartTimestamp;
        this.holdProgress = Math.min(100, Math.round((elapsed / this.HOLD_DURATION_MS) * 100));

        if (this.holdProgress >= 100) {
          // Trigger option locked!
          if (this.onTrigger) {
            this.onTrigger(detectedZone);
          }
          this.holdProgress = 0;
          this.activeZoneIndex = null;
          this.holdStartTimestamp = timestamp + 1500; // Debounce after locking
        }
      } else {
        // New zone detected
        this.activeZoneIndex = detectedZone;
        this.holdStartTimestamp = timestamp;
        this.holdProgress = 10;
      }
    } else {
      // No active motion, decay hold progress
      this.holdProgress = Math.max(0, this.holdProgress - 15);
      if (this.holdProgress === 0) {
        this.activeZoneIndex = null;
      }
    }

    if (this.onStateChange) {
      this.onStateChange(this.motionScores, this.activeZoneIndex, this.holdProgress);
    }
  }
}
