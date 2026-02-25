/**
 * 2-opt Step Generator
 * Emits deterministic compare/swap/final steps for local search
 */

import { greedyTSP, calculateTotalDistance, perform2OptSwap, EPSILON } from '../algorithms/tsp-solver.js';

/**
 * Generate steps for 2-opt local search
 * @param {Array} cities - Array of city objects with id, x, y
 * @param {Array<number>} initialRoute - Optional initial route (may be closed or open)
 * @returns {Array} - Array of step objects
 */
function generateTwoOptSteps(cities, initialRoute = null) {
  const steps = [];

  if (!cities || cities.length < 2) {
    steps.push({
      type: "final",
      currentRoute: [],
      distance: 0,
      explanation: "2-opt finished: not enough cities"
    });
    return steps;
  }

  const greedyResult = greedyTSP(cities);
  const startRoute = initialRoute && initialRoute.length > 1 ? [...initialRoute] : [...greedyResult.path];

  if (startRoute.length > 1 && startRoute[0] === startRoute[startRoute.length - 1]) {
    startRoute.pop();
  }

  const n = startRoute.length;
  let route = [...startRoute];
  let currentDistance = calculateTotalDistance(route, cities);
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        steps.push({
          type: "compare",
          currentRoute: [...route, route[0]],
          distance: currentDistance,
          swapIndices: [i, k],
          explanation: `Compare swap between indices ${i} and ${k}`
        });

        const candidateRoute = perform2OptSwap(route, i, k);
        const candidateDistance = calculateTotalDistance(candidateRoute, cities);

        if (candidateDistance < currentDistance - EPSILON) {
          route = candidateRoute;
          currentDistance = candidateDistance;
          improved = true;

          steps.push({
            type: "swap",
            currentRoute: [...route, route[0]],
            distance: currentDistance,
            swapIndices: [i, k],
            explanation: `Swap improves distance to ${currentDistance.toFixed(2)}`
          });
          break;
        }
      }

      if (improved) break;
    }
  }

  steps.push({
    type: "final",
    currentRoute: [...route, route[0]],
    distance: currentDistance,
    explanation: "2-opt complete: locally optimal route"
  });

  return steps;
}

export { generateTwoOptSteps };
