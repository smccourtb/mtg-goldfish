import possibleActions from "../data/opponentActions.json";
import {
  Action,
  CardType,
  Creature,
  Enchantment,
  EventMessage,
  Instant,
  Land,
  OpponentCreature,
  OpponentPermanents,
  OpponentStats,
} from "../types";
import { keywordAbilities, pickRandomIndex } from "../helpers";
import React, { useEffect, useState } from "react";
import { GameContext } from "../context/GameContext";

export const useOpponent = (
  hasPriority: boolean,
  phase: number,
  updateMessage: (message: EventMessage) => void,
  isActive: boolean
) => {
  console.log("opponent");

  const { gameType } = React.useContext(GameContext);
  const [active, setActive] = useState(isActive);
  const [stats, setStats] = useState<OpponentStats>({
    hand: [],
    library: [],
    manaPool: 0,
    availableMana: 0,
    graveyard: [],
    life: gameType.startingLife,
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
    if (stats.library.length > 0) {
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

  const drawCards = (amount: number, library: CardType[]) => {
    return library.slice(0, amount);
  };

  const createCreatureCard = () => {
    const cost = Math.floor(Math.random() * 10) + 1;
    const power = Math.min(cost, Math.floor(Math.random() * 10) + 1);
    const toughness = Math.min(Math.floor(Math.random() * 10) + 1);
    const creature: Creature = {
      power: power.toString(),
      toughness: toughness.toString(),
      effects: {},
      keywords: [],
      type: "creature",
      cost: cost.toString(),
    };
    // pick a chance to add an ability
    const random = Math.random();
    if (random < 0.5) {
      creature.keywords.push(pickRandomIndex(keywordAbilities));
    }
    return creature;
  };

  const createEnchantmentCard = () => {
    const cost = Math.floor(Math.random() * 10) + 1;
    const enchantment: Enchantment = {
      subtype: "aura",
      type: "enchantment",
      cost: cost.toString(),
      effect: {} as Action,
    };
    return enchantment;
  };

  const createSpellCard = () => {
    const cost = Math.floor(Math.random() * 10) + 1;
    const spell: Instant = {
      type: "instant",
      cost: cost.toString(),
      effect: {} as Action,
    };
    return spell;
  };

  useEffect(() => {
    performSetup();
  }, []);
  const createLibrary = (): CardType[] => {
    // FUTURE: take mana cost/curve into account
    const landCards = Array.from(
      Array(Math.round(gameType.librarySize / 3)),
      () => ({ cost: "0", type: "land", isTapped: false } as Land)
    );
    const creatureCards = Array.from(
      Array(Math.round(gameType.librarySize / 3)),
      () => createCreatureCard()
    );
    const enchantments = Array.from(
      Array(Math.round(gameType.librarySize / 10)),
      () => createEnchantmentCard()
    );
    const spells = Array.from(
      Array(Math.round(gameType.librarySize / 4.16)),
      () => createSpellCard()
    );
    // randomize the order of the cards
    return [...landCards, ...creatureCards, ...enchantments, ...spells]
      .map((a) => ({ sort: Math.random(), value: a }))
      .sort((a, b) => a.sort - b.sort)
      .map((a) => a.value);
  };

  const performSetup = () => {
    const startingHandSize = 7;
    const library = createLibrary();
    const startingHand = drawCards(startingHandSize, library);
    setStats((prev) => ({
      ...prev,
      library: library.slice(startingHandSize, library.length + 1),
      hand: [...startingHand],
    }));
  };

  const performUpkeep = () => {
    untapAllCreatures();
    let manaPool = stats.manaPool;
    let availableMana = manaPool;
    let hand = stats.hand;
    if (stats.library.length > 0) {
      // drawCard();
      // hand += 1;
      const drewMana = checkManaGain();
      if (drewMana) {
        // hand -= 1;
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
        library: prev.library.slice(1),
        manaPool,
        availableMana,
        hand,
      }));
      return;
    }
    updateMessage({
      value: "Opponent has no cards left in their library.",
    });
  };

  const playSpell = (message: string, cost: number) => {
    updateMessage({ value: message });
    // TODO: need to figure out which card was removed from hand
    // setStats((prev) => ({
    //   ...prev,
    //   availableMana: prev.availableMana - cost,
    //   hand: prev.hand - 1,
    // }));
  };

  console.log("phase", phase);

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
    // TODO: need to figure out which card was removed from hand
    // setStats((prev) => ({
    //   ...prev,
    //   availableMana: prev.availableMana - manaCost,
    //   hand: prev.hand - 1,
    // }));
    updateMessage({ value: formattedMessage });
  };

  const handlePlaySpell = () => {
    if (stats.hand.length > 0 && stats.availableMana > 0) {
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
    if (stats.availableMana === 0 || stats.hand.length === 0) {
      updateMessage({
        value: "No response.",
        duration: 1000,
      });
    }
    const response = weightedObjectRandomPick(
      possibleActions.responses.cast,
      stats.availableMana
    );
    // TODO: need to figure out which card was removed from hand
    // setStats((prev) => ({
    //   ...prev,
    //   availableMana: prev.availableMana - response.cost,
    //   // TODO: make this more robust
    //   hand: !response.message.includes("resolves")
    //     ? prev.hand - 1
    //     : prev.hand,
    // }));
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
      if (stats.availableMana < response.cost || stats.hand.length === 0) {
        responseToAttack();
        return;
      }
      // TODO: need to figure out which card was removed from hand
      // setStats((prev) => ({
      //   ...prev,
      //   availableMana: prev.availableMana - response.cost,
      //   hand: prev.hand - 1,
      // }));
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

  if (hasPriority) {
    if (phase === 0) {
      performUpkeep();
    } else if (phase === 1) {
      handlePlaySpell();
    } else if (phase === 2) {
      attack();
      // TODO: need to implement discard
      // setStats((prev) => ({
      //   ...prev,
      //   hand: Math.min(prev.hand, 7),
      // }));
    }
  }

  return {
    tapCreature,
    destroyCreature,
    blockCreature,
    responseToSpell,
    responseToAttack,
    permanents,
    stats,
  };
};
