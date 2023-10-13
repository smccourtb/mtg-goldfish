export type Action = {
  cost: number;
  weight: number;
  range?: number[];
  message: string;
  type?: string;
  creature?: OpponentCreature;
  creatureIndex?: number;
};

export type OpponentCreature = {
  power: string;
  toughness: string;
  ability?: string;
  isTapped: boolean;
};
