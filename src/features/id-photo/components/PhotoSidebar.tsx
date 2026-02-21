import { usePhotoStorage } from "@/features/id-photo/hooks/usePhotoStorage";
import { Download, Trash2, Image as ImageIcon } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { format } from "date-fns";

export const PhotoSidebar = () => {
  const { photos, deletePhoto } = usePhotoStorage();

  const handleDownloadAll = async () => {
    if (!photos || photos.length === 0) return;

    const zip = new JSZip();
    photos.forEach((photo, index) => {
      // Create filename using just the photo name
      // To prevent overwrite in zip, user should be aware, but requirement is exact name
      const filename = `${photo.name || `photo_${index + 1}`}.jpg`;
      zip.file(filename, photo.blob);
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "id_photos.zip");
    } catch (error) {
      console.error("Failed to zip files:", error);
      alert("파일 압축 중 오류가 발생했습니다.");
    }
  };

  return (
    <aside className="w-80 h-full bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0">
      {/* 1. Fixed Header Area */}
      <div className="p-6 border-b border-neutral-800 bg-neutral-900 z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-blue-500" />
          기록
        </h2>

        {/* Download All Button - Fixed at top */}
        <button
          onClick={handleDownloadAll}
          disabled={!photos || photos.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-lg"
        >
          <Download className="w-4 h-4" />
          전체 다운로드
        </button>
      </div>

      {/* 2. Scrollable List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {photos?.map((photo) => (
          <div
            key={photo.id}
            className="group relative bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 hover:border-blue-500/50 transition-colors shrink-0"
          >
            <div className="aspect-[3/4] w-full relative">
              <img
                src={URL.createObjectURL(photo.blob)}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => saveAs(photo.blob, `${photo.name}.jpg`)}
                  className="p-2 bg-white text-black rounded-full hover:bg-gray-200"
                  title="다운로드"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => photo.id && deletePhoto(photo.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-white truncate">
                {photo.name || "Untitled"}
              </h3>
              <p className="text-xs text-neutral-500">
                {format(photo.createdAt, "yyyy-MM-dd HH:mm")}
              </p>
            </div>
          </div>
        ))}

        {photos?.length === 0 && (
          <div className="text-center py-10 text-neutral-500">
            <p>저장된 사진이 없습니다.</p>
          </div>
        )}
      </div>
    </aside>
  );
};
