/**
 * Frame-based video encoder using Canvas + MediaRecorder.
 * Interpolates between keyframes to produce smooth MP4/WebM loops.
 */

interface VideoEncoderOptions {
  frames: string[]; // URLs of keyframe images
  width?: number;
  height?: number;
  fps?: number;
  durationPerFrame?: number; // seconds per keyframe (with interpolation)
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export async function encodeVideo(opts: VideoEncoderOptions): Promise<Blob> {
  const {
    frames,
    width = 1080,
    height = 1920,
    fps = 24,
    durationPerFrame = 1.4,
    loops = 1,
    brandOverlay,
    onProgress,
  } = opts;

  if (frames.length < 2) throw new Error("Need at least 2 frames");

  // Load all frame images
  const images = await Promise.all(frames.map(loadImage));

  // Load logo if provided
  let logoImg: HTMLImageElement | null = null;
  if (brandOverlay?.logoUrl) {
    try {
      logoImg = await loadImage(brandOverlay.logoUrl);
    } catch {
      // Skip logo
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Use MediaRecorder with WebM (widely supported)
  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000, // 8 Mbps for quality
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

    // Calculate total frames
    const framesPerKeyframe = Math.round(fps * durationPerFrame);
    const totalKeyTransitions = (images.length - 1) * loops + (loops > 1 ? images.length - 1 : 0);
    const totalFrames = totalKeyTransitions * framesPerKeyframe;
    let renderedFrames = 0;

    // Render interpolated frames
    const renderLoop = () => {
      const allTransitions: { from: number; to: number }[] = [];
      for (let loop = 0; loop < loops; loop++) {
        for (let i = 0; i < images.length - 1; i++) {
          allTransitions.push({ from: i, to: i + 1 });
        }
        // Return transition (last frame back to first for seamless loop)
        if (loop < loops - 1) {
          allTransitions.push({ from: images.length - 1, to: 0 });
        }
      }

      let transIdx = 0;
      let frameInTrans = 0;

      const drawFrame = () => {
        if (transIdx >= allTransitions.length) {
          // Add 0.5s hold on last frame
          const holdFrames = Math.round(fps * 0.5);
          let holdCount = 0;
          const holdInterval = setInterval(() => {
            ctx.drawImage(images[allTransitions[allTransitions.length - 1].to], 0, 0, width, height);
            drawOverlays(1);
            holdCount++;
            if (holdCount >= holdFrames) {
              clearInterval(holdInterval);
              recorder.stop();
            }
          }, 1000 / fps);
          return;
        }

        const { from, to } = allTransitions[transIdx];
        const t = frameInTrans / framesPerKeyframe; // 0..1 interpolation
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease-in-out

        // Draw crossfade
        ctx.globalAlpha = 1;
        ctx.drawImage(images[from], 0, 0, width, height);
        ctx.globalAlpha = eased;
        ctx.drawImage(images[to], 0, 0, width, height);
        ctx.globalAlpha = 1;

        // Brand overlays
        const introFade = renderedFrames < fps * 0.5 ? renderedFrames / (fps * 0.5) : 1;
        drawOverlays(introFade);

        renderedFrames++;
        onProgress?.(Math.min(renderedFrames / totalFrames, 1));

        frameInTrans++;
        if (frameInTrans >= framesPerKeyframe) {
          frameInTrans = 0;
          transIdx++;
        }

        setTimeout(drawFrame, 1000 / fps);
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

        // Accent color lower-third strip (minimal)
        if (brandOverlay.accentColor) {
          const stripH = height * 0.035;
          ctx.globalAlpha = 0.85 * introAlpha;
          ctx.fillStyle = brandOverlay.accentColor;
          ctx.fillRect(0, height - stripH, width, stripH);

          // Brand name text
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

      drawFrame();
    };

    renderLoop();
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
