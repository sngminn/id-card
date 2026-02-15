import { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Eraser, Save } from "lucide-react";
import { type IDCard, db } from "@/db/db";

interface MaskingEditorProps {
  card: IDCard;
  onClose: () => void;
  onSave: () => void;
}

interface MaskItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: "resident" | "driver" | "address" | "custom";
}

export const MaskingEditor = ({
  card,
  onClose,
  onSave,
}: MaskingEditorProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Transform State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Mask State
  const [masks, setMasks] = useState<MaskItem[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [isDraggingMask, setIsDraggingMask] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Offset within the mask item

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (card.blob) {
      const url = URL.createObjectURL(card.blob);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [card]);

  // --- Pan Logic ---
  const handlePanDown = (e: React.MouseEvent) => {
    // Only pan if clicking background or image (not masks)
    // Masks will stopPropagation
    if (e.button !== 0) return; // Left click only
    setIsPanning(true);
    setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handlePanUp = () => {
    setIsPanning(false);
  };

  // --- Mask Logic ---
  const addMask = (type: MaskItem["type"]) => {
    if (!imgRef.current) return;

    // Default size based on type
    let w = 150;
    let h = 30;
    if (type === "driver") {
      w = 200;
      h = 30;
    }
    if (type === "address") {
      w = 300;
      h = 40;
    }

    // Center in current view
    // We need to calculate "center of viewport" in "image coordinates"
    // For simplicity, just center of image for now
    const imgW = imgRef.current.naturalWidth;
    const imgH = imgRef.current.naturalHeight;

    const newMask: MaskItem = {
      id: crypto.randomUUID(),
      x: (imgW - w) / 2, // Image Coordinate System
      y: (imgH - h) / 2,
      w,
      h,
      type,
    };
    setMasks((prev) => [...prev, newMask]);
    setSelectedMaskId(newMask.id);
  };

  const removeSelectedMask = () => {
    if (selectedMaskId) {
      setMasks((prev) => prev.filter((m) => m.id !== selectedMaskId));
      setSelectedMaskId(null);
    }
  };

  const handleMaskDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent Panning
    const mask = masks.find((m) => m.id === id);
    if (!mask) return;

    setSelectedMaskId(id);
    setIsDraggingMask(true);

    // Store current mouse pos
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleMaskMove = (e: React.MouseEvent) => {
    if (isDraggingMask && selectedMaskId) {
      e.stopPropagation();

      const dx = e.clientX - dragOffset.x;
      const dy = e.clientY - dragOffset.y;

      // Convert screen delta to image delta
      const imgDx = dx / scale;
      const imgDy = dy / scale;

      setMasks((prev) =>
        prev.map((m) => {
          if (m.id === selectedMaskId) {
            return {
              ...m,
              x: m.x + imgDx,
              y: m.y + imgDy,
            };
          }
          return m;
        }),
      );

      setDragOffset({ x: e.clientX, y: e.clientY }); // Update last pos
    }
  };

  const handleMaskUp = () => {
    setIsDraggingMask(false);
  };

  // --- Save Logic ---
  const handleSave = async () => {
    if (!imgRef.current || !imageSrc) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = imgRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // 1. Draw Original
      ctx.drawImage(img, 0, 0);

      // 2. Burn Masks
      ctx.fillStyle = "#000000"; // Black redaction
      masks.forEach((mask) => {
        ctx.fillRect(mask.x, mask.y, mask.w, mask.h);
      });

      // 3. Export
      canvas.toBlob(async (blob) => {
        if (blob && card.id) {
          // We need to replace the blob in DB.
          await db.idCards.update(card.id, { blob });
          onSave();
          onClose();
        }
      }, card.blob.type || "image/png");
    } catch (e) {
      console.error(e);
      alert("저장 실패");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-4 bg-neutral-900 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Eraser className="w-5 h-5 text-yellow-500" />
            개인정보 마스킹
          </h3>
          <span className="text-xs text-neutral-500 px-2 py-1 bg-neutral-800 rounded">
            {card.type === "driver" ? "운전면허증" : "주민등록증"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="p-2 text-neutral-400 hover:text-white"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-xs text-neutral-500 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.1))}
            className="p-2 text-neutral-400 hover:text-white"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-neutral-800 mx-2"></div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        className="flex-1 relative overflow-hidden cursor-move bg-neutral-950 select-none"
        onMouseDown={handlePanDown}
        onMouseMove={(e) => {
          handlePanMove(e);
          handleMaskMove(e);
        }}
        onMouseUp={() => {
          handlePanUp();
          handleMaskUp();
        }}
        onMouseLeave={() => {
          handlePanUp();
          handleMaskUp();
        }}
        ref={containerRef}
      >
        <div
          className="absolute origin-top-left transition-transform duration-75 ease-linear"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          {imageSrc && (
            <div className="relative inline-block shadow-2xl">
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Target"
                className="pointer-events-none select-none max-w-none block"
                draggable={false}
              />

              {/* SVG Filters/Mask Overlay Layer - Renders exactly on top of image in image coordinates */}
              <div className="absolute inset-0 left-0 top-0 w-full h-full pointer-events-none">
                {masks.map((mask) => (
                  <div
                    key={mask.id}
                    className={`absolute pointer-events-auto cursor-move border-2 ${selectedMaskId === mask.id ? "border-yellow-400 bg-black/80" : "border-neutral-500/50 bg-black/60"} hover:bg-black/80`}
                    style={{
                      left: mask.x,
                      top: mask.y,
                      width: mask.w,
                      height: mask.h,
                    }}
                    onMouseDown={(e) => handleMaskDown(e, mask.id)}
                  >
                    {/* Center Handle (Move) - implicitly the whole box */}

                    {/* Resize Handle (Bonus: Bottom Right) */}
                    {selectedMaskId === mask.id && (
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-yellow-400 rounded-full cursor-se-resize shadow-sm"
                        onMouseDown={(e) => {
                          // TODO: Implement resizing
                          // For now just stop propagation
                          e.stopPropagation();
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-neutral-800/90 backdrop-blur rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl border border-neutral-700">
        <div className="flex gap-2">
          <button
            onClick={() => addMask("resident")}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-gray-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-3 h-3" />
            주민번호
          </button>
          <button
            onClick={() => addMask("driver")}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-gray-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-3 h-3" />
            면허번호
          </button>
        </div>

        <div className="w-px h-6 bg-neutral-600"></div>

        <div className="flex gap-2">
          <button
            onClick={removeSelectedMask}
            disabled={!selectedMaskId}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-neutral-600"></div>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            저장 (블러링)
          </button>
        </div>
      </div>
    </div>
  );
};

// Icons (Local helpers)
const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
