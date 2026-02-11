/**
 * Animation Engine for TSP Arena
 * Teaching-grade visualization with detailed step-by-step animations
 */

// Speed presets for educational control
const SPEED_PRESETS = {
  slow: { THINK: 1200, CONFIRM: 800, STEP: 1000 },
  medium: { THINK: 700, CONFIRM: 500, STEP: 600 },
  fast: { THINK: 300, CONFIRM: 200, STEP: 300 }
};

/**
 * Sleep utility for async animation control
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class AnimationEngine {
  constructor(ctx, canvas, state, config) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.state = state;
    this.config = config;
    this.animationFrameId = null;
    this.speed = SPEED_PRESETS.medium;
  }

  /**
   * Set animation speed
   */
  setSpeed(speedKey) {
    this.speed = SPEED_PRESETS[speedKey] || SPEED_PRESETS.medium;
  }

  /**
   * Draw all cities on canvas
   */
  drawCities() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Background
    this.ctx.fillStyle = this.config.BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.state.cities.forEach(city => {
      const isUserSelected = this.state.userRoute.includes(city.id);
      const isGreedyVisited = this.state.greedyAnimationState?.visitedIndices?.includes(city.id);
      const isCurrentGreedyCity = this.state.greedyAnimationState?.currentCityId === city.id;

      const glow = isUserSelected ? this.config.SELECTED_CITY_GLOW : this.config.CITY_GLOW;
      const color = this.determineNodeColor(isUserSelected, isGreedyVisited, isCurrentGreedyCity);
      const radius = isUserSelected || isCurrentGreedyCity ? this.config.SELECTED_CITY_RADIUS : this.config.CITY_RADIUS;

      // Draw glow
      this.ctx.beginPath();
      this.ctx.arc(city.x, city.y, radius + 8, 0, Math.PI * 2);
      this.ctx.fillStyle = glow;
      this.ctx.fill();

      // Draw node circle
      this.ctx.beginPath();
      this.ctx.arc(city.x, city.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      // Draw city ID
      this.ctx.font = `bold ${this.config.FONT_SIZE}px ${this.config.FONT_FAMILY}`;
      this.ctx.fillStyle = this.config.TEXT_COLOR;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(city.id.toString(), city.x, city.y - radius - 15);

      // Draw selection order
      if (isUserSelected) {
        const order = this.state.userRoute.indexOf(city.id) + 1;
        this.ctx.font = `bold 12px ${this.config.FONT_FAMILY}`;
        this.ctx.fillStyle = "#000000";
        this.ctx.fillText(order.toString(), city.x, city.y);
      }

      // Draw pulsing effect for current city
      if (isCurrentGreedyCity) {
        const pulse = Math.sin(Date.now() / 300) * 3 + 3;
        this.ctx.strokeStyle = "rgba(0, 255, 136, 0.6)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(city.x, city.y, radius + pulse, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }

  /**
   * Determine node color based on state
   */
  determineNodeColor(isUserSelected, isGreedyVisited, isCurrentGreedyCity) {
    if (isCurrentGreedyCity) return this.config.SELECTED_CITY_COLOR;
    if (isUserSelected) return this.config.SELECTED_CITY_COLOR;
    if (isGreedyVisited) return "#00c8ff";
    return this.config.CITY_COLOR;
  }

  /**
   * Draw candidate edges (uncommitted edges being considered)
   */
  drawCandidateEdges(fromCityId, candidateCityIds) {
    const fromCity = this.state.cities[fromCityId];
    if (!fromCity) return;

    candidateCityIds.forEach(cityId => {
      const toCity = this.state.cities[cityId];
      if (!toCity) return;

      // Faint gray for candidates
      this.ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
      this.ctx.lineWidth = 1.5;
      this.ctx.lineCap = "round";
      this.ctx.beginPath();
      this.ctx.moveTo(fromCity.x, fromCity.y);
      this.ctx.lineTo(toCity.x, toCity.y);
      this.ctx.stroke();
    });
  }

  /**
   * Draw highlighted comparison edge (nearest candidate)
   */
  drawComparisonEdge(fromCityId, toCityId) {
    const fromCity = this.state.cities[fromCityId];
    const toCity = this.state.cities[toCityId];

    if (!fromCity || !toCity) return;

    // Bright yellow for current selection
    this.ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(fromCity.x, fromCity.y);
    this.ctx.lineTo(toCity.x, toCity.y);
    this.ctx.stroke();

    // Glow effect
    this.ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(fromCity.x, fromCity.y);
    this.ctx.lineTo(toCity.x, toCity.y);
    this.ctx.stroke();
  }

  /**
   * Draw a route on canvas
   */
  drawRoute(path, color, lineWidth = 2) {
    if (!path || path.length < 2) return;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.beginPath();

    const firstCityIndex = path[0];
    const firstCity = this.state.cities[firstCityIndex];

    if (firstCity) {
      this.ctx.moveTo(firstCity.x, firstCity.y);

      for (let i = 1; i < path.length; i++) {
        const city = this.state.cities[path[i]];
        if (city) {
          this.ctx.lineTo(city.x, city.y);
        }
      }
    }

    this.ctx.stroke();
  }

  /**
   * Draw text on canvas
   */
  drawText(text, color, fontSize = 16, x = this.config.PADDING + 10, y = this.config.PADDING + 10) {
    this.ctx.font = `bold ${fontSize}px ${this.config.FONT_FAMILY}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    this.ctx.fillText(text, x, y);
  }

  /**
   * Animate Greedy with step-by-step decision visualization
   */
  async animateGreedy(path, distance, cities) {
    this.state.greedyAnimationState = {
      path: [],
      visitedIndices: [],
      currentCityId: null,
      complete: false
    };

    const visited = new Set([0]);
    const route = [0];
    let currentCityId = 0;

    // Initial render
    this.drawCities();
    this.drawRoute(this.state.userRoute, this.config.USER_ROUTE_COLOR, 2.5);
    this.state.greedyAnimationState.visitedIndices = [0];

    await sleep(500);

    // Step through greedy algorithm
    while (visited.size < cities.length) {
      this.state.greedyAnimationState.currentCityId = currentCityId;
      this.state.greedyAnimationState.visitedIndices = Array.from(visited);

      // Find unvisited candidates
      const candidates = [];
      for (let i = 0; i < cities.length; i++) {
        if (!visited.has(i)) {
          candidates.push(i);
        }
      }

      // Phase 1: Show all candidates (THINKING)
      this.drawCities();
      this.drawRoute(this.state.userRoute, this.config.USER_ROUTE_COLOR, 2.5);
      this.drawRoute(route, "#00c8ff", 2);
      this.drawCandidateEdges(currentCityId, candidates);
      this.drawText(`Comparing ${candidates.length} unvisited cities...`, "#ffff00", 14);
      this.drawText(`Step ${visited.size} / ${cities.length}`, "#00c8ff", 12, this.config.PADDING + 10, this.canvas.height - 40);

      await sleep(this.speed.THINK);

      // Phase 2: Calculate and highlight nearest
      let nearest = -1;
      let minDist = Infinity;
      const currentCity = cities[currentCityId];

      for (const candidateId of candidates) {
        const candidateCity = cities[candidateId];
        const dx = candidateCity.x - currentCity.x;
        const dy = candidateCity.y - currentCity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
          minDist = dist;
          nearest = candidateId;
        }
      }

      // Phase 3: Highlight selected edge (CONFIRMATION)
      this.drawCities();
      this.drawRoute(this.state.userRoute, this.config.USER_ROUTE_COLOR, 2.5);
      this.drawRoute(route, "#00c8ff", 2);
      this.drawComparisonEdge(currentCityId, nearest);
      this.drawText("Choosing nearest unvisited city...", "#ffff00", 14);
      this.drawText(`Distance: ${minDist.toFixed(1)}`, "#ffff00", 12, this.config.PADDING + 10, this.canvas.height - 40);

      await sleep(this.speed.CONFIRM);

      // Phase 4: Commit selection and move
      visited.add(nearest);
      route.push(nearest);
      currentCityId = nearest;

      this.state.greedyAnimationState.visitedIndices = Array.from(visited);
      this.state.greedyAnimationState.path = route;

      this.drawCities();
      this.drawRoute(this.state.userRoute, this.config.USER_ROUTE_COLOR, 2.5);
      this.drawRoute(route, "#00c8ff", 2);
      this.drawText(`Moved to city ${nearest}`, "#00ff88", 14);
      this.drawText(`Step ${visited.size} / ${cities.length}`, "#00c8ff", 12, this.config.PADDING + 10, this.canvas.height - 40);

      await sleep(this.speed.STEP);
    }

    // Phase 5: Close route and display result
    route.push(0);
    this.state.greedyAnimationState.path = route;

    this.drawCities();
    this.drawRoute(this.state.userRoute, this.config.USER_ROUTE_COLOR, 2.5);
    this.drawRoute(route, "#00c8ff", 3);
    this.drawText("Greedy route complete!", "#00c8ff", 16);
    this.drawText(`Total Distance: ${distance.toFixed(2)}`, "#00ff88", 14, this.config.PADDING + 10, this.canvas.height - 40);

    await sleep(1500);

    this.state.greedyRoute = route;
    this.state.greedyDistance = distance;
    this.state.greedyAnimationState.complete = true;
  }

  /**
   * Animate Brute Force with permutation counter
   */
  async animateBruteForce(optimalPath, optimalDistance, cities) {
    this.state.bruteForceAnimationState = {
      path: optimalPath,
      distance: optimalDistance,
      permutationsChecked: 0,
      bestFound: false,
      complete: false
    };

    const n = cities.length;
    let maxPerms = 1;
    for (let i = 2; i <= n; i++) {
      maxPerms *= i;
    }

    // Show factorial growth
    this.drawCities();
    this.drawRoute(this.state.userRoute, this.config.USER_ROUTE_COLOR, 2.5);
    this.drawText(`Factorial Time Complexity: O(n!)`, "#ffd700", 16);
    this.drawText(`For ${n} cities: ${maxPerms} permutations to check`, "#ffaa00", 14, this.config.PADDING + 10, 80);

    await sleep(1000);

    // Simulate permutation checking with visual feedback
    let checksToShow = Math.min(maxPerms, 50);
    let checksPerFrame = Math.max(1, Math.floor(maxPerms / checksToShow));

    for (let i = 0; i < checksToShow; i++) {
      this.state.bruteForceAnimationState.permutationsChecked = Math.min(
        (i + 1) * checksPerFrame,
        maxPerms
      );

      // Update every 200 permutations
      if (i % 5 === 0) {
        this.drawCities();
        this.drawRoute(this.state.userRoute, this.config.USER_ROUTE_COLOR, 2.5);
        this.drawText(`Checking permutations...`, "#ff00ff", 16);
        this.drawText(
          `Permutation ${this.state.bruteForceAnimationState.permutationsChecked} / ${maxPerms}`,
          "#ff00ff",
          14,
          this.config.PADDING + 10,
          80
        );

        const percentComplete = ((i + 1) / checksToShow * 100).toFixed(1);
        this.drawText(`Progress: ${percentComplete}%`, "#ff00ff", 12, this.config.PADDING + 10, this.canvas.height - 40);
      }

      await sleep(150);
    }

    // Show final optimal route
    this.drawCities();
    this.drawRoute(this.state.userRoute, this.config.USER_ROUTE_COLOR, 2.5);
    this.drawRoute(optimalPath, "#ffd700", 3);
    this.drawText("Optimal solution found!", "#ffd700", 16);
    this.drawText(`Distance: ${optimalDistance.toFixed(2)}`, "#ffaa00", 14, this.config.PADDING + 10, 80);
    this.drawText(`Checked all ${maxPerms} permutations`, "#ffaa00", 12, this.config.PADDING + 10, this.canvas.height - 40);

    await sleep(2000);

    this.state.optimalRoute = optimalPath;
    this.state.optimalDistance = optimalDistance;
    this.state.bruteForceAnimationState.complete = true;
  }

  /**
   * Render complete scene
   */
  render() {
    this.drawCities();

    if (this.state.userRoute.length > 0) {
      this.drawRoute(this.state.userRoute, this.config.USER_ROUTE_COLOR, 2.5);
    }

    if (this.state.greedyRoute && this.state.greedyRoute.length > 0) {
      this.drawRoute(this.state.greedyRoute, "#00c8ff", 2);
    }

    if (this.state.optimalRoute && this.state.optimalRoute.length > 0) {
      this.drawRoute(this.state.optimalRoute, "#ffd700", 2);
    }
  }

  /**
   * Clear animation states
   */
  clearAnimationStates() {
    this.state.greedyAnimationState = null;
    this.state.bruteForceAnimationState = null;
    this.state.optimalAnimationState = null;
  }
}

export default AnimationEngine;
