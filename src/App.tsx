import { useState } from "react";
import { WebcamView } from "@/features/id-photo/components/WebcamView";
import { ImageEditor } from "@/features/id-photo/components/ImageEditor";
import { PhotoSidebar } from "@/features/id-photo/components/PhotoSidebar";
import { IDCardManager } from "@/features/id-card/components/IDCardManager";
import { usePhotoStore } from "@/store/usePhotoStore";
import { Camera, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "photo" | "card";

function App() {
  const { currentPhoto } = usePhotoStore();
  const [activeTab, setActiveTab] = useState<Tab>("photo");

  return (
    <div className="h-screen bg-neutral-900 text-white flex overflow-hidden">
      {/* Main Content Area - Left Side */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Header & Tabs */}
        <div className="p-4 flex-shrink-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
          <h1 className="text-xl font-bold text-neutral-400">
            한국기초안전협회
          </h1>

          {/* Tab Switcher */}
          <div className="flex gap-1 bg-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("photo")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "photo"
                  ? "bg-neutral-700 text-white shadow"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              <Camera className="w-4 h-4" />
              증명사진
            </button>
            <button
              onClick={() => setActiveTab("card")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "card"
                  ? "bg-neutral-700 text-white shadow"
                  : "text-neutral-400 hover:text-white",
              )}
            >
              <CreditCard className="w-4 h-4" />
              신분증 스캔
            </button>
          </div>
        </div>

        {/* Remove p-4 here to fix letterbox issue */}
        <main className="flex-1 w-full h-full relative flex flex-col overflow-hidden">
          {activeTab === "photo" ? (
            // ID Photo Tab Content
            !currentPhoto ? (
              <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-500">
                <WebcamView />
              </div>
            ) : (
              <div className="w-full h-full animate-in fade-in zoom-in duration-300">
                <ImageEditor />
              </div>
            )
          ) : (
            // ID Card Tab Content
            <div className="w-full h-full max-w-5xl mx-auto p-4">
              <IDCardManager />
            </div>
          )}
        </main>
      </div>

      {/* Sidebar for History - Right Side (Hidden on tablets/mobile) */}
      {/* Only show photo sidebar when in photo tab */}
      {activeTab === "photo" && (
        <div className="hidden lg:block w-80 h-full border-l border-neutral-800 bg-neutral-900 shrink-0">
          <PhotoSidebar />
        </div>
      )}
    </div>
  );
}

export default App;
