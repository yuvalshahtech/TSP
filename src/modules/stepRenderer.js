/**
 * Step-based Renderer for Algorithm Visualization
 * Reconstructs visual state from step array and renders to canvas
 * Supports deterministic step-by-step playback
 */

class StepRenderer {
  constructor(ctx, canvas, config) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.config = config;
  }

  /**
   * Render current state based on steps and cities
   * Reconstructs state from steps[0...stepIndex]
   */
  render(cities, steps, currentStepIndex, userRoute = []) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.ctx.fillStyle = this.config.BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Check if current step is final result
    const currentStep = steps[currentStepIndex];
    const isFinalResult = currentStep && currentStep.type === "final_result";

    if (currentStep && ["compare", "swap", "final"].includes(currentStep.type)) {
      this._renderTwoOptStep(cities, currentStep, userRoute);
      return;
    }

    if (isFinalResult) {
      // Special rendering for final result step
      this._renderFinalResult(cities, currentStep, userRoute);
      return;
    }

    // Reconstruct state from steps
    const state = this._reconstructState(steps, currentStepIndex);

    // Draw user route first (baseline)
    if (userRoute.length > 0) {
      this._drawRoute(userRoute, this.config.USER_ROUTE_COLOR, 2.5, cities);
    }

    // Draw permanent edges (committed/visited route)
    if (state.permanentRoute.length > 0) {
      this._drawRoute(state.permanentRoute, "#00c8ff", 2, cities);
    }

    // Draw candidate edges (edges under consideration)
    if (state.candidateEdges.length > 0) {
      state.candidateEdges.forEach(edge => {
        this._drawEdge(edge.from, edge.to, "rgba(200, 200, 200, 0.3)", 1.5, cities);
      });
    }

    // Draw highlighted decision edge (current selection)
    if (state.decisionEdge) {
      this._drawEdge(
        state.decisionEdge.from, 
        state.decisionEdge.to, 
        "rgba(255, 255, 0, 0.8)", 
        3, 
        cities
      );
      // Glow effect
      this._drawEdge(
        state.decisionEdge.from, 
        state.decisionEdge.to, 
        "rgba(255, 255, 0, 0.3)", 
        8, 
        cities
      );
    }

    // Draw cities
    this._drawCities(cities, state.visitedCities, state.currentCity);

    // Draw metadata (step counter, distance, etc.)
    if (state.metadata) {
      this._drawMetadata(state.metadata);
    }
  }

  /**
   * Render 2-opt step visualization
   */
  _renderTwoOptStep(cities, step, userRoute) {
    if (!step.currentRoute || step.currentRoute.length < 2) return;

    // Draw user route first (baseline)
    if (userRoute.length > 0) {
      this._drawRoute(userRoute, this.config.USER_ROUTE_COLOR, 2.5, cities);
    }

    const routeColor = step.type === "swap" ? "#00ff88" : (step.type === "final" ? "#ffd700" : "#00c8ff");
    this._drawRoute(step.currentRoute, routeColor, 3, cities);

    if (step.swapIndices && step.swapIndices.length === 2) {
      const [i, k] = step.swapIndices;
      const route = step.currentRoute;
      const fromA = route[i];
      const toA = route[i + 1];
      const fromB = route[k];
      const toB = route[(k + 1) % route.length];

      if (fromA !== undefined && toA !== undefined) {
        this._drawEdge(fromA, toA, "rgba(255, 255, 0, 0.8)", 3, cities);
      }
      if (fromB !== undefined && toB !== undefined) {
        this._drawEdge(fromB, toB, "rgba(255, 255, 0, 0.8)", 3, cities);
      }
    }

    const allVisited = new Set(step.currentRoute);
    this._drawCities(cities, allVisited, -1);

    this._drawMetadata({
      decision: step.type === "final" ? "2-opt complete" : "2-opt comparing",
      lastEdge: `Distance: ${step.distance.toFixed(2)}`
    });
  }

  /**
   * Reconstruct algorithm state from steps up to currentIndex
   */
  _reconstructState(steps, currentStepIndex) {
    const state = {
      permanentRoute: [0], // Always start at city 0
      candidateEdges: [],
      decisionEdge: null,
      visitedCities: new Set([0]),
      currentCity: 0,
      metadata: {}
    };

    if (currentStepIndex < 0) {
      return state;
    }

    // Process all steps up to current index
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = steps[i];
      this._processStep(step, state);
    }

    return state;
  }

  /**
   * Process individual step and update state
   */
  _processStep(step, state) {
    switch (step.type) {
      case "candidate_edge":
        // Show edge as candidate (faint)
        state.candidateEdges.push({ from: step.fromCity, to: step.toCity });
        break;

      case "decision":
        // Highlight decision edge (yellow)
        state.decisionEdge = { from: step.fromCity, to: step.toCity };
        state.metadata.decision = step.metadata?.label || "";
        break;

      case "edge_added":
        // Commit edge to permanent route
        state.permanentRoute.push(step.toCity);
        state.visitedCities.add(step.toCity);
        state.currentCity = step.toCity;
        state.candidateEdges = []; // Clear candidates
        state.decisionEdge = null;
        state.metadata.lastEdge = `City ${step.fromCity} → ${step.toCity}`;
        break;

      case "route_closed":
        // Final edge back to origin
        state.permanentRoute.push(0);
        state.candidateEdges = [];
        state.decisionEdge = null;
        break;

      case "permutation_check":
        // For brute force: current permutation being checked
        state.metadata.permutation = step.metadata?.permutationStr || "";
        state.metadata.counter = `${step.metadata?.current} / ${step.metadata?.total}`;
        break;

      case "best_found":
        // New best permutation found
        state.metadata.bestFound = step.metadata?.label || "New best found!";
        break;

      case "metadata_update":
        // Generic metadata update
        Object.assign(state.metadata, step.metadata);
        break;

      default:
        console.warn(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Draw individual edge/line
   */
  _drawEdge(fromCityId, toCityId, color, lineWidth, cities) {
    const fromCity = cities[fromCityId];
    const toCity = cities[toCityId];

    if (!fromCity || !toCity) return;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(fromCity.x, fromCity.y);
    this.ctx.lineTo(toCity.x, toCity.y);
    this.ctx.stroke();
  }

  /**
   * Draw complete route
   */
  _drawRoute(route, color, lineWidth, cities) {
    if (route.length < 2) return;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.beginPath();

    const firstCity = cities[route[0]];
    if (!firstCity) return;

    this.ctx.moveTo(firstCity.x, firstCity.y);

    for (let i = 1; i < route.length; i++) {
      const city = cities[route[i]];
      if (city) {
        this.ctx.lineTo(city.x, city.y);
      }
    }

    this.ctx.stroke();
  }

  /**
   * Draw all cities with visual state
   */
  _drawCities(cities, visitedCities, currentCity) {
    cities.forEach(city => {
      const isVisited = visitedCities.has(city.id);
      const isCurrent = currentCity === city.id;

      const glow = isCurrent || isVisited 
        ? "rgba(0, 255, 136, 0.3)" 
        : this.config.CITY_GLOW;
      const color = isCurrent 
        ? this.config.SELECTED_CITY_COLOR 
        : (isVisited ? "#00c8ff" : this.config.CITY_COLOR);
      const radius = isCurrent 
        ? this.config.SELECTED_CITY_RADIUS 
        : this.config.CITY_RADIUS;

      // Draw glow
      this.ctx.beginPath();
      this.ctx.arc(city.x, city.y, radius + 8, 0, Math.PI * 2);
      this.ctx.fillStyle = glow;
      this.ctx.fill();

      // Draw node
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

      // Draw pulsing effect for current city
      if (isCurrent) {
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
   * Draw metadata text on canvas
   */
  _drawMetadata(metadata) {
    let y = this.config.PADDING + 10;

    // Draw main decision/status
    if (metadata.decision) {
      this.ctx.font = `bold 14px ${this.config.FONT_FAMILY}`;
      this.ctx.fillStyle = "#ffff00";
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "top";
      this.ctx.fillText(metadata.decision, this.config.PADDING + 10, y);
      y += 25;
    }

    // Draw last edge or permutation counter
    if (metadata.lastEdge) {
      this.ctx.font = `12px ${this.config.FONT_FAMILY}`;
      this.ctx.fillStyle = "#00c8ff";
      this.ctx.fillText(metadata.lastEdge, this.config.PADDING + 10, y);
      y += 20;
    }

    if (metadata.counter) {
      this.ctx.font = `bold 12px ${this.config.FONT_FAMILY}`;
      this.ctx.fillStyle = "#ff00ff";
      this.ctx.fillText(metadata.counter, this.config.PADDING + 10, y);
      y += 20;
    }

    if (metadata.bestFound) {
      this.ctx.font = `bold 12px ${this.config.FONT_FAMILY}`;
      this.ctx.fillStyle = "#ffaa00";
      this.ctx.fillText(metadata.bestFound, this.config.PADDING + 10, y);
    }
  }

  /**
   * Render final result step with special highlighting
   */
  _renderFinalResult(cities, step, userRoute) {
    // Draw user route first (baseline) with reduced opacity
    if (userRoute.length > 0) {
      this._drawRoute(userRoute, "rgba(128, 128, 128, 0.2)", 2, cities);
    }

    // Determine color based on algorithm type
    const isGreedy = step.algorithmType === "greedy";
    const highlightColor = isGreedy ? "#00ffff" : "#ffd700"; // Cyan for Greedy, Gold for Brute Force
    const glowColor = isGreedy ? "rgba(0, 255, 255, 0.4)" : "rgba(255, 215, 0, 0.4)";

    // Draw final route with thick stroke and glow
    this.ctx.save();
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = glowColor;
    
    // Draw glow effect (thicker transparent line)
    this._drawRoute(step.path, glowColor, 10, cities);
    
    // Draw actual route with thick line
    this.ctx.shadowBlur = 20;
    this._drawRoute(step.path, highlightColor, 5, cities);
    
    this.ctx.restore();

    // Draw cities - all visited
    const allVisited = new Set(step.path);
    this._drawCities(cities, allVisited, -1);

    // Draw overlay text - FINAL ROUTE SELECTED
    const centerX = this.canvas.width / 2;
    const centerY = 60;

    // Background box for text
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.strokeStyle = highlightColor;
    this.ctx.lineWidth = 3;
    const boxWidth = 400;
    const boxHeight = 110;
    const boxX = centerX - boxWidth / 2;
    const boxY = centerY - 20;
    
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Title text
    this.ctx.font = `bold 24px ${this.config.FONT_FAMILY}`;
    this.ctx.fillStyle = highlightColor;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("FINAL ROUTE SELECTED", centerX, centerY);

    // Algorithm name
    this.ctx.font = `16px ${this.config.FONT_FAMILY}`;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText(step.explanation, centerX, centerY + 30);

    // Distance
    this.ctx.font = `bold 20px ${this.config.FONT_FAMILY}`;
    this.ctx.fillStyle = highlightColor;
    this.ctx.fillText(`Distance: ${step.distance.toFixed(2)}`, centerX, centerY + 60);

    this.ctx.restore();

    // Draw route sequence at bottom
    const routeStr = step.path.join(" → ");
    const bottomY = this.canvas.height - 30;
    
    this.ctx.save();
    this.ctx.font = `bold 14px ${this.config.FONT_FAMILY}`;
    this.ctx.fillStyle = highlightColor;
    this.ctx.textAlign = "center";
    this.ctx.fillText(routeStr, centerX, bottomY);
    this.ctx.restore();
  }
}

export default StepRenderer;
