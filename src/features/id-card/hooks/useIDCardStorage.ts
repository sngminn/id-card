import { useLiveQuery } from "dexie-react-hooks";
import { db, type IDCard } from "@/db/db";

export const useIDCardStorage = () => {
  const cards = useLiveQuery(() => db.idCards.orderBy("order").toArray());

  const addCards = async (files: File[], type: IDCard["type"] = "custom") => {
    try {
      const currentCount = await db.idCards.count();

      const newCards = files.map((file, index) => ({
        type, // Use the passed type (driver | resident | custom)
        blob: file,
        order: currentCount + index,
      }));

      await db.idCards.bulkAdd(newCards);
    } catch (error) {
      console.error("Failed to add cards:", error);
      throw error;
    }
  };

  const deleteCard = async (id: number) => {
    try {
      await db.idCards.delete(id);
    } catch (error) {
      console.error("Failed to delete card:", error);
      throw error;
    }
  };

  const updateCardType = async (id: number, type: IDCard["type"]) => {
    try {
      await db.idCards.update(id, { type });
    } catch (error) {
      console.error("Failed to update card type:", error);
      throw error;
    }
  };

  const clearAllCards = async () => {
    try {
      await db.idCards.clear();
    } catch (error) {
      console.error("Failed to clear cards:", error);
      throw error;
    }
  };

  return {
    cards,
    addCards,
    deleteCard,
    updateCardType,
    clearAllCards,
  };
};
