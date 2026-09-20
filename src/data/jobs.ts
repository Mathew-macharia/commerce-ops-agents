import type { Job } from "../types.js";

export const catalog: Job[] = [
  {
    id: "CAT-101",
    kind: "catalog",
    sku: "STK-ROUND-50",
    payload: {
      name: "Die-cut round sticker",
      facts: "2 inch, outdoor vinyl, kiss-cut, 50 pack",
      forbidden: ["cheap", "best in the world"],
    },
  },
  {
    id: "CAT-102",
    kind: "catalog",
    sku: "LBL-CLEAR-100",
    payload: {
      name: "Clear product label",
      facts: "3x2 inch, waterproof, roll of 100",
      forbidden: ["cheap", "best in the world"],
    },
  },
  {
    id: "CAT-103",
    kind: "catalog",
    sku: "BAN-MESH-3X6",
    payload: {
      name: "Mesh vinyl banner",
      facts: "3x6 ft, hemmed, grommets every 24 inches",
      forbidden: ["cheap", "best in the world"],
    },
  },
];

export const proofs: Job[] = [
  {
    id: "PRF-201",
    kind: "proof",
    sku: "STK-ROUND-50",
    payload: { dpi: 72, bleedMm: 0, colors: ["RGB"] },
  },
  {
    id: "PRF-202",
    kind: "proof",
    sku: "LBL-CLEAR-100",
    payload: { dpi: 300, bleedMm: 3, colors: ["CMYK"] },
  },
  {
    id: "PRF-203",
    kind: "proof",
    sku: "BAN-MESH-3X6",
    payload: { dpi: 150, bleedMm: 1, colors: ["RGB", "spot"] },
  },
];

export const tickets: Job[] = [
  {
    id: "SUP-301",
    kind: "support",
    sku: "STK-ROUND-50",
    payload: {
      message: "The round stickers arrived square. Can you reprint?",
      tone: "refund_or_reprint",
    },
  },
  {
    id: "SUP-302",
    kind: "support",
    sku: "LBL-CLEAR-100",
    payload: {
      message: "Where is my order? Tracking has not moved in 4 days.",
      tone: "tracking",
    },
  },
  {
    id: "SUP-303",
    kind: "support",
    sku: "BAN-MESH-3X6",
    payload: {
      message: "Can you print this banner in 24 hours for a launch?",
      tone: "rush",
    },
  },
];

export const shiftJobs: Job[] = [...catalog, ...proofs, ...tickets];
