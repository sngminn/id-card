import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCcw, AlertCircle } from "lucide-react";
import { usePhotoStore } from "@/store/usePhotoStore";

const videoConstraints = {
  width: 1280,
  height: 720,
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
    <div className="relative flex flex-col items-center justify-center w-full max-w-md mx-auto aspect-[3/4] bg-black rounded-lg overflow-hidden shadow-xl">
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <RefreshCcw className="w-8 h-8 animate-spin" />
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center p-6 text-center text-red-400">
          <AlertCircle className="w-12 h-12 mb-2" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="absolute inset-0 w-full h-full object-cover mirror"
            mirrored={true}
          />

          {/* Guide Overlay (3:4 Aspect Ratio Visual Guide) */}
          <div className="absolute inset-0 pointer-events-none border-2 border-white/30 rounded-lg">
            <div className="absolute top-[10%] left-[15%] right-[15%] bottom-[20%] border-2 border-dashed border-white/50 rounded-full opacity-50"></div>
          </div>

          <div className="absolute bottom-6 z-20">
            <button
              onClick={capture}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg active:scale-95"
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
