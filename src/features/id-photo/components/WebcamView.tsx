import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, AlertCircle } from "lucide-react";
import { usePhotoStore } from "@/store/usePhotoStore";
import { useCropStore } from "@/store/useCropStore";

const videoConstraints = {
  width: { min: 1280, ideal: 1920, max: 3840 },
  height: { min: 720, ideal: 1080, max: 2160 },
  facingMode: "user",
};

export const WebcamView = () => {
  const webcamRef = useRef<Webcam>(null);
  const { setPhoto } = usePhotoStore();
  const { defaultCrop } = useCropStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 16,
    height: 9,
  });

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPhoto(imageSrc);
    }
  }, [webcamRef, setPhoto]);

  const handleUserMedia = (stream: any) => {
    setLoading(false);
    setError(null);
    try {
      const track = stream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        if (settings.width && settings.height) {
          setVideoDimensions({
            width: settings.width,
            height: settings.height,
          });
        }
      }
    } catch (e) {
      console.error("Failed to get track settings:", e);
    }
  };

  const handleUserMediaError = (err: string | DOMException) => {
    setLoading(false);
    console.error(err);
    setError(
      "카메라 접근 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.",
    );
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden rounded-xl">
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
        <div
          className="relative w-full max-h-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800 transition-all duration-300 shrink-0"
          style={{
            aspectRatio: `${videoDimensions.width} / ${videoDimensions.height}`,
            maxWidth: "100%",
          }}
        >
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

          {/* Guide Overlay */}
          {defaultCrop ? (
            <div
              className="absolute pointer-events-none z-10 border-[3px] border-green-500/80 rounded shadow-sm bg-green-500/10 box-border"
              style={{
                left: `${defaultCrop.x}%`,
                top: `${defaultCrop.y}%`,
                width: `${defaultCrop.width}%`,
                height: `${defaultCrop.height}%`,
              }}
            >
              <div
                className="absolute -top-[28px] left-[-3px] bg-green-500 text-white font-bold text-xs px-2 py-1 rounded-t shadow-md pointer-events-auto cursor-help"
                title="ImageEditor에서 지정한 기본 크롭 영역입니다."
              >
                지정된 가이드 영역
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="aspect-[3/4] h-[80%] border-2 border-dashed border-white/40 rounded-lg opacity-50 relative bg-white/5 shadow-inner">
                <div className="absolute top-[10%] left-[15%] right-[15%] bottom-[20%] border-2 border-dashed border-white/30 rounded-full"></div>
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-auto">
            <button
              onClick={capture}
              className="flex items-center gap-2 px-8 py-4 bg-white/90 text-black backdrop-blur-md rounded-full font-bold hover:bg-white transition-all shadow-xl hover:scale-105 active:scale-95 border border-neutral-200"
              aria-label="사진 촬영"
            >
              <Camera className="w-6 h-6" />
              촬영하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
