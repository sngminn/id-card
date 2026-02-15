import { useLiveQuery } from "dexie-react-hooks";
import { db, type IDCard } from "@/db/db";

export const useIDCardStorage = () => {
  const cards = useLiveQuery(() => db.idCards.orderBy("order").toArray());

  const addCards = async (files: File[]) => {
    try {
      // Get current max order to append
      const lastCard = await db.idCards.orderBy("order").last();
      let nextOrder = (lastCard?.order ?? 0) + 1;

      const newCards: IDCard[] = files.map((file) => ({
        type: "driver", // Default type
        blob: file,
        order: nextOrder++,
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
