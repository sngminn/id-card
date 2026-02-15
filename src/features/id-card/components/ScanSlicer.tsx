import { useState, useRef } from "react";
import { X, Check, Grid as GridIcon, RotateCcw } from "lucide-react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useIDCardStorage } from "@/features/id-card/hooks/useIDCardStorage";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";

interface ScanSlicerProps {
  onClose: () => void;
  onComplete: () => void;
}

export const ScanSlicer = ({ onClose, onComplete }: ScanSlicerProps) => {
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addCards } = useIDCardStorage();

  // Crop state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  // Grid Config: 2 rows x 5 columns
  const ROWS = 2;
  const COLS = 5;

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      const url = URL.createObjectURL(acceptedFiles[0]);
      setScanImage(url);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    noClick: !!scanImage,
  });

  // Initial crop set when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Default to 90% of the image center
    const w = width * 0.9;
    const h = height * 0.9;
    const x = (width - w) / 2;
    const y = (height - h) / 2;

    setCrop({
      unit: "px",
      x,
      y,
      width: w,
      height: h,
    });
    setCompletedCrop({
      unit: "px",
      x,
      y,
      width: w,
      height: h,
    });
  };

  const processSlice = async () => {
    if (!scanImage || !completedCrop || !imgRef.current) return;
    setIsProcessing(true);

    try {
      const image = imgRef.current;

      // Calculate scaling factor between visible image and natural image
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      // Calculate individual cell size based on the cropped area
      const cellWidth = cropWidth / COLS;
      const cellHeight = cropHeight / ROWS;

      const processedFiles: File[] = [];

      // Source image logic separate from DOM
      const sourceImg = new Image();
      sourceImg.src = scanImage;
      await new Promise((resolve) => {
        sourceImg.onload = resolve;
      });

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tempCanvas = document.createElement("canvas");

          // Swap width/height for -90 deg rotation
          tempCanvas.width = cellHeight;
          tempCanvas.height = cellWidth;

          const tCtx = tempCanvas.getContext("2d");
          if (!tCtx) continue;

          // Rotation Logic (-90 deg counter-clockwise)
          // Move origin to bottom-left (0, newHeight)
          tCtx.translate(0, cellWidth);
          tCtx.rotate((-90 * Math.PI) / 180);

          // Draw source slice
          // Source X = cropX + (col * cellWidth)
          // Source Y = cropY + (row * cellHeight)
          tCtx.drawImage(
            sourceImg,
            cropX + c * cellWidth,
            cropY + r * cellHeight, // sx, sy
            cellWidth,
            cellHeight, // sWidth, sHeight
            0,
            0, // dx, dy
            cellWidth,
            cellHeight, // dWidth, dHeight
          );

          // Convert to blob
          const blob = await new Promise<Blob | null>((resolve) =>
            tempCanvas.toBlob(resolve, "image/jpeg", 0.95),
          );
          if (blob) {
            const file = new File([blob], `scan_slice_${r}_${c}.jpg`, {
              type: "image/jpeg",
            });
            processedFiles.push(file);
          }
        }
      }

      if (processedFiles.length > 0) {
        await addCards(processedFiles);
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
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GridIcon className="w-5 h-5 text-blue-500" />
              스캔본 영역 지정
            </h3>
            <p className="text-xs text-neutral-400">
              신분증 10개가 모여있는 영역을 드래그하여 맞춰주세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-neutral-950 flex flex-col relative w-full h-full">
          {!scanImage ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div
                {...getRootProps()}
                className={cn(
                  "w-full max-w-xl h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-900/50",
                  isDragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800",
                )}
              >
                <input {...getInputProps()} />
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
                    {/* Grid Visualization Overlay */}
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
              <span>자동으로 반시계 방향(-90도) 회전되어 저장됩니다.</span>
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
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 shadow-lg transition-colors"
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
