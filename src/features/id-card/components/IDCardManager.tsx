import { useState } from "react";
import { Trash2, CreditCard, LayoutGrid, ScanLine, Plus } from "lucide-react";
import { useIDCardStorage } from "@/features/id-card/hooks/useIDCardStorage";
import { cn } from "@/lib/utils";
import { ScanSlicer } from "@/features/id-card/components/ScanSlicer";
import { MaskingEditor } from "@/features/id-card/components/MaskingEditor"; // Import MaskingEditor
import { type IDCard } from "@/db/db";

export const IDCardManager = () => {
  const { cards, deleteCard, clearAllCards } = useIDCardStorage();
  const [gridCols, setGridCols] = useState(3);
  const [isSlicerOpen, setIsSlicerOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<IDCard | null>(null); // State for editing

  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[gridCols];

  return (
    <div className="w-full h-full flex flex-col gap-4 animate-in fade-in duration-500 pb-2">
      {/* Header / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-800 p-4 rounded-xl shadow-lg border border-neutral-700 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <CreditCard className="w-6 h-6 text-blue-500" />
            신분증 스캔 관리
          </h2>
          <div className="h-6 w-px bg-neutral-700 hidden sm:block"></div>
          <div className="text-sm text-gray-400">
            총{" "}
            <span className="text-white font-bold">{cards?.length || 0}</span>장
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 ml-auto">
          {/* Bulk Scan Button (Primary Action) */}
          <button
            onClick={() => setIsSlicerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold text-white transition-all shadow-lg hover:shadow-blue-500/20"
          >
            <ScanLine className="w-5 h-5" />
            스캔본 자르기
          </button>

          <div className="h-6 w-px bg-neutral-700 hidden sm:block"></div>

          {/* Grid Slider */}
          <div className="flex items-center gap-3 bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-neutral-700/50">
            <LayoutGrid className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min="2"
              max="4"
              value={gridCols}
              onChange={(e) => setGridCols(Number(e.target.value))}
              className="w-20 md:w-24 h-1.5 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs text-gray-300 font-mono w-6 text-center">
              {gridCols}열
            </span>
          </div>

          {/* Clear Button */}
          {cards && cards.length > 0 && (
            <button
              onClick={() => {
                if (confirm("모든 신분증을 삭제하시겠습니까?")) clearAllCards();
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors underline decoration-red-400/30 hover:decoration-red-300 underline-offset-4"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* Main Content (Grid List) - Scrollable Area */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
        {cards && cards.length > 0 ? (
          <div className={cn("grid gap-4 transition-all pb-10", gridClass)}>
            {cards.map((card) => (
              <div
                key={card.id}
                className="group relative aspect-[1.58/1] bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
              >
                <img
                  src={URL.createObjectURL(card.blob)}
                  alt="ID Card"
                  className="w-full h-full object-cover"
                />

                {/* Overlay Buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button
                    className="px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg transform hover:scale-105 active:scale-95"
                    onClick={() => setEditingCard(card)} // Open Editor
                  >
                    카드 편집
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (card.id) deleteCard(card.id);
                    }}
                    className="p-2.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg transform hover:scale-105 active:scale-95"
                    title="삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-4 border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
            <div className="p-4 bg-neutral-800 rounded-full">
              <ScanLine className="w-10 h-10 text-neutral-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-neutral-400">
                데이터가 없습니다.
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                상단의{" "}
                <span className="text-blue-400 font-bold">'스캔본 자르기'</span>{" "}
                버튼을 눌러 시작하세요.
              </p>
            </div>
            <button
              onClick={() => setIsSlicerOpen(true)}
              className="mt-4 px-6 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />새 스캔본 추가
            </button>
          </div>
        )}
      </div>

      {/* Scan Slicer Modal */}
      {isSlicerOpen && (
        <ScanSlicer
          onClose={() => setIsSlicerOpen(false)}
          onComplete={() => setIsSlicerOpen(false)}
        />
      )}

      {/* Masking Editor Modal */}
      {editingCard && (
        <MaskingEditor
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={() => {
            setEditingCard(null);
          }}
        />
      )}
    </div>
  );
};
