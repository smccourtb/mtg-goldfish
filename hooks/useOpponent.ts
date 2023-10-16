import possibleActions from "../data/opponentActions.json";
import {
  Action,
  OpponentCreature,
  OpponentPermanents,
  OpponentStats,
} from "../types";
import { keywordAbilities, pickRandomIndex } from "../helpers";
import { useEffect, useState } from "react";

export const useOpponent = (
  hasPriority: boolean,
  updateMessage: (message: string, autoClose: boolean) => void
) => {
  const [phase, setPhase] = useState(0);
  const [stats, setStats] = useState<OpponentStats>({
    handSize: 7,
    library: 60,
    manaPool: 0,
    availableMana: 0,
    graveyard: 0,
    life: 40,
  });
  const [permanents, setPermanents] = useState<OpponentPermanents>({
    creatures: [],
    lands: [],
    artifacts: [],
    enchantments: [],
  });

  function weightedObjectRandomPick(actions: Action[], mana: number): Action {
    console.log("beginning weight pick");
    if (actions.length === 0) {
      throw new Error("The actions array must not be empty.");
    }

    const eligibleActions = actions.filter((action) => action.cost <= mana);

    if (eligibleActions.length === 0) {
      console.log("no eligible actions");
      // throw new Error("No eligible actions based on the current turn.");
      return {
        message: "",
        cost: 0,
        weight: 0,
        type: "",
      };
    }

    const totalWeight = eligibleActions.reduce(
      (sum, action) => sum + action.weight,
      0
    );
    const randomValue = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (const action of eligibleActions) {
      cumulativeWeight += action.weight;
      if (randomValue < cumulativeWeight) {
        return action;
      }
    }
    console.log(
      "fall back hit. returning ",
      eligibleActions[eligibleActions.length - 1]
    );
    // In case of precision errors, return the last eligible action
    return eligibleActions[eligibleActions.length - 1];
  }

  /**
   * @description Determines how much mana is added to mana pool.
   * @returns number
   */
  const checkManaGain = () => {
    if (stats.library > 0) {
      // random chance to add mana
      const random = Math.random();
      if (random < 0.6) {
        return 1;
      }
      return 0;
    }
  };

  const destroyCreature = (index: number) => {
    setPermanents((prev) => ({
      ...prev,
      creatures: prev.creatures.filter((_, i) => i !== index),
    }));
  };

  const tapCreature = (index: number) => {
    setPermanents((prev) => ({
      ...prev,
      creatures: prev.creatures.map((creature, i) => {
        if (i === index) {
          return {
            ...creature,
            isTapped: !creature.isTapped,
          };
        }
        return creature;
      }),
    }));
  };

  const untapAllCreatures = () => {
    setPermanents((prev) => ({
      ...prev,
      creatures: prev.creatures.map((creature) => ({
        ...creature,
        isTapped: false,
        hasSummoningSickness: false,
      })),
    }));
  };

  const replaceWildcard = (
    wildcard: string,
    value: string | number,
    message: string
  ) => {
    return message.replaceAll(wildcard, value.toString());
  };

  const handlePower = (
    creature: OpponentCreature,
    message: string,
    manaCost: number
  ) => {
    const range = Array.from(Array(manaCost), (_, i) => i + 1);
    const value = pickRandomIndex(range);
    creature.power = value.toString();
    return replaceWildcard("*", value, message);
  };

  const handleToughness = (
    creature: OpponentCreature,
    message: string,
    manaCost: number
  ) => {
    const range = Array.from(Array(manaCost), (_, i) => i + 1);
    const value = pickRandomIndex(range);
    creature.toughness = value.toString();
    return replaceWildcard("#", value, message);
  };

  const handleKeywordAbility = (
    creature: OpponentCreature,
    message: string
  ) => {
    const value = pickRandomIndex(keywordAbilities);
    creature.ability = value as string;
    return replaceWildcard("<>", value, message);
  };

  const wildcards = {
    "*": handlePower,
    "#": handleToughness,
    "<>": handleKeywordAbility,
  };

  const performUpkeep = () => {
    console.log("performing upkeep");

    // untap all creatures
    untapAllCreatures();
    let newLibrary = stats.library;
    let manaPool = stats.manaPool;
    let availableMana = stats.availableMana;
    let handSize = stats.handSize;
    if (newLibrary > 0) {
      newLibrary -= 1;
      handSize += 1;
      const drewMana = checkManaGain();
      if (drewMana) {
        handSize -= 1;
        manaPool += drewMana;
        availableMana += drewMana;
        updateMessage(
          `Opponent drew a card ${drewMana && `and gained ${drewMana} mana.`}`,
          true
        );
      } else {
        updateMessage("Opponent drew a card.", true);
      }
      setStats((prev) => ({
        ...prev,
        library: newLibrary,
        manaPool,
        availableMana,
        handSize,
      }));
      return;
    }
    updateMessage("Opponent has no cards left in their library.", true);
  };

  const playSpell = (message: string) => {
    updateMessage(message, false);
  };

  const determineAction = (action: Action) => {
    const { type, message } = action;
    switch (type) {
      case "creature":
        return playCreature(message, action.cost);
      case "spell":
        return playSpell(message);
      default:
        return null;
    }
  };

  const playCreature = (message: string, manaCost: number) => {
    let formattedMessage = message;
    let creature: OpponentCreature = {
      power: "",
      toughness: "",
      ability: "",
      isTapped: false,
      hasSummoningSickness: true,
    };
    Object.entries(wildcards).forEach(([wildcard, handler]) => {
      if (message.includes(wildcard)) {
        formattedMessage = handler(creature, formattedMessage, manaCost);
      }
    });
    setPermanents((prev) => ({
      ...prev,
      creatures: [...prev.creatures, creature],
    }));
    setStats((prev) => ({
      ...prev,
      availableMana: prev.availableMana - manaCost,
      handSize: prev.handSize - 1,
    }));
    updateMessage(formattedMessage, false);
  };

  const handlePlaySpell = () => {
    if (stats.handSize > 0 && stats.availableMana > 0) {
      const action = weightedObjectRandomPick(
        possibleActions.actions,
        stats.availableMana
      );
      determineAction(action);
    }
  };

  const attack = () => {
    const { creatures } = permanents;
    const untappedCreatures = creatures.filter(
      (creature) => !creature.isTapped
    );
    if (untappedCreatures.length > 0) {
      const creatureIndex = Math.floor(
        Math.random() * untappedCreatures.length
      );
      const creature = untappedCreatures[creatureIndex];
      tapCreature(creatureIndex);
      updateMessage(
        `Opponent attacks with a ${creature.power}/${creature.toughness} ${
          creature.ability && `with ${creature.ability}.`
        }`,
        false
      );
    }
  };

  const responseToSpell = () => {
    if (stats.availableMana === 0) {
      updateMessage("Opponent has no mana to respond.", true);
    }
    const response = weightedObjectRandomPick(
      possibleActions.responses.cast,
      stats.availableMana
    );

    setStats((prev) => ({
      ...prev,
      availableMana: prev.availableMana - response.cost,
    }));
    updateMessage(response.message, false);
  };

  const responseToAttack = () => {
    const { creatures } = permanents;
    const untappedCreatures = creatures.filter(
      (creature) => !creature.isTapped
    );
    if (untappedCreatures.length === 0) {
      updateMessage("Opponent has no untapped creatures to block with.", true);
    } else {
      const creatureIndex = Math.floor(
        Math.random() * untappedCreatures.length
      );
      const creature = untappedCreatures[creatureIndex];
      tapCreature(creatureIndex);
      updateMessage(
        `Opponent blocks with a ${creature.power}/${creature.toughness} ${
          creature.ability && `with ${creature.ability}.`
        }`,
        false
      );
    }
  };

  useEffect(() => {
    if (hasPriority) {
      if (phase === 0) {
        performUpkeep();
        setPhase(1);
      } else if (phase === 1) {
        handlePlaySpell();
        setPhase(2);
      } else if (phase === 2) {
        attack();
        setPhase(3);
      }
    }
  }, [hasPriority, phase]);

  return {
    tapCreature,
    destroyCreature,
    responseToSpell,
    responseToAttack,
    permanents,
    stats,
    setPhase,
  };
};
