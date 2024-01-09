export type Action = {
  cost: number;
  weight: number;
  range?: number[];
  message: string;
  type?: string;
  creature?: OpponentCreature;
  creatureIndex?: number;
};

export interface Effect {
  cost: number;
  type: CardType;
  message: string;
  duration?: number;
  tapToActivate: boolean;
}

export interface Stat extends Effect {
  amount: number;
}

export interface AlterCreature extends Effect {
  power: number | "*";
  toughness: number | "*";
  target: "single" | "all";
}

export interface AlterMana extends Effect {
  amount: number;
}

export interface AlterLife extends Effect {
  amount: number;
}

export interface AlterHandSize extends Effect {
  amount: number;
}

export type EventMessage = {
  value: string;
  duration?: number;
};

export type OpponentCreature = {
  power: string;
  toughness: string;
  ability?: string;
  isTapped: boolean;
  hasSummoningSickness: boolean;
  hasBlocked: boolean;
};

export type OpponentStats = {
  hand: CardType[];
  library: CardType[];
  manaPool: number;
  availableMana: number;
  graveyard: CardType[];
  life: number;
};

export type OpponentPermanents = {
  creatures: OpponentCreature[];
  lands?: OpponentCreature[];
  artifacts?: OpponentCreature[];
  enchantments?: OpponentCreature[];
  planeswalkers?: OpponentCreature[];
};

export interface Card {
  cost: string;
  type: string;
}

export interface Creature extends Card {
  subtype?: string;
  power: string;
  toughness: string;
  keywords: string[];
  effects: {
    onEnter?: Effect;
    onLeave?: Effect;
    onAttack?: Effect;
    onBlock?: Effect;
    onDamage?: Effect;
    activatedAbilities?: Effect[];
  };
}

export interface Enchantment extends Card {
  subtype: string;
  effect: Action;
}

export interface Land extends Card {
  effect?: Action;
}

export interface Artifact extends Card {
  subtype: string;
  effect: Action;
  isManaSource: boolean;
}

export interface Planeswalker extends Card {
  subtype: string;
  loyalty: number;
  abilities: { [key: number]: Action };
}

export interface Sorcery extends Card {
  effect: Action;
}

export interface Instant extends Card {
  effect: Action;
}

export type CardType =
  | Creature
  | Enchantment
  | Land
  | Artifact
  | Planeswalker
  | Sorcery
  | Instant;
