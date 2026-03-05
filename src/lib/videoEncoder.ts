/**
 * Advanced motion video encoder using Canvas + MediaRecorder.
 * Uses transform-based interpolation with motion blur for smooth continuous motion synthesis.
 */

interface VideoEncoderOptions {
  frames: string[];
  width?: number;
  height?: number;
  fps?: number;
  durationPerFrame?: number; // seconds per keyframe transition
  loops?: number;
  brandOverlay?: {
    logoUrl?: string;
    accentColor?: string;
    watermarkOpacity?: number;
    brandName?: string;
  };
  onProgress?: (pct: number) => void;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Smooth ease-in-out curve for natural motion
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Subtle Ken Burns-style transform for each frame to add micro-motion
 */
function getFrameTransform(frameIndex: number, totalFrames: number, t: number) {
  const phase = (frameIndex / totalFrames) * Math.PI * 2;
  const scale = 1.0 + 0.008 * Math.sin(phase + t * Math.PI); // Very subtle 0.8% zoom
  const panX = 2 * Math.sin(phase * 0.7 + t * 1.5); // ±2px horizontal drift
  const panY = 1.5 * Math.cos(phase * 0.5 + t * 1.2); // ±1.5px vertical drift
  return { scale, panX, panY };
}

export async function encodeVideo(opts: VideoEncoderOptions): Promise<Blob> {
  const {
    frames,
    width = 1080,
    height = 1920,
    fps = 24,
    durationPerFrame = 0.7, // shorter per-frame for 10 frames = ~7s total
    loops = 1,
    brandOverlay,
    onProgress,
  } = opts;

  if (frames.length < 2) throw new Error("Need at least 2 frames");

  const images = await Promise.all(frames.map(loadImage));

  let logoImg: HTMLImageElement | null = null;
  if (brandOverlay?.logoUrl) {
    try { logoImg = await loadImage(brandOverlay.logoUrl); } catch { /* skip */ }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 10_000_000, // 10 Mbps for high quality
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = (e) => reject(e);
    recorder.start();

    const framesPerTransition = Math.round(fps * durationPerFrame);
    const totalTransitions = (images.length - 1) * loops;
    const holdFrames = Math.round(fps * 0.5); // 0.5s hold at start and end
    const totalFrameCount = totalTransitions * framesPerTransition + holdFrames * 2;
    let globalFrame = 0;

    /**
     * Draw an image with optional transform (scale + pan)
     */
    const drawImageWithTransform = (
      img: HTMLImageElement,
      transform: { scale: number; panX: number; panY: number },
      alpha: number
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const s = transform.scale;
      const drawW = width * s;
      const drawH = height * s;
      const dx = (width - drawW) / 2 + transform.panX;
      const dy = (height - drawH) / 2 + transform.panY;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
    };

    /**
     * Draw motion blur effect between two frames at transition point
     */
    const drawMotionBlur = (
      imgFrom: HTMLImageElement,
      imgTo: HTMLImageElement,
      t: number,
      transIdx: number
    ) => {
      const eased = easeInOutCubic(t);

      // Main crossfade with transforms
      const fromTransform = getFrameTransform(transIdx, totalTransitions, 1 - eased);
      const toTransform = getFrameTransform(transIdx + 1, totalTransitions, eased);

      // Draw base frame
      ctx.globalCompositeOperation = "source-over";
      drawImageWithTransform(imgFrom, fromTransform, 1 - eased);

      // Draw incoming frame
      drawImageWithTransform(imgTo, toTransform, eased);

      // During mid-transition (0.3-0.7), add subtle motion blur effect
      if (t > 0.25 && t < 0.75) {
        const blurIntensity = 1 - Math.abs(t - 0.5) * 4; // peaks at 0.5
        if (blurIntensity > 0) {
          ctx.save();
          ctx.globalAlpha = blurIntensity * 0.08; // Very subtle
          ctx.filter = `blur(${Math.round(blurIntensity * 2)}px)`;
          ctx.drawImage(imgTo, 0, 0, width, height);
          ctx.filter = "none";
          ctx.restore();
        }
      }
    };

    const drawOverlays = (introAlpha: number) => {
      if (!brandOverlay) return;

      // Watermark logo (top-right)
      if (logoImg) {
        const logoH = height * 0.04;
        const logoW = (logoImg.width / logoImg.height) * logoH;
        ctx.globalAlpha = (brandOverlay.watermarkOpacity ?? 0.6) * introAlpha;
        ctx.drawImage(logoImg, width - logoW - 40, 40, logoW, logoH);
        ctx.globalAlpha = 1;
      }

      // Accent color lower-third strip
      if (brandOverlay.accentColor) {
        const stripH = height * 0.035;
        ctx.globalAlpha = 0.85 * introAlpha;
        ctx.fillStyle = brandOverlay.accentColor;
        ctx.fillRect(0, height - stripH, width, stripH);

        if (brandOverlay.brandName) {
          ctx.globalAlpha = introAlpha;
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `bold ${Math.round(stripH * 0.5)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(brandOverlay.brandName.toUpperCase(), width / 2, height - stripH * 0.35);
        }
        ctx.globalAlpha = 1;
      }
    };

    // Rendering pipeline
    const allTransitions: { from: number; to: number }[] = [];
    for (let loop = 0; loop < loops; loop++) {
      for (let i = 0; i < images.length - 1; i++) {
        allTransitions.push({ from: i, to: i + 1 });
      }
    }

    let phase: "intro_hold" | "transitions" | "outro_hold" = "intro_hold";
    let phaseFrame = 0;
    let transIdx = 0;
    let frameInTrans = 0;

    const drawNextFrame = () => {
      if (phase === "intro_hold") {
        // Hold on first frame with subtle intro fade
        const introT = phaseFrame / holdFrames;
        ctx.clearRect(0, 0, width, height);
        const transform = getFrameTransform(0, totalTransitions, introT);
        drawImageWithTransform(images[0], transform, 1);
        drawOverlays(easeInOutCubic(introT));

        phaseFrame++;
        globalFrame++;
        onProgress?.(globalFrame / totalFrameCount);

        if (phaseFrame >= holdFrames) {
          phase = "transitions";
          phaseFrame = 0;
        }
        setTimeout(drawNextFrame, 1000 / fps);
        return;
      }

      if (phase === "transitions") {
        if (transIdx >= allTransitions.length) {
          phase = "outro_hold";
          phaseFrame = 0;
          setTimeout(drawNextFrame, 1000 / fps);
          return;
        }

        const { from, to } = allTransitions[transIdx];
        const t = frameInTrans / framesPerTransition;

        ctx.clearRect(0, 0, width, height);
        drawMotionBlur(images[from], images[to], t, transIdx);
        drawOverlays(1);

        globalFrame++;
        onProgress?.(globalFrame / totalFrameCount);

        frameInTrans++;
        if (frameInTrans >= framesPerTransition) {
          frameInTrans = 0;
          transIdx++;
        }

        setTimeout(drawNextFrame, 1000 / fps);
        return;
      }

      if (phase === "outro_hold") {
        // Hold on last frame
        const lastImg = images[images.length - 1];
        const outroT = phaseFrame / holdFrames;
        ctx.clearRect(0, 0, width, height);
        const transform = getFrameTransform(images.length - 1, totalTransitions, outroT);
        drawImageWithTransform(lastImg, transform, 1);
        drawOverlays(1);

        phaseFrame++;
        globalFrame++;
        onProgress?.(globalFrame / totalFrameCount);

        if (phaseFrame >= holdFrames) {
          recorder.stop();
          return;
        }
        setTimeout(drawNextFrame, 1000 / fps);
      }
    };

    drawNextFrame();
  });
}

/**
 * Extract thumbnail stills from keyframes for campaign pack.
 */
export function getThumbnailFrames(frameUrls: string[], count = 3): string[] {
  if (frameUrls.length <= count) return [...frameUrls];
  const step = Math.floor(frameUrls.length / count);
  return Array.from({ length: count }, (_, i) => frameUrls[Math.min(i * step, frameUrls.length - 1)]);
}
