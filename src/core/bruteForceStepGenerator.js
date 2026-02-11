/**
 * Brute Force TSP Step Generator
 * Generates step-by-step permutation checking trace
 * Generates FULL n! permutations (no symmetry reduction)
 * Each permutation evaluation = one "frame" in the visualization
 */

/**
 * Generator function for permutations (all n! permutations)
 */
function* generatePermutations(array) {
  if (array.length <= 1) {
    yield array;
  } else {
    for (let i = 0; i < array.length; i++) {
      const head = array[i];
      const tail = array.slice(0, i).concat(array.slice(i + 1));
      for (const perm of generatePermutations(tail)) {
        yield [head, ...perm];
      }
    }
  }
}

/**
 * Calculate total distance for a path (including closing the loop)
 */
function calculateDistance(path, cities) {
  let distance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = cities[path[i]];
    const to = cities[path[i + 1]];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    distance += Math.sqrt(dx * dx + dy * dy);
  }
  return distance;
}

/**
 * Calculate factorial for n
 */
function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Generate steps for Brute Force TSP algorithm
 * Generates FULL n! permutations with no symmetry reduction
 * @param {Array} cities - Array of city objects
 * @param {Number} samplingRate - Show every Nth permutation (to control step count)
 * @returns {Array} - Array of step objects
 */
function generateBruteForceSteps(cities, samplingRate = 1) {
  const steps = [];
  const n = cities.length;
  
  // Calculate factorial - this is the FULL n!
  const totalPermutations = factorial(n);

  // Initial step
  steps.push({
    type: "metadata_update",
    metadata: { 
      globalMessage: `Brute Force TSP - Checking ${totalPermutations} permutations`,
      complexity: `O(n!) = O(${n}!) = ${totalPermutations.toLocaleString()}`
    },
    explanation: `Brute Force will evaluate all ${totalPermutations.toLocaleString()} possible permutations to find the optimal route. No symmetry reduction - full factorial space.`
  });

  // Generate ALL permutations of all city indices (full n!)
  const allCities = Array.from({ length: n }, (_, i) => i);
  let bestDistance = Infinity;
  let bestPath = null;
  let permutationCount = 0;
  let sampledCount = 0;

  for (const perm of generatePermutations(allCities)) {
    permutationCount++;

    // Only show every Nth permutation to avoid too many steps
    if (permutationCount % samplingRate === 0) {
      // Close the loop
      const fullPath = [...perm, perm[0]];
      const distance = calculateDistance(fullPath, cities);

      sampledCount++;

      // Check if this is a new best
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPath = fullPath;

        steps.push({
          type: "best_found",
          metadata: { 
            permutation: perm.join(" → "),
            distance: distance.toFixed(2),
            counter: `${permutationCount} / ${totalPermutations}`,
            label: `New best found: ${distance.toFixed(2)}`
          },
          explanation: `Found better solution with permutation ${permutationCount}/${totalPermutations}: distance ${distance.toFixed(2)}`
        });
      }

      // Regular permutation check step
      steps.push({
        type: "permutation_check",
        metadata: { 
          permutation: perm.join(" → "),
          distance: distance.toFixed(2),
          current: permutationCount,
          total: totalPermutations,
          isBest: distance === bestDistance
        },
        explanation: `Checked permutation ${permutationCount}/${totalPermutations}: distance ${distance.toFixed(2)}`
      });
    }
  }

  // Final step - show optimal solution
  steps.push({
    type: "metadata_update",
    metadata: { 
      globalMessage: `Optimal solution found!`,
      optimalRoute: bestPath.slice(0, -1).join(" → "),
      optimalDistance: bestDistance.toFixed(2),
      totalPermutationsChecked: totalPermutations,
      permutationsNote: `Evaluated all ${totalPermutations.toLocaleString()} permutations (full n! factorial)`
    },
    explanation: `Brute Force complete. Checked all ${totalPermutations.toLocaleString()} permutations in the full factorial space. Optimal distance: ${bestDistance.toFixed(2)}`
  });

  // FINAL RESULT STEP - Mandatory for academic clarity
  // Ensure path is explicitly closed
  const finalPath = [...bestPath];
  if (finalPath[finalPath.length - 1] !== finalPath[0]) {
    finalPath.push(finalPath[0]);
  }

  steps.push({
    type: "final_result",
    path: finalPath,
    distance: bestDistance,
    algorithmType: "bruteforce",
    explanation: "Brute Force Optimal Final Route"
  });

  return steps;
}

export { generateBruteForceSteps, generatePermutations, calculateDistance, factorial };
