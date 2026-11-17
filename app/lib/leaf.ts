import { makeBALeaf } from "./baLeafCore";

/** One hole or split in the leaf, with its centre (used to stagger the growth animation). */
export type LeafCut = { d: string; x: number; y: number };

/** Everything needed to draw one generated leaf, as SVG path data in the leaf's own viewBox. */
export type LeafParts = {
  vb: [number, number, number, number];
  leaf: string;
  cuts: string;
  cutList: LeafCut[];
  letters: string;
  stem: string;
  /** Where the stem meets the blade: the point the leaf grows from. */
  origin: [number, number];
  interrupt: number;
};

export type LeafOptions = { level?: 0 | 1 | 2; orient?: "up" | "down"; interrupt?: number; loose?: number };

const core = makeBALeaf() as unknown as {
  monstera: (seed: number, opts?: LeafOptions) => LeafParts;
  lace: (seed: number, opts?: LeafOptions) => LeafParts;
};

/** The light-theme leaf. */
export const monstera = (seed: number, opts?: LeafOptions): LeafParts => core.monstera(seed, opts);
/** The dark-theme leaf. */
export const lace = (seed: number, opts?: LeafOptions): LeafParts => core.lace(seed, opts);
