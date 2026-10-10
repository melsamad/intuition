import { useEffect, useState } from "react";

export const ACCESSORY_KEY = "jonathan-accessories";
export const NAME_KEY = "intuition-alias";
const EVENT = "jonathan-accessories-change";

export const ACCESSORIES = [
  { id: "glasses", name: "Glasses" },
  { id: "hat", name: "Party hat" },
  { id: "bowtie", name: "Bow tie" },
  { id: "necklace", name: "Necklace" },
  { id: "earrings", name: "Earrings" },
  { id: "skirt", name: "Skirt" },
] as const;
export type AccessoryId = (typeof ACCESSORIES)[number]["id"];

export function savedAccessories(): AccessoryId[] {
  try {
    const v = JSON.parse(localStorage.getItem(ACCESSORY_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => ACCESSORIES.some((a) => a.id === x)) : [];
  } catch {
    return [];
  }
}

export function saveAccessories(ids: AccessoryId[]) {
  localStorage.setItem(ACCESSORY_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT));
}

/** Accessories Jonathan is wearing; empty during SSR so hydration matches. */
export function useAccessories(): AccessoryId[] {
  const [ids, setIds] = useState<AccessoryId[]>([]);
  useEffect(() => {
    const sync = () => setIds(savedAccessories());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return ids;
}
