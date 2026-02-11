/**
 * Real-Time Brute Force TSP Async Engine
 * Runs permutation checking with live canvas updates
 * Shows algorithm "thinking" in progress without precomputation
 */

/**
 * Generator function for permutations
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
 * Calculate total distance for a path
 */
function calculatePathDistance(path, cities) {
  let distance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = cities[path[i]];
    const to = cities[path[i + 1]];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    distance += Math.sqrt(dx * dx + dy * dy);
  }
  // Close the loop
  const from = cities[path[path.length - 1]];
  const to = cities[path[0]];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  distance += Math.sqrt(dx * dx + dy * dy);
  return distance;
}

/**
 * Render live brute force state to canvas
 */
function renderBruteForceLive(ctx, canvas, cities, config, state) {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw background
  ctx.fillStyle = config.BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw user route
  if (state.userRoute && state.userRoute.length > 0) {
    drawRoute(ctx, state.userRoute, config.USER_ROUTE_COLOR, 2.5, cities);
  }

  // Draw current permutation being tested (faint blue)
  if (state.currentPermutation && state.currentPermutation.length > 1) {
    drawRoute(ctx, state.currentPermutation, "rgba(0, 200, 255, 0.4)", 2, cities);
  }

  // Draw best route found so far (glowing green)
  if (state.bestRoute && state.bestRoute.length > 1) {
    // Glow effect
    drawRoute(ctx, state.bestRoute, "rgba(0, 255, 136, 0.3)", 8, cities);
    // Main route
    drawRoute(ctx, state.bestRoute, "#00ff88", 3, cities);
  }

  // Draw cities
  drawCities(ctx, cities, config, state.bestRoute);

  // Draw metadata on canvas
  drawBruteForceMetadata(ctx, canvas, config, state);
}

/**
 * Draw a route on canvas
 */
function drawRoute(ctx, route, color, lineWidth, cities) {
  if (route.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  const firstCity = cities[route[0]];
  if (!firstCity) return;

  ctx.moveTo(firstCity.x, firstCity.y);

  for (let i = 1; i < route.length; i++) {
    const city = cities[route[i]];
    if (city) {
      ctx.lineTo(city.x, city.y);
    }
  }

  ctx.stroke();
}

/**
 * Draw all cities
 */
function drawCities(ctx, cities, config, bestRoute = null) {
  const bestSet = bestRoute ? new Set(bestRoute) : new Set();

  cities.forEach(city => {
    const isInBest = bestSet.has(city.id);
    const color = isInBest ? config.SELECTED_CITY_COLOR : config.CITY_COLOR;
    const glow = isInBest ? config.SELECTED_CITY_GLOW : config.CITY_GLOW;
    const radius = isInBest ? config.SELECTED_CITY_RADIUS : config.CITY_RADIUS;

    // Draw glow
    ctx.beginPath();
    ctx.arc(city.x, city.y, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Draw node
    ctx.beginPath();
    ctx.arc(city.x, city.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw city ID
    ctx.font = `bold ${config.FONT_SIZE}px ${config.FONT_FAMILY}`;
    ctx.fillStyle = config.TEXT_COLOR;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(city.id.toString(), city.x, city.y - radius - 15);
  });
}

/**
 * Draw brute force metadata on canvas
 */
function drawBruteForceMetadata(ctx, canvas, config, state) {
  let y = config.PADDING + 10;

  // Main title
  ctx.font = `bold 16px ${config.FONT_FAMILY}`;
  ctx.fillStyle = "#ff00ff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Brute Force Searching...", config.PADDING + 10, y);
  y += 28;

  // Permutation counter
  ctx.font = `bold 14px ${config.FONT_FAMILY}`;
  ctx.fillStyle = "#ff00ff";
  ctx.fillText(
    `Permutation: ${state.permutationsChecked} / ${state.totalPermutations}`,
    config.PADDING + 10,
    y
  );
  y += 22;

  // Current permutation distance
  ctx.font = `12px ${config.FONT_FAMILY}`;
  ctx.fillStyle = "#00c8ff";
  ctx.fillText(
    `Current: ${state.currentDistance.toFixed(2)}`,
    config.PADDING + 10,
    y
  );
  y += 18;

  // Best distance found
  ctx.fillStyle = "#00ff88";
  ctx.fillText(
    `Best: ${state.bestDistance.toFixed(2)}`,
    config.PADDING + 10,
    y
  );

  // Progress percentage (bottom right)
  const percentComplete = (state.permutationsChecked / state.totalPermutations * 100).toFixed(1);
  ctx.font = `12px ${config.FONT_FAMILY}`;
  ctx.fillStyle = "#ffaa00";
  ctx.textAlign = "right";
  ctx.fillText(
    `${percentComplete}%`,
    canvas.width - config.PADDING - 10,
    canvas.height - config.PADDING
  );
}

/**
 * Run Brute Force TSP with real-time async visualization
 * NO precomputed steps - pure live algorithm execution
 * 
 * @param {Array} cities - Array of city objects
 * @param {Object} ctx - Canvas context
 * @param {HTMLElement} canvas - Canvas element
 * @param {Object} config - Configuration object
 * @param {Object} state - Application state
 * @param {Number} speed - Delay in milliseconds between permutations
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Object} - Result with {path, distance}
 */
async function runBruteForceLive(cities, ctx, canvas, config, state, speed = 50, onProgress = null) {
  const n = cities.length;

  // Safety check
  if (n > 9) {
    throw new Error(`Brute Force limited to 9 cities. Current: ${n}`);
  }

  // Calculate factorial
  let totalPerms = 1;
  for (let i = 2; i <= n; i++) {
    totalPerms *= i;
  }

  // Initialize search state
  let bestDistance = Infinity;
  let bestRoute = null;
  let permutationsChecked = 0;

  // Initial render
  const liveState = {
    userRoute: state.userRoute || [],
    currentPermutation: [0],
    currentDistance: 0,
    bestRoute: null,
    bestDistance: Infinity,
    permutationsChecked: 0,
    totalPermutations: totalPerms
  };

  renderBruteForceLive(ctx, canvas, cities, config, liveState);

  // Generate and evaluate ALL n! permutations (full factorial)
  const allCities = Array.from({ length: n }, (_, i) => i);

  for (const perm of generatePermutations(allCities)) {
    // Check if cancelled
    if (state.bruteForceController?.isCancelled) {
      break;
    }

    permutationsChecked++;

    // Build full path with closing the loop
    const fullPath = [...perm, perm[0]];
    const distance = calculatePathDistance(fullPath, cities);

    // Update best if better
    if (distance < bestDistance) {
      bestDistance = distance;
      bestRoute = [...fullPath];
    }

    // Update live state
    liveState.currentPermutation = fullPath;
    liveState.currentDistance = distance;
    liveState.bestRoute = bestRoute;
    liveState.bestDistance = bestDistance;
    liveState.permutationsChecked = permutationsChecked;

    // Render live
    renderBruteForceLive(ctx, canvas, cities, config, liveState);

    // Call progress callback if provided
    if (onProgress) {
      onProgress({
        permutationsChecked,
        totalPermutations: totalPerms,
        currentDistance: distance,
        bestDistance,
        progress: (permutationsChecked / totalPerms) * 100
      });
    }

    // Yield control to browser to keep UI responsive
    // Use requestAnimationFrame for synchronized rendering
    await new Promise(resolve => {
      if (speed > 0) {
        setTimeout(resolve, speed);
      } else {
        requestAnimationFrame(resolve);
      }
    });
  }

  // Final render with best solution
  liveState.currentPermutation = bestRoute;
  liveState.currentDistance = bestDistance;
  renderBruteForceLive(ctx, canvas, cities, config, liveState);

  return {
    path: bestRoute,
    distance: bestDistance,
    permutationsChecked,
    totalPermutations: totalPerms
  };
}

/**
 * Create a cancellation controller
 */
function createBruteForceController() {
  return {
    isCancelled: false,
    cancel() {
      this.isCancelled = true;
    },
    reset() {
      this.isCancelled = false;
    }
  };
}

export { runBruteForceLive, createBruteForceController };
