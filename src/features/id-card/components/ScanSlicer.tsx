import { useState, useRef } from "react";
import {
  X,
  Check,
  Grid as GridIcon,
  RotateCcw,
  CreditCard,
  UserSquare2,
  CloudUpload,
} from "lucide-react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useIDCardStorage } from "@/features/id-card/hooks/useIDCardStorage";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";

interface ScanSlicerProps {
  onClose: () => void;
  onComplete: () => void;
}

type IDType = "driver" | "resident";

// ISO 7810 ID-1 Standard (Fallback if no mask provided)
const ISO_ID1_RATIO = 0.06;

export const ScanSlicer = ({ onClose, onComplete }: ScanSlicerProps) => {
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null); // Custom Mask
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedType, setSelectedType] = useState<IDType>("driver");
  const { addCards } = useIDCardStorage();

  // Crop state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  // Grid Config: 2 rows x 5 columns
  const ROWS = 2;
  const COLS = 5;

  // Scan Image Dropzone
  const onScanDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      const url = URL.createObjectURL(acceptedFiles[0]);
      setScanImage(url);
    }
  };
  const {
    getRootProps: getScanRootProps,
    getInputProps: getScanInputProps,
    isDragActive: isScanDragActive,
  } = useDropzone({
    onDrop: onScanDrop,
    accept: { "image/*": [] },
    multiple: false,
    noClick: !!scanImage,
  });

  // Mask Image Dropzone
  const onMaskDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      const url = URL.createObjectURL(acceptedFiles[0]);
      setMaskImage(url);
    }
  };
  const {
    getRootProps: getMaskRootProps,
    getInputProps: getMaskInputProps,
    isDragActive: isMaskDragActive,
  } = useDropzone({
    onDrop: onMaskDrop,
    accept: { "image/*": [] },
    multiple: false,
    noClick: !!maskImage,
  });

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const w = width * 0.9;
    const h = height * 0.9;
    const x = (width - w) / 2;
    const y = (height - h) / 2;

    setCrop({ unit: "px", x, y, width: w, height: h });
    setCompletedCrop({ unit: "px", x, y, width: w, height: h });
  };

  const applyMask = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    ctx.globalCompositeOperation = "destination-in";

    if (maskImage) {
      // Use Custom Mask Image
      const maskImg = new Image();
      maskImg.src = maskImage;
      await new Promise((resolve) => {
        maskImg.onload = resolve;
      });

      // Draw mask stretched to fit the slice
      ctx.drawImage(maskImg, 0, 0, width, height);
    } else {
      // Fallback: ISO Standard Rounded Rect
      const radius = Math.min(width, height) * ISO_ID1_RATIO;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, width, height, radius);
      } else {
        ctx.moveTo(radius, 0);
        ctx.lineTo(width - radius, 0);
        ctx.quadraticCurveTo(width, 0, width, radius);
        ctx.lineTo(width, height - radius);
        ctx.quadraticCurveTo(width, height, width - radius, height);
        ctx.lineTo(radius, height);
        ctx.quadraticCurveTo(0, height, 0, height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over"; // Reset
  };

  const processSlice = async () => {
    if (!scanImage || !completedCrop || !imgRef.current) return;
    setIsProcessing(true);

    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      const cellWidth = cropWidth / COLS;
      const cellHeight = cropHeight / ROWS;

      const processedFiles: File[] = [];

      const sourceImg = new Image();
      sourceImg.src = scanImage;
      await new Promise((resolve) => {
        sourceImg.onload = resolve;
      });

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tempCanvas = document.createElement("canvas");

          // Swap width/height for -90 deg rotation
          const finalWidth = cellHeight;
          const finalHeight = cellWidth;

          tempCanvas.width = finalWidth;
          tempCanvas.height = finalHeight;

          const tCtx = tempCanvas.getContext("2d");
          if (!tCtx) continue;

          // 1. Rotate (-90 deg)
          tCtx.translate(0, cellWidth);
          tCtx.rotate((-90 * Math.PI) / 180);

          // 2. Draw Slice
          tCtx.drawImage(
            sourceImg,
            cropX + c * cellWidth,
            cropY + r * cellHeight,
            cellWidth,
            cellHeight,
            0,
            0,
            cellWidth,
            cellHeight,
          );

          // 3. Reset Transform for Masking
          tCtx.setTransform(1, 0, 0, 1, 0, 0);

          // 4. Apply Mask (Custom or Preset)
          await applyMask(tCtx, finalWidth, finalHeight);

          // 5. Convert to PNG to preserve transparency
          const blob = await new Promise<Blob | null>((resolve) =>
            tempCanvas.toBlob(resolve, "image/png"),
          );
          if (blob) {
            const file = new File([blob], `cut_${selectedType}_${r}_${c}.png`, {
              type: "image/png",
            });
            processedFiles.push(file);
          }
        }
      }

      if (processedFiles.length > 0) {
        await addCards(processedFiles, selectedType);
        onComplete();
      }
    } catch (e) {
      console.error(e);
      alert("이미지 처리 실패");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-neutral-900 rounded-2xl overflow-hidden flex flex-col h-[90vh] shadow-2xl border border-neutral-800">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900 shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <GridIcon className="w-5 h-5 text-blue-500" />
            스캔본 자르기
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="px-6 py-3 bg-neutral-800/50 border-b border-neutral-800 flex items-center gap-6 overflow-x-auto shrink-0">
          {/* Metadata Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              신분증 종류 (DB 저장용)
            </span>
            <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-700">
              <button
                onClick={() => setSelectedType("driver")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  selectedType === "driver"
                    ? "bg-neutral-700 text-white shadow"
                    : "text-gray-400 hover:text-white",
                )}
              >
                <CreditCard className="w-3 h-3" />
                운전면허증
              </button>
              <button
                onClick={() => setSelectedType("resident")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  selectedType === "resident"
                    ? "bg-neutral-700 text-white shadow"
                    : "text-gray-400 hover:text-white",
                )}
              >
                <UserSquare2 className="w-3 h-3" />
                주민등록증
              </button>
            </div>
          </div>

          <div className="w-px h-8 bg-neutral-700"></div>

          {/* Custom Mask Uploader */}
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              사용자 마스크 (Luma Matte)
            </span>
            <div className="flex items-center gap-3">
              <div
                {...getMaskRootProps()}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 cursor-pointer transition-colors text-xs text-gray-300",
                  isMaskDragActive && "border-blue-500 bg-blue-500/10",
                )}
              >
                <input {...getMaskInputProps()} />
                <CloudUpload className="w-4 h-4" />
                {maskImage ? "마스크 변경" : "마스크 이미지 업로드 (흑백)"}
              </div>

              {/* Mask Preview */}
              {maskImage ? (
                <div className="relative group">
                  <img
                    src={maskImage}
                    alt="Mask"
                    className="h-8 w-12 object-contain bg-black border border-neutral-600 rounded"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaskImage(null);
                    }}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  미첨부 시 기본 둥근 모서리 적용
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-neutral-950 flex flex-col relative w-full h-full">
          {!scanImage ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div
                {...getScanRootProps()}
                className={cn(
                  "w-full max-w-xl h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-900/50",
                  isScanDragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800",
                )}
              >
                <input {...getScanInputProps()} />
                <GridIcon className="w-16 h-16 text-neutral-600 mb-4" />
                <p className="text-neutral-300 font-bold text-lg">
                  스캔 이미지 업로드
                </p>
                <p className="text-neutral-500 mt-2">
                  2열 5행 (총 10장) 스캔 이미지를 올려주세요.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 relative flex items-center justify-center overflow-auto p-4 select-none">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-full max-w-full"
                renderSelectionAddon={() => (
                  <div className="absolute inset-0 grid grid-rows-2 grid-cols-5 pointer-events-none border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] bg-cyan-400/5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="border-r border-b border-cyan-400/80 shadow-[0_0_2px_rgba(0,0,0,0.5)] last:border-r-0 [&:nth-child(5)]:border-r-0 [&:nth-child(10)]:border-r-0 [&:nth-child(n+6)]:border-b-0"
                      />
                    ))}
                  </div>
                )}
              >
                <img
                  ref={imgRef}
                  src={scanImage}
                  alt="Scan Source"
                  onLoad={onImageLoad}
                  className="max-h-[75vh] object-contain"
                />
              </ReactCrop>
            </div>
          )}
        </div>

        {/* Footer */}
        {scanImage && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <RotateCcw className="w-3 h-3" />
              <span>
                자동 회전(-90°) 및{" "}
                <span className={maskImage ? "text-cyan-400 font-bold" : ""}>
                  {maskImage ? "커스텀 마스크" : "기본 마스크"}
                </span>{" "}
                적용
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setScanImage(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 font-medium transition-colors"
              >
                다시 선택
              </button>
              <button
                onClick={processSlice}
                disabled={isProcessing}
                className={cn(
                  "px-6 py-2 rounded-lg text-white font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg transition-colors",
                  selectedType === "driver"
                    ? "bg-blue-600 hover:bg-blue-500"
                    : "bg-green-600 hover:bg-green-500",
                )}
              >
                {isProcessing ? (
                  "처리중..."
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    10장 자르기 & 저장
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
