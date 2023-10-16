export type Action = {
  cost: number;
  weight: number;
  range?: number[];
  message: string;
  type?: string;
  creature?: OpponentCreature;
  creatureIndex?: number;
};

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
};

export type OpponentStats = {
  handSize: number;
  library: number;
  manaPool: number;
  availableMana: number;
  graveyard: number;
  life: number;
};

export type OpponentPermanents = {
  creatures: OpponentCreature[];
  lands?: OpponentCreature[];
  artifacts?: OpponentCreature[];
  enchantments?: OpponentCreature[];
  planeswalkers?: OpponentCreature[];
};
