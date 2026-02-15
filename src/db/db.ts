import Dexie, { type Table } from "dexie";

export interface IDPhoto {
  id?: number;
  name: string;
  blob: Blob;
  createdAt: Date;
}

export interface IDCard {
  id?: number;
  type: "driver" | "resident" | "passport" | "custom";
  blob: Blob;
  order: number;
}

export class PureClientDB extends Dexie {
  idPhotos!: Table<IDPhoto>;
  idCards!: Table<IDCard>;

  constructor() {
    super("PureClientIDStationDB");
    this.version(1).stores({
      idPhotos: "++id, name, createdAt", // Indexed fields
      idCards: "++id, type, order",
    });
  }
}

export const db = new PureClientDB();
