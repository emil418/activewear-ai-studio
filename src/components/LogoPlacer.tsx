import { useState, useRef, useCallback, useEffect } from "react";
import { Move } from "lucide-react";

export interface LogoPosition {
  x: number; // 0-100 percentage from left
  y: number; // 0-100 percentage from top
  placement: string; // human-readable label
}

const PLACEMENT_ZONES: { label: string; x: [number, number]; y: [number, number] }[] = [
  { label: "chest-left", x: [55, 80], y: [15, 35] },
  { label: "chest-center", x: [30, 70], y: [15, 35] },
  { label: "chest-right", x: [20, 45], y: [15, 35] },
  { label: "belly-center", x: [30, 70], y: [40, 60] },
  { label: "back-upper", x: [25, 75], y: [10, 30] },
  { label: "sleeve-left", x: [75, 100], y: [15, 40] },
  { label: "sleeve-right", x: [0, 25], y: [15, 40] },
];

function getPlacementLabel(xPct: number, yPct: number): string {
  for (const zone of PLACEMENT_ZONES) {
    if (xPct >= zone.x[0] && xPct <= zone.x[1] && yPct >= zone.y[0] && yPct <= zone.y[1]) {
      return zone.label;
    }
  }
  if (yPct < 33) return "upper";
  if (yPct < 66) return "middle";
  return "lower";
}

interface LogoPlacerProps {
  garmentPreview: string;
  logoPreview: string;
  position: LogoPosition | null;
  onPositionChange: (pos: LogoPosition) => void;
}

export default function LogoPlacer({ garmentPreview, logoPreview, position, onPositionChange }: LogoPlacerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localPos, setLocalPos] = useState<{ x: number; y: number }>(
    position ? { x: position.x, y: position.y } : { x: 50, y: 25 }
  );

  useEffect(() => {
    if (position) setLocalPos({ x: position.x, y: position.y });
  }, [position]);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    setLocalPos({ x, y });
    onPositionChange({ x, y, placement: getPlacementLabel(x, y) });
  }, [onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => updatePosition(e.clientX, e.clientY);
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, updatePosition]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => setDragging(false);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => { window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onTouchEnd); };
  }, [dragging, updatePosition]);

  // Click on garment to place logo
  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-logo-handle]")) return;
    updatePosition(e.clientX, e.clientY);
  };

  const placement = getPlacementLabel(localPos.x, localPos.y);

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Drag logo to position • <span className="text-primary">{placement}</span>
      </p>
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border bg-muted/20 cursor-crosshair select-none"
        onClick={handleContainerClick}
      >
        <img src={garmentPreview} alt="Garment" className="w-full h-full object-contain" draggable={false} />
        {/* Logo overlay */}
        <div
          data-logo-handle
          className={`absolute w-14 h-14 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-shadow ${
            dragging ? "ring-2 ring-primary shadow-lg shadow-primary/30" : "ring-1 ring-primary/40"
          }`}
          style={{ left: `${localPos.x}%`, top: `${localPos.y}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" draggable={false} />
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">
            <Move className="w-2.5 h-2.5" /> drag
          </div>
        </div>
      </div>
    </div>
  );
}
