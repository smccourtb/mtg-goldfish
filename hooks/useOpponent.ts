import possibleActions from "../data/opponentActions.json";
import { Action, OpponentCreature } from "../types";
import { useCallback, useEffect, useState } from "react";
import { keywordAbilities, pickRandomIndex } from "../helpers";
import { useMachine } from "@xstate/react";
import { createMachine } from "xstate";

enum Phase {
  Upkeep,
  Play,
  Attack,
  End,
}

const firstPhase = Phase.Upkeep;

export const useOpponent = (turn: number, hasPriority: boolean) => {
  const [creatures, setCreatures] = useState<OpponentCreature[]>([]);
  const [currentPhase, setCurrentPhase] = useState<number>(firstPhase);
  const [manaSources, setManaSources] = useState(0);
  const [stats, setStats] = useState({
    handSize: 7,
    life: 40,
    mana: 0,
  });
  const [actions, setActions] = useState<Action[]>([]);

  // useEffect(() => {
  //   if (hasPriority && currentPhase === Phase.Play) {
  //     resolveAction();
  //   }
  // }, [hasPriority, currentPhase]);

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

  const respondToSpell = () => {
    const response = weightedObjectRandomPick(
      possibleActions.responses.cast,
      stats.mana
    );
    return response.message;
  };

  const respondToAttack = () => {
    const response = weightedObjectRandomPick(
      possibleActions.responses.attack,
      stats.mana
    );
    return response.message;
  };

  const resolveAction = () => {
    if (actions.length > 0) {
      const currentAction = actions.shift();
      if (currentAction) {
        if (currentAction.type === "attack") {
          tapCreature(currentAction.creatureIndex!);
        }
        if (currentAction.creature) {
          setCreatures((prev) => [...prev, currentAction.creature!]);
        }

        setStats((prev) => {
          return {
            ...prev,
            handSize: prev.handSize - 1,
            mana:
              currentAction.type === "attack"
                ? prev.mana
                : Math.max(0, prev.mana - currentAction.cost ?? 0),
          };
        });
        return currentAction.message;
      }
    }
    return null;
  };
  const castSpell = (spell: Action) => {
    const { creature } = processAction(spell);
    if (creature) {
      setCreatures((prev) => [...prev, creature]);
    }
    setStats((prev) => {
      return {
        ...prev,
        handSize: prev.handSize - 1,
        mana: prev.mana - spell.cost ?? 0,
      };
    });

    setActions((prev) => {
      return {
        ...prev,
        spells: prev.filter((s) => s !== spell),
      };
    });
  };

  /**
   * @description Chooses a spell from the available actions based on the current mana.
   * @param mana
   * @returns string
   */
  const playSpell = (mana: number) => {
    const action = weightedObjectRandomPick(possibleActions.actions, mana);
    if (!action.message) {
      return "";
    }
    const spell = processAction(action);
    if (spell?.creature) {
      setCreatures((prev) => [...prev, spell.creature!]);
    }
    setStats((prev) => {
      return {
        ...prev,
        handSize: prev.handSize - 1,
        mana: prev.mana - spell?.cost ?? 0,
      };
    });
    return spell.message;
  };

  /**
   * @description Determines how much mana is added to mana pool.
   * @returns number
   */
  const determineManaDraw = useCallback(() => {
    if (stats.handSize > 0) {
      // random chance to add mana
      const random = Math.random();
      if (random < 0.6) {
        return stats.mana + 1;
      } else if (random < 0.9) {
        return stats.mana + 2;
      } else if (random < 0.99) {
        return stats.mana + 3;
      }
    }
    return stats.mana;
  }, [stats]);

  /**
   * @description Performs upkeep at the beginning of the turn. Untaps all creatures, draws a card, and determines if
   *     any mana is added to mana pool.
   * @returns void
   */
  const performUpkeep = useCallback(() => {
    untapAllCreatures();
    let handSize = stats.handSize + 1;
    const mana = determineManaDraw();
    setManaSources((prev) => prev + mana);

    setStats((prev) => {
      return { ...prev, handSize, mana };
    });
    return mana + manaSources;
  }, [determineManaDraw, stats]);

  const chooseAttackingCreatures = useCallback(() => {
    const availableCreatures = creatures.filter(
      (creature) => !creature.isTapped
    );
    let attackingActions: Action[] = [];
    while (availableCreatures.length > 0) {
      const random = Math.random();
      if (random < 0.6) {
        const index = Math.floor(Math.random() * availableCreatures.length);
        attackingActions.push({
          message: `Opponent attacks with ${availableCreatures[index].power}/${
            availableCreatures[index].toughness
          } ${availableCreatures?.[index]?.ability ?? ""} creature.`,
          cost: 0,
          weight: 0,
          type: "attack",
          creatureIndex: index,
        });
        availableCreatures.pop();
      } else {
        break;
      }
    }
    return attackingActions;
  }, [creatures]);

  const determineAttack = useCallback(() => {
    // determine if attack is possible and if chance is met
    const random = Math.random();
    if (random < 0.6) {
      const availableCreatures = creatures.filter(
        (creature) => !creature.isTapped
      );
      if (availableCreatures.length > 0) {
        const index = Math.floor(Math.random() * availableCreatures.length);
        tapCreature(index);
        return `Opponent attacks with ${availableCreatures[index].power}/${availableCreatures[index].toughness} ${availableCreatures[index].ability} creature.`;
        // determine if creature is tapped
      }
    } else {
      return 'Opponent says "No attacks.';
    }
  }, [creatures]);

  const queueAvailableActions = useCallback((currentMana: number) => {
    console.log("currentMana", currentMana);

    console.log("beginning choosing actions");
    // pick a spell to perform and store it, then determine chance to pick another one and so on until mana is depleted or chance is not met
    const spells = [];
    let mana = currentMana;
    while (mana > 0 && stats.handSize > 0) {
      console.log("mana is greater than 0");

      // random chance to determine if another spell is played
      const random = Math.random();
      if (random < 0.8) {
        console.log("random is less than 0.6");
        const spell = weightedObjectRandomPick(possibleActions.actions, mana);
        console.log("spell", spell);
        spells.push(processAction(spell));
        mana -= spell.cost;
      } else {
        console.log("chance of action not met");
        break;
      }
    }
    console.log("mana is not greater than 0");
    return spells;
  }, []);

  const performTurn = useCallback(() => {
    const mana = performUpkeep();
    const spells: Action[] = queueAvailableActions(mana);
    console.log("end choosing actions ", spells);
    console.log("choosing attacking creatures");
    const attacks = chooseAttackingCreatures();
    setActions((prev) => [...prev, ...spells, ...attacks]);
  }, [chooseAttackingCreatures, performUpkeep, queueAvailableActions]);

  const destroyCreature = (index: number) => {
    setCreatures((prev) => {
      const newCreatures = [...prev];
      newCreatures.splice(index, 1);
      return newCreatures;
    });
  };

  const processAction = (
    spell: Action
  ) => {
    if (!spell || !spell.message.includes("*")) {
      return spell;
    }
    try {
      const { message } = spell;
      let creature: OpponentCreature = {
        power: "",
        toughness: "",
        isTapped: false,
      };
      let updatedMessage = message;
      Object.entries(wildcards).forEach(([wildcard, action]) => {
        if (message.includes(wildcard)) {
          updatedMessage = action(creature, updatedMessage);
        }
      });
      spell.message = updatedMessage;
      if (spell.type === "creature") {
        spell.creature = creature;
        spell.cost = Number(creature.power);
      }

      return spell;
    } catch (error) {
      console.error(error);
      return spell;
    }
  };

  const tapCreature = (index: number) => {
    setCreatures((prev) => {
      return prev.map((creature, i) => {
        if (i === index) {
          return { ...creature, isTapped: !creature.isTapped };
        }
        return creature;
      });
    });
  };

  const untapAllCreatures = () => {
    setCreatures((prev) => {
      return prev.map((creature) => {
        return { ...creature, isTapped: false };
      });
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
    range?: number[]
  ) => {
    if (!range) {
      console.log("stats.mana", stats.mana);

      range = Array.from(Array(Math.max(turn, stats.mana)), (_, i) => i + 1);
      console.log("range", range);
    }
    const value = pickRandomIndex(range);
    console.log("value", value);

    creature.power = value.toString();
    return replaceWildcard("*", value, message);
  };

  const handleToughness = (
    creature: OpponentCreature,
    message: string,
    range?: number[]
  ) => {
    if (!range) {
      range = Array.from(Array(Math.max(turn, stats.mana)), (_, i) => i + 1);
    }
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

  return {
    respondToSpell,
    respondToAttack,
    performTurn,
    playSpell,
    creatures,
    destroyCreature,
    tapCreature,
    stats,
    castSpell,
    resolveAction,
    actions,
  };
};
