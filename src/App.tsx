import { WebcamView } from "@/features/id-photo/components/WebcamView";
import { ImageEditor } from "@/features/id-photo/components/ImageEditor";
import { usePhotoStore } from "@/store/usePhotoStore";

function App() {
  const { currentPhoto } = usePhotoStore();

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-8">PureClient ID Station</h1>

      <main className="w-full max-w-4xl px-4 flex flex-col items-center gap-8">
        {!currentPhoto ? (
          <div className="w-full flex justify-center">
            <WebcamView />
          </div>
        ) : (
          <div className="w-full h-[600px] relative rounded-2xl overflow-hidden border border-neutral-800 bg-black">
            <ImageEditor />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
