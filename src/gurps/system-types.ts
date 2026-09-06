/**
 * Structural types for the slice of the GURPS 4e Game Aid actor we read. These deliberately
 * describe only what the HUD needs: the system's own data model is loose (numbers arrive as
 * strings, lists are keyed objects with `contains` children) and typing it wholesale would
 * pretend to a precision the source doesn't have.
 */

export type Numeric = number | string;

export interface GurpsAttribute {
  value: Numeric;
}

export interface GurpsPool {
  value: Numeric;
  max: Numeric;
}

/** A keyed list, as the Game Aid stores every collection: `{ "00000": entry, ... }`. */
export type GurpsList<T> = Record<string, T & { contains?: GurpsList<T> }>;

export interface GurpsAttack {
  name?: string;
  mode?: string;
  level?: Numeric;
  import?: Numeric;
  damage?: string;
  notes?: string;
}

export interface GurpsMelee extends GurpsAttack {
  reach?: string;
  parry?: string;
  block?: string;
  st?: string;
}

export interface GurpsRanged extends GurpsAttack {
  acc?: string;
  range?: string;
  rof?: string;
  bulk?: string;
  shots?: string;
  rcl?: string;
}

export interface GurpsSkill {
  name?: string;
  level?: Numeric;
  /** Relative skill level as text, e.g. "DX+2". */
  relativelevel?: string;
}

export interface GurpsEquipment {
  name: string;
  equipped?: boolean;
  carried?: boolean;
  count?: Numeric;
}

export interface GurpsEncumbrance {
  key: string;
  level: Numeric;
  current?: boolean;
  currentmove?: Numeric;
  currentdodge?: Numeric;
}

export interface GurpsConditions {
  posture?: string;
  maneuver?: string;
  reeling?: boolean;
  exhausted?: boolean;
}

export interface GurpsSystem {
  attributes: Record<"ST" | "DX" | "IQ" | "HT" | "WILL" | "PER" | "QN", GurpsAttribute>;
  HP: GurpsPool;
  FP: GurpsPool;
  thrust: string;
  swing: string;
  basicspeed: { value: Numeric };
  basicmove: { value: Numeric };
  frightcheck: Numeric;
  vision: Numeric;
  hearing: Numeric;
  tastesmell: Numeric;
  touch: Numeric;
  currentmove: Numeric;
  currentdodge: Numeric;
  conditions: GurpsConditions;
  encumbrance: GurpsList<GurpsEncumbrance>;
  equipment: { carried: GurpsList<GurpsEquipment>; other: GurpsList<GurpsEquipment> };
  melee: GurpsList<GurpsMelee>;
  ranged: GurpsList<GurpsRanged>;
  skills: GurpsList<GurpsSkill>;
}

/**
 * The actor properties the HUD touches. Kept structural so the view builder can be exercised
 * without a Foundry document.
 */
export interface GurpsActorLike {
  id?: string | null;
  name: string;
  img?: string | null;
  system: GurpsSystem;
  statuses?: Iterable<string>;
  /** Foundry's `Document#update`; optional so a bare fixture can stand in for an actor. */
  update?: (changes: Record<string, unknown>) => Promise<unknown>;
}
