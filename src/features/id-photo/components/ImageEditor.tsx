import { useState, useRef } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { getCroppedImg } from "@/lib/canvas";
import { usePhotoStore } from "@/store/usePhotoStore";
import { usePhotoStorage } from "@/features/id-photo/hooks/usePhotoStorage";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveAs } from "file-saver";

// Helper to center the crop initially
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export const ImageEditor = () => {
  const { currentPhoto, clearPhoto } = usePhotoStore();
  const { addPhoto } = usePhotoStorage();

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  // Initialize crop when image loads
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 3 / 4));
  }

  const handleSave = async () => {
    if (!currentPhoto || !completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    try {
      // We need to scale the completedCrop relative to the natural image size
      // because the image displayed might be scaled down by CSS (object-contain)
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const truePixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedBlob = await getCroppedImg(
        currentPhoto,
        truePixelCrop,
        name.replace(/[^a-zA-Z가-힣\s]/g, ""),
      );

      if (croppedBlob) {
        const fileName = `${name || "id_photo"}.jpg`;

        // 1. Save to IndexedDB
        await addPhoto(name || "Untitled", croppedBlob);

        // 2. Trigger Download
        saveAs(croppedBlob, fileName);
        clearPhoto();
      }
    } catch (e) {
      console.error(e);
      alert("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentPhoto) return null;

  return (
    <div className="w-full h-full flex flex-col bg-neutral-900 overflow-hidden relative">
      {/* Editor Area */}
      <div className="relative flex-1 bg-neutral-900 flex items-center justify-center overflow-hidden">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={3 / 4}
          ruleOfThirds
          className="max-h-full w-full flex items-center justify-center"
        >
          <img
            ref={imgRef}
            src={currentPhoto}
            alt="Crop me"
            onLoad={onImageLoad}
            className="max-h-full object-contain"
          />
        </ReactCrop>
      </div>

      {/* Controls Area (Fixed at bottom) */}
      <div className="bg-neutral-900 border-t border-neutral-800 p-6 flex items-center gap-4 shrink-0 z-10">
        <div className="flex-1 max-w-sm flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-medium">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-neutral-600"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>

        <div className="h-8 w-px bg-neutral-800 mx-2"></div>

        <div className="flex gap-2">
          <button
            onClick={clearPhoto}
            className="px-4 py-2.5 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm font-medium hover:bg-neutral-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <X className="w-4 h-4" />
              <span>취소</span>
            </div>
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className={cn(
              "px-6 py-2.5 rounded-md text-sm font-bold transition-colors shadow-lg shadow-blue-900/20",
              isProcessing
                ? "bg-blue-500/50 cursor-not-allowed text-white/50"
                : "bg-blue-600 hover:bg-blue-500 text-white",
            )}
          >
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isProcessing ? "처리중" : "저장"}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
