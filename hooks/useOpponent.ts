import possibleActions from "../data/opponentActions.json";
import {
  Action,
  EventMessage,
  OpponentCreature,
  OpponentPermanents,
  OpponentStats,
} from "../types";
import { keywordAbilities, pickRandomIndex } from "../helpers";
import { useEffect, useState } from "react";

export const useOpponent = (
  hasPriority: boolean,
  updateMessage: (message: EventMessage) => void
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

    // Calculate the sum of weights
    const totalWeight = eligibleActions.reduce(
      (sum, action) => sum + action.weight,
      0
    );

    // Normalize the weights so that they sum up to 1
    const normalizedActions = eligibleActions.map((action) => ({
      ...action,
      weight: action.weight / totalWeight,
    }));

    const randomValue = Math.random();

    let cumulativeWeight = 0;
    for (const action of normalizedActions) {
      cumulativeWeight += action.weight;
      if (randomValue <= cumulativeWeight) {
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
        hasBlocked: false,
      })),
    }));
  };

  const formatSpellMessage = (message: string, cost: number) => {
    const range = Array.from(Array(cost), (_, i) => i + 1);
    const value = pickRandomIndex(range);
    return replaceWildcard("*", value.toString(), message);
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
    return `${message} with ${value}`;
  };

  const wildcards = {
    "*": handlePower,
    "#": handleToughness,
  };

  const performUpkeep = () => {
    untapAllCreatures();
    let manaPool = stats.manaPool;
    let availableMana = manaPool;
    let handSize = stats.handSize;
    if (stats.library > 0) {
      handSize += 1;
      const drewMana = checkManaGain();
      if (drewMana) {
        handSize -= 1;
        manaPool += drewMana;
        availableMana += drewMana;
        updateMessage({
          value: `Opponent drew a card ${
            drewMana && `and gained ${drewMana} mana.`
          }`,
          duration: 1000,
        });
      } else {
        updateMessage({
          value: "Opponent drew a card.",
          duration: 1000,
        });
      }
      setStats((prev) => ({
        ...prev,
        library: Math.max(prev.library - 1, 0),
        manaPool,
        availableMana,
        handSize,
      }));
      return;
    }
    updateMessage({
      value: "Opponent has no cards left in their library.",
    });
  };

  const playSpell = (message: string, cost: number) => {
    updateMessage({ value: message });
    setStats((prev) => ({
      ...prev,
      availableMana: prev.availableMana - cost,
      handSize: prev.handSize - 1,
    }));
  };

  const determineAction = (action: Action) => {
    const { type, message, cost } = action;
    switch (type) {
      case "creature":
        // choose a random number from stats.availableMana
        const manaCost = Math.floor(Math.random() * stats.availableMana) || 1;

        return playCreature(message, manaCost);
      case "spell":
        return playSpell(message, cost);
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
      hasBlocked: false,
    };
    Object.entries(wildcards).forEach(([wildcard, handler]) => {
      if (message.includes(wildcard)) {
        formattedMessage = handler(
          creature,
          formattedMessage,
          stats.availableMana
        );
      }
    });
    // pick a chance to add an ability
    const random = Math.random();
    if (random < 0.5) {
      formattedMessage = handleKeywordAbility(creature, formattedMessage);
    }
    setPermanents((prev) => ({
      ...prev,
      creatures: [...prev.creatures, creature],
    }));
    setStats((prev) => ({
      ...prev,
      availableMana: prev.availableMana - manaCost,
      handSize: prev.handSize - 1,
    }));
    updateMessage({ value: formattedMessage });
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
    const random = Math.random();
    if (random < 0.7) {
      const { creatures } = permanents;
      const untappedCreatures = creatures.filter(
        (creature) => !creature.isTapped && !creature.hasSummoningSickness
      );
      if (untappedCreatures.length > 0) {
        let message = "Opponent attacks with a ";
        const creatureAmount =
          Math.floor(Math.random() * untappedCreatures.length) + 1;
        for (let i = 0; i < creatureAmount; i++) {
          const creatureIndex = Math.floor(
            Math.random() * untappedCreatures.length
          );
          const creature = untappedCreatures.splice(creatureIndex, 1)[0];

          tapCreature(creatures.indexOf(creature));

          message =
            message +
            `${i === 0 ? "" : "and a "}${creature.power}/${
              creature.toughness
            } ${creature.ability && `with ${creature.ability}`}${
              i !== creatureAmount - 1 ? ", " : "."
            }`;
        }
        updateMessage({
          value: message,
        });
      } else {
        updateMessage({
          value: "Opponent cannot attack.",
          duration: 1000,
        });
      }
    } else {
      updateMessage({
        value: "Opponent chooses not to attack.",
        duration: 1000,
      });
    }
  };

  const responseToSpell = () => {
    if (stats.availableMana === 0 || stats.handSize === 0) {
      updateMessage({
        value: "No response.",
        duration: 1000,
      });
    }
    const response = weightedObjectRandomPick(
      possibleActions.responses.cast,
      stats.availableMana
    );
    setStats((prev) => ({
      ...prev,
      availableMana: prev.availableMana - response.cost,
      // TODO: make this more robust
      handSize: !response.message.includes("resolves")
        ? prev.handSize - 1
        : prev.handSize,
    }));
    if (response.cost) {
      const message = formatSpellMessage(response.message, response.cost);
      updateMessage({ value: message });
    } else {
      updateMessage({ value: response.message });
    }
  };

  const responseToAttack = () => {
    const { creatures } = permanents;
    const response = weightedObjectRandomPick(
      possibleActions.responses.attack,
      stats.availableMana
    );
    if (response.cost) {
      if (stats.availableMana < response.cost || stats.handSize === 0) {
        responseToAttack();
        return;
      }
      setStats((prev) => ({
        ...prev,
        availableMana: prev.availableMana - response.cost,
        handSize: prev.handSize - 1,
      }));
    } else if (response?.type === "block") {
      const untappedCreatures = creatures.filter(
        (creature) => !creature.isTapped && !creature.hasBlocked
      );
      if (untappedCreatures.length === 0) {
        updateMessage({
          value: "No response.",
          duration: 1000,
        });
      } else {
        updateMessage({
          value: `Opponent blocks. Click on the blocked icon to set which creature blocked.`,
        });
      }
    } else {
      updateMessage({
        value: "No response.",
        duration: 1000,
      });
    }
  };

  const blockCreature = (index: number) => {
    setPermanents((prev) => ({
      ...prev,
      creatures: prev.creatures.map((creature, i) => {
        if (i === index) {
          return {
            ...creature,
            hasBlocked: !creature.hasBlocked,
          };
        }
        return creature;
      }),
    }));
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
        setStats((prev) => ({
          ...prev,
          handSize: Math.min(prev.handSize, 7),
        }));
      }
    }
  }, [hasPriority, phase]);

  return {
    tapCreature,
    destroyCreature,
    blockCreature,
    responseToSpell,
    responseToAttack,
    permanents,
    stats,
    setPhase,
    phase,
  };
};
