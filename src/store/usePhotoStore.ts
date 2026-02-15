import { create } from "zustand";

interface PhotoStore {
  currentPhoto: string | null; // Base64 or Blob URL
  setPhoto: (photo: string | null) => void;
  clearPhoto: () => void;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  currentPhoto: null,
  setPhoto: (photo) => set({ currentPhoto: photo }),
  clearPhoto: () => set({ currentPhoto: null }),
}));
