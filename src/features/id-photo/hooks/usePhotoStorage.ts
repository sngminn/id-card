import { useLiveQuery } from "dexie-react-hooks";
import { db, type IDPhoto } from "@/db/db";

export const usePhotoStorage = () => {
  // Real-time subscription to the idPhotos table
  const photos = useLiveQuery(() =>
    db.idPhotos.orderBy("createdAt").reverse().toArray(),
  );

  const addPhoto = async (name: string, blob: Blob) => {
    try {
      const id = await db.idPhotos.add({
        name,
        blob,
        createdAt: new Date(),
      });
      return id;
    } catch (error) {
      console.error("Failed to add photo:", error);
      throw error;
    }
  };

  const deletePhoto = async (id: number) => {
    try {
      await db.idPhotos.delete(id);
    } catch (error) {
      console.error("Failed to delete photo:", error);
      throw error;
    }
  };

  const clearAllPhotos = async () => {
    try {
      await db.idPhotos.clear();
    } catch (error) {
      console.error("Failed to clear photos:", error);
      throw error;
    }
  };

  return {
    photos,
    addPhoto,
    deletePhoto,
    clearAllPhotos,
  };
};
