import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Trash2, CreditCard, LayoutGrid, ScanLine } from "lucide-react";
import { useIDCardStorage } from "@/features/id-card/hooks/useIDCardStorage";
import { cn } from "@/lib/utils";
import { ScanSlicer } from "@/features/id-card/components/ScanSlicer";

export const IDCardManager = () => {
  const { cards, addCards, deleteCard, clearAllCards } = useIDCardStorage();
  const [gridCols, setGridCols] = useState(3);
  const [isSlicerOpen, setIsSlicerOpen] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await addCards(acceptedFiles);
      }
    },
    [addCards],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: true,
    maxFiles: 10,
  });

  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[gridCols];

  return (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      {/* Header / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-800 p-4 rounded-xl shadow-lg border border-neutral-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            신분증 스캔 관리
          </h2>
          <div className="h-6 w-px bg-neutral-700"></div>
          <div className="text-sm text-gray-400">총 {cards?.length || 0}장</div>
        </div>

        <div className="flex items-center gap-6">
          {/* Bulk Scan Button */}
          <button
            onClick={() => setIsSlicerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm font-bold text-white transition-colors border border-neutral-600"
          >
            <ScanLine className="w-4 h-4" />
            스캔본 자르기
          </button>

          <div className="h-6 w-px bg-neutral-700"></div>

          {/* Grid Slider */}
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min="2"
              max="4"
              value={gridCols}
              onChange={(e) => setGridCols(Number(e.target.value))}
              className="w-24 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-4">{gridCols}열</span>
          </div>

          {/* Clear Button */}
          {cards && cards.length > 0 && (
            <button
              onClick={() => {
                if (confirm("모든 신분증을 삭제하시겠습니까?")) clearAllCards();
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
          isDragActive
            ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
            : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800/50",
        )}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-3">
          <Upload className="w-6 h-6 text-neutral-400" />
        </div>
        {isDragActive ? (
          <p className="text-blue-400 font-bold">놓아서 업로드!</p>
        ) : (
          <div className="space-y-1">
            <p className="font-medium text-white">
              신분증 이미지 업로드 (JPG, PNG)
            </p>
            <p className="text-xs text-neutral-500">
              또는{" "}
              <span className="text-blue-400 font-bold">'스캔본 자르기'</span>{" "}
              버튼으로 통짜 스캔 처리
            </p>
          </div>
        )}
      </div>

      {/* Grid View */}
      {cards && cards.length > 0 ? (
        <div className={cn("grid gap-4 transition-all", gridClass)}>
          {cards.map((card) => (
            <div
              key={card.id}
              className="group relative aspect-[1.58/1] bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 hover:border-blue-500 transition-colors shadow-sm"
            >
              <img
                src={URL.createObjectURL(card.blob)}
                alt="ID Card"
                className="w-full h-full object-cover"
              />

              {/* Overlay Buttons */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                <button
                  className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg"
                  onClick={() => alert("편집 기능 준비중")}
                >
                  카드 편집
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    card.id && deleteCard(card.id);
                  }}
                  className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-neutral-700 space-y-2 py-10 border border-neutral-800/50 rounded-xl bg-neutral-900/50 border-dashed">
          <CreditCard className="w-12 h-12 opacity-20" />
          <p className="text-sm">등록된 신분증이 없습니다.</p>
        </div>
      )}

      {/* Scan Slicer Modal */}
      {isSlicerOpen && (
        <ScanSlicer
          onClose={() => setIsSlicerOpen(false)}
          onComplete={() => setIsSlicerOpen(false)}
        />
      )}
    </div>
  );
};
