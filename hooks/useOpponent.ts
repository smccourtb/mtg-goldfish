import actions from "../data/opponentActions.json";
import { Action } from "../types";
export const useOpponent = (turn: number) => {
  function weightedObjectRandomPick(actions: Action[], turn: number): Action {
    if (actions.length === 0) {
      throw new Error("The actions array must not be empty.");
    }

    const eligibleActions = actions.filter((action) => action.turn <= turn);

    if (eligibleActions.length === 0) {
      throw new Error("No eligible actions based on the current turn.");
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

    // In case of precision errors, return the last eligible action
    return eligibleActions[eligibleActions.length - 1];
  }

  const respondToSpell = () => {
    const response = weightedObjectRandomPick(actions.responses.cast, turn);
    return response.message;
  };

  const respondToAttack = () => {
    const response = weightedObjectRandomPick(actions.responses.attack, turn);
    return response.message;
  };

  const playSpell = () => {
    const spell = weightedObjectRandomPick(actions.actions, turn);
    return spell.message;
  };

  return { respondToSpell, respondToAttack, playSpell };
};
