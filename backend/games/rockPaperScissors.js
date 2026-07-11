// Server-authoritative Rock Paper Scissors, best-of-N.

const BEATS = { rock: "scissors", scissors: "paper", paper: "rock" };

function createInitialState(bestOf = 3) {
  return {
    bestOf,
    round: 1,
    scores: {},        // { [socketId]: number }
    picks: {},         // { [socketId]: "rock" | "paper" | "scissors" } - cleared each round
    lastRoundResult: null, // { picks, winnerId | "draw" }
    winnerId: null,    // set once a player reaches majority of bestOf
  };
}

function neededWins(bestOf) {
  return Math.floor(bestOf / 2) + 1;
}

// Call when a player submits a pick. Returns updated state, and whether
// the round resolved (both players picked).
function submitPick(state, playerId, opponentId, pick) {
  if (state.winnerId) return { ok: false, reason: "Match already finished." };
  if (!["rock", "paper", "scissors"].includes(pick)) {
    return { ok: false, reason: "Invalid pick." };
  }
  if (state.picks[playerId]) {
    return { ok: false, reason: "Pick already submitted this round." };
  }

  const picks = { ...state.picks, [playerId]: pick };
  let nextState = { ...state, picks };

  const bothPicked = picks[playerId] && picks[opponentId];
  if (!bothPicked) {
    return { ok: true, state: nextState, roundResolved: false };
  }

  // Resolve the round
  const a = picks[playerId];
  const b = picks[opponentId];
  let roundWinnerId = null;
  if (a === b) {
    roundWinnerId = null; // draw, replay round
  } else if (BEATS[a] === b) {
    roundWinnerId = playerId;
  } else {
    roundWinnerId = opponentId;
  }

  const scores = { ...state.scores };
  if (roundWinnerId) {
    scores[roundWinnerId] = (scores[roundWinnerId] || 0) + 1;
  }

  const winThreshold = neededWins(state.bestOf);
  const matchWinnerId =
    Object.entries(scores).find(([, s]) => s >= winThreshold)?.[0] || null;

  nextState = {
    ...nextState,
    scores,
    lastRoundResult: { picks, winnerId: roundWinnerId },
    picks: {}, // clear for next round
    round: state.round + 1,
    winnerId: matchWinnerId,
  };

  return { ok: true, state: nextState, roundResolved: true };
}

function pickAiMove() {
  const options = ["rock", "paper", "scissors"];
  return options[Math.floor(Math.random() * options.length)];
}

module.exports = { createInitialState, submitPick, pickAiMove, neededWins };
