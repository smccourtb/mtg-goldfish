import possibleActions from "../data/opponentActions.json";
import { Action, OpponentCreature } from "../types";
import { keywordAbilities, pickRandomIndex } from "../helpers";
import { GameMachineContext } from "../components/Game";

export const useOpponent = () => {
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
  const checkManaGain = (librarySize: number) => {
    if (librarySize > 0) {
      // random chance to add mana
      const random = Math.random();
      if (random < 0.6) {
        return 1;
      }
      return 0;
    }
  };

  const destroyCreature = (creatures: OpponentCreature[], index: number) => {
    const newCreatures = [...creatures];
    newCreatures.splice(index, 1);
    return newCreatures;
  };

  const tapCreature = (creatures: OpponentCreature[], index: number) => {
    return creatures.map((creature, i) => {
      if (i === index) {
        creature.isTapped = !creature.isTapped;
      }
      return creature;
    });
  };

  const untapAllCreatures = (creatures: OpponentCreature[]) => {
    return creatures.map((creature) => {
      return { ...creature, isTapped: false };
    });
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

  const performUpkeep = (context: GameMachineContext) => {
    const { opponent } = context;
    // untap all creatures
    const untappedCreatures = untapAllCreatures(opponent.creatures);
    let newLibrary = opponent.library;
    let manaPool = opponent.manaPool;
    let availableMana = opponent.availableMana;
    let handSize = opponent.handSize;
    let message = "";
    if (newLibrary > 0) {
      newLibrary -= 1;
      handSize += 1;
      const drewMana = checkManaGain(opponent.library);
      if (drewMana) {
        handSize -= 1;
        manaPool += drewMana;
        availableMana += drewMana;
        message = `Opponent drew a card ${
          drewMana && `and gained ${drewMana} mana.`
        }`;
      } else {
        message = "Opponent drew a card.";
      }
      return {
        opponent: {
          ...opponent,
          library: newLibrary,
          creatures: untappedCreatures,
          manaPool,
          availableMana,
          handSize,
        },
        message,
      };
    }
    return {
      opponent,
      message: "Opponent has no cards left in their library.",
    };
  };

  const playSpell = (message: string) => {
    return {
      message,
      creature: null,
    };
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
    return {
      message: formattedMessage,
      creature,
    };
  };

  const handlePlaySpell = (context: GameMachineContext) => {
    const { opponent } = context;
    let handSize = opponent.handSize;
    let message = "";
    let creatures = opponent.creatures;
    let availableMana = opponent.availableMana;
    if (handSize > 0 && availableMana > 0) {
      const action = weightedObjectRandomPick(
        possibleActions.actions,
        availableMana
      );

      const parsedAction = determineAction(action);
      if (parsedAction) {
        availableMana -= action.cost;
        handSize -= 1;
        if (parsedAction?.creature) {
          creatures.push(parsedAction.creature);
        }
        message = parsedAction.message;
      } else {
        message = "No actions taken.";
      }
    } else {
      message = "No actions taken.";
    }

    return {
      message,
      opponent: {
        ...opponent,
        handSize,
        availableMana,
        creatures,
      },
    };
  };

  const attack = (context: GameMachineContext) => {
    const { opponent } = context;
    const { creatures } = opponent;
    const untappedCreatures = creatures.filter(
      (creature) => !creature.isTapped
    );
    if (untappedCreatures.length === 0) {
      return {
        message: "Opponent has no untapped creatures to attack with.",
        opponent,
      };
    } else {
      const creatureIndex = Math.floor(
        Math.random() * untappedCreatures.length
      );
      const creature = untappedCreatures[creatureIndex];
      const newCreatures = tapCreature(creatures, creatureIndex);
      return {
        message: `Opponent attacks with a ${creature.power}/${
          creature.toughness
        } ${creature.ability && `with ${creature.ability}.`}`,
        opponent: {
          ...opponent,
          creatures: newCreatures,
        },
      };
    }
  };

  const responseToSpell = (context: GameMachineContext) => {
    if (context.opponent.availableMana === 0) {
      return {
        message: "Opponent has no mana to respond.",
        opponent: context.opponent,
      };
    }
    const response = weightedObjectRandomPick(
      possibleActions.responses.cast,
      context.opponent.availableMana
    );
    return {
      message: response.message,
      opponent: {
        ...context.opponent,
        availableMana: context.opponent.availableMana - response.cost,
      },
    };
  };

  const responseToAttack = (context: GameMachineContext) => {
    const { opponent } = context;
    const { creatures } = opponent;
    const untappedCreatures = creatures.filter(
      (creature) => !creature.isTapped
    );
    if (untappedCreatures.length === 0) {
      return {
        message: "Opponent has no untapped creatures to block with.",
        opponent,
      };
    } else {
      const creatureIndex = Math.floor(
        Math.random() * untappedCreatures.length
      );
      const creature = untappedCreatures[creatureIndex];
      const newCreatures = tapCreature(creatures, creatureIndex);
      return {
        message: `Opponent blocks with a ${creature.power}/${
          creature.toughness
        } ${creature.ability && `with ${creature.ability}.`}`,
        opponent: {
          ...opponent,
          creatures: newCreatures,
        },
      };
    }
  };

  return {
    performUpkeep,
    handlePlaySpell,
    tapCreature,
    destroyCreature,
    attack,
    responseToSpell,
    responseToAttack,
  };
};
