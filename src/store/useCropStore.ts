import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PercentCrop } from "react-image-crop";

interface CropStore {
  defaultCrop: PercentCrop | null;
  setDefaultCrop: (crop: PercentCrop | null) => void;
}

export const useCropStore = create<CropStore>()(
  persist(
    (set) => ({
      defaultCrop: null,
      setDefaultCrop: (crop) => set({ defaultCrop: crop }),
    }),
    {
      name: "id-photo-maker-crop-storage",
    },
  ),
);
