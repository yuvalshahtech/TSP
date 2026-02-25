/**
 * Greedy TSP Step Generator
 * Generates step-by-step algorithm trace for visualization
 * Returns step array suitable for StepController
 */

import { calculateTotalDistance } from '../algorithms/tsp-solver.js';

/**
 * Generate steps for Greedy TSP algorithm
 * @param {Array} cities - Array of city objects with id, x, y
 * @returns {Array} - Array of step objects
 */
function generateGreedySteps(cities) {
  const steps = [];
  const visited = new Set([0]);
  let currentCity = 0;
  const n = cities.length;

  // Step 1: Initial state - show starting city
  steps.push({
    type: "metadata_update",
    metadata: { 
      globalMessage: `Starting Greedy TSP with ${n} cities` 
    },
    explanation: `Greedy algorithm begins at city 0`
  });

  // Process each step of greedy algorithm
  while (visited.size < n) {
    // Find all unvisited cities (candidates)
    const candidates = [];
    for (let i = 0; i < n; i++) {
      if (!visited.has(i)) {
        candidates.push(i);
      }
    }

    // Step 2: Show candidate edges
    candidates.forEach(cityId => {
      steps.push({
        type: "candidate_edge",
        fromCity: currentCity,
        toCity: cityId,
        metadata: { 
          candidateCount: candidates.length,
          label: `Candidate edge to city ${cityId}`
        },
        explanation: `Considering ${candidates.length} unvisited cities from city ${currentCity}`
      });
    });

    // Step 3: Calculate nearest city
    let nearest = -1;
    let minDist = Infinity;

    for (const cityId of candidates) {
      const dx = cities[cityId].x - cities[currentCity].x;
      const dy = cities[cityId].y - cities[currentCity].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        nearest = cityId;
      }
    }

    // Step 4: Show decision (highlight nearest)
    steps.push({
      type: "decision",
      fromCity: currentCity,
      toCity: nearest,
      metadata: { 
        distance: minDist.toFixed(1),
        label: `Nearest unvisited city: ${nearest} (distance: ${minDist.toFixed(1)})`
      },
      explanation: `City ${nearest} is nearest unvisited city from city ${currentCity}`
    });

    // Step 5: Commit the edge
    steps.push({
      type: "edge_added",
      fromCity: currentCity,
      toCity: nearest,
      metadata: { 
        distance: minDist.toFixed(1),
        visitedCount: visited.size + 1,
        totalCount: n
      },
      explanation: `Move to city ${nearest}. Visited ${visited.size + 1}/${n} cities`
    });

    visited.add(nearest);
    currentCity = nearest;
  }

  // Step 6: Close the route (return to origin)
  const dx = cities[0].x - cities[currentCity].x;
  const dy = cities[0].y - cities[currentCity].y;
  const finalDist = Math.sqrt(dx * dx + dy * dy);

  steps.push({
    type: "route_closed",
    fromCity: currentCity,
    toCity: 0,
    metadata: { 
      distance: finalDist.toFixed(1),
      label: `Return to city 0 (distance: ${finalDist.toFixed(1)})`
    },
    explanation: `Greedy route complete. Return to starting city.`
  });

  // Calculate total distance and reconstruct full path
  const fullPath = [];
  const visitedOrder = [];
  const innerVisited = new Set([0]);
  let innerCurrent = 0;
  visitedOrder.push(0);

  // Reconstruct path by running greedy logic again
  while (innerVisited.size < n) {
    let nearest = -1;
    let minDist = Infinity;

    for (let i = 0; i < n; i++) {
      if (!innerVisited.has(i)) {
        const dx = cities[i].x - cities[innerCurrent].x;
        const dy = cities[i].y - cities[innerCurrent].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
    }

    visitedOrder.push(nearest);
    innerVisited.add(nearest);
    innerCurrent = nearest;
  }

  // Close the route
  visitedOrder.push(0);

  // Calculate total distance using centralized function
  const totalDistance = calculateTotalDistance(visitedOrder, cities);

  steps.push({
    type: "metadata_update",
    metadata: { 
      globalMessage: `Greedy algorithm complete!`,
      totalDistance: totalDistance.toFixed(2)
    },
    explanation: `Greedy TSP finished. Compare this heuristic solution with optimal.`
  });

  // FINAL RESULT STEP - Mandatory for academic clarity
  steps.push({
    type: "final_result",
    path: [...visitedOrder],
    distance: totalDistance,
    algorithmType: "greedy",
    explanation: "Greedy Algorithm Final Selected Route"
  });

  return steps;
}

export { generateGreedySteps };
