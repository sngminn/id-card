import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, AlertCircle } from "lucide-react";
import { usePhotoStore } from "@/store/usePhotoStore";

const videoConstraints = {
  width: { min: 1280, ideal: 1920, max: 3840 },
  height: { min: 720, ideal: 1080, max: 2160 },
  facingMode: "user",
};

export const WebcamView = () => {
  const webcamRef = useRef<Webcam>(null);
  const { setPhoto } = usePhotoStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPhoto(imageSrc);
    }
  }, [webcamRef, setPhoto]);

  const handleUserMedia = () => {
    setLoading(false);
    setError(null);
  };

  const handleUserMediaError = (err: string | DOMException) => {
    setLoading(false);
    console.error(err);
    setError(
      "카메라 접근 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.",
    );
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-xl">
      {loading && !error && (
        <div className="absolute inset-0 z-10 w-full h-full bg-neutral-800 animate-pulse flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-neutral-700 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-neutral-700 rounded"></div>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center text-red-400">
          <AlertCircle className="w-12 h-12 mb-2" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={1}
            minScreenshotWidth={1280}
            minScreenshotHeight={720}
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="absolute inset-0 w-full h-full object-cover mirror"
            mirrored={true}
          />

          {/* Guide Overlay (3:4 Aspect Ratio Visual Guide) - Optional, mainly for centering */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="aspect-[3/4] h-[80%] border-2 border-dashed border-white/30 rounded-lg opacity-50 relative">
              <div className="absolute top-[10%] left-[15%] right-[15%] bottom-[20%] border-2 border-dashed border-white/30 rounded-full"></div>
            </div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
            <button
              onClick={capture}
              className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all shadow-xl hover:scale-105 active:scale-95"
              aria-label="사진 촬영"
            >
              <Camera className="w-6 h-6" />
              촬영하기
            </button>
          </div>
        </>
      )}
    </div>
  );
};
