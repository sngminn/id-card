import { useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/canvas";
import { usePhotoStore } from "@/store/usePhotoStore";
import { usePhotoStorage } from "@/features/id-photo/hooks/usePhotoStorage";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Area } from "react-easy-crop";

export const ImageEditor = () => {
  const { currentPhoto, clearPhoto } = usePhotoStore();
  const { addPhoto } = usePhotoStorage();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [name, setName] = useState("");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    if (!currentPhoto || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(
        currentPhoto,
        croppedAreaPixels,
        name,
      );
      if (croppedBlob) {
        // Save to IndexedDB
        await addPhoto(name || "Untitled", croppedBlob);

        alert("사진이 저장되었습니다!");
        clearPhoto(); // Return to webcam view
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 bg-neutral-900">
        <Cropper
          image={currentPhoto}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          classes={{
            containerClassName: "bg-neutral-900",
            cropAreaClassName:
              "border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.8)]",
          }}
        />
      </div>

      <div className="bg-neutral-800 p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">
            이름 입력 (사진 우측 하단에 표시)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 홍길동"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={clearPhoto}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-neutral-700 text-white font-medium hover:bg-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors",
              isProcessing
                ? "bg-blue-500/50 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white",
            )}
          >
            {isProcessing ? (
              "처리중..."
            ) : (
              <>
                <Check className="w-5 h-5" />
                완료 및 저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
