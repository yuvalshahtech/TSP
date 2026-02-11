/**
 * TSP Arena – You vs Algorithm
 * Professional Algorithm Visualization Product
 * 
 * Main orchestration script with Step Control Mode
 * Uses modular architecture: algorithms, animations, metrics, UI, steps
 */

import { greedyTSP, bruteForceTSP, calculateDistance } from './algorithms/tsp-solver.js';
import AnimationEngine from './modules/animation-engine.js';
import MetricsEngine from './modules/metrics-engine.js';
import UIManager from './modules/ui-manager.js';
import StepController from './modules/stepController.js';
import StepRenderer from './modules/stepRenderer.js';
import { generateGreedySteps } from './modules/greedyStepGenerator.js';
import { generateBruteForceSteps } from './modules/bruteForceStepGenerator.js';
import { runBruteForceLive, createBruteForceController } from './modules/bruteForceRealtime.js';

document.addEventListener("DOMContentLoaded", () => {
  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const CONFIG = {
    BACKGROUND_COLOR: "#0a0e27",
    CITY_RADIUS: 8,
    CITY_COLOR: "#00ffff",
    CITY_GLOW: "rgba(0, 255, 255, 0.3)",
    SELECTED_CITY_COLOR: "#00ff88",
    SELECTED_CITY_GLOW: "rgba(0, 255, 136, 0.3)",
    SELECTED_CITY_RADIUS: 12,
    USER_ROUTE_COLOR: "#00ff88",
    FONT_SIZE: 14,
    FONT_FAMILY: "Arial, sans-serif",
    TEXT_COLOR: "#ffffff",
    PADDING: 40,
    MIN_CITY_DISTANCE: 60,
    MIN_CITIES: 3,
    MAX_CITIES: 30,
    OPTIMAL_CITY_LIMIT: 9
  };

  // ============================================================================
  // DOM ELEMENTS
  // ============================================================================

  const canvas = document.getElementById("tspCanvas");
  const ctx = canvas.getContext("2d");

  if (!canvas || !ctx) {
    console.error("Canvas initialization failed");
    return;
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const state = {
    cities: [],
    userRoute: [],
    userDistance: 0,
    greedyRoute: null,
    greedyDistance: 0,
    greedyExecutionTime: 0,
    greedyAnimationState: null,
    optimalRoute: null,
    optimalDistance: 0,
    optimalExecutionTime: 0,
    optimalAnimationState: null,
    bruteForceAnimationState: null,
    bruteForceController: null,
    isAnimating: false,
    metrics: null,
    cityCount: 6,
    activeView: 'none' // Track which route is currently being viewed
  };

  // Route results storage for interactive table
  const routeResults = {
    user: null,
    greedy: null,
    optimal: null
  };

  // ============================================================================
  // ENGINE INITIALIZATION
  // ============================================================================

  const animationEngine = new AnimationEngine(ctx, canvas, state, CONFIG);
  const uiManager = new UIManager(state, CONFIG);
  const stepController = new StepController();
  const stepRenderer = new StepRenderer(ctx, canvas, CONFIG);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Calculate Euclidean distance for city placement
   */
  function calculatePlacementDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if city placement overlaps with existing cities
   */
  function hasOverlapWithCities(x, y, cities) {
    return cities.some(
      city => calculatePlacementDistance(city.x, city.y, x, y) < CONFIG.MIN_CITY_DISTANCE
    );
  }

  /**
   * Generate random cities
   */
  function generateCities(count) {
    state.cities = [];
    state.userRoute = [];
    state.userDistance = 0;
    state.greedyRoute = null;
    state.greedyDistance = 0;
    state.optimalRoute = null;
    state.optimalDistance = 0;
    state.metrics = null;
    state.cityCount = count;

    const minX = CONFIG.PADDING;
    const maxX = canvas.width - CONFIG.PADDING;
    const minY = CONFIG.PADDING;
    const maxY = canvas.height - CONFIG.PADDING;

    if (maxX <= minX || maxY <= minY) {
      console.error("Canvas too small");
      return;
    }

    const cities = [];
    let id = 0;
    let attempts = 0;

    while (cities.length < count && attempts < count * 50) {
      attempts++;
      const x = Math.random() * (maxX - minX) + minX;
      const y = Math.random() * (maxY - minY) + minY;

      if (!hasOverlapWithCities(x, y, cities)) {
        cities.push({ id: id++, x: Math.round(x), y: Math.round(y) });
      }
    }

    state.cities = cities;
    
    // Clear route results
    routeResults.user = null;
    routeResults.greedy = null;
    routeResults.optimal = null;
    
    uiManager.clearResults();
    uiManager.updateBruteForceAvailability(count);
    renderComparisonTable();
    updateRouteLabel('Viewing: Algorithm Visualization');
    updateRouteSequence(null);
    animationEngine.render();
  }

  /**
   * Handle user clicking cities
   */
  function handleCanvasClick(event) {
    if (state.isAnimating) return;
    if (state.userRoute.length === state.cities.length) return;
    if (state.cities.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedCity = state.cities.find(city => {
      const dist = Math.hypot(city.x - x, city.y - y);
      return dist <= CONFIG.CITY_RADIUS + 8;
    });

    if (!clickedCity || state.userRoute.includes(clickedCity.id)) return;

    state.userRoute.push(clickedCity.id);

    if (state.userRoute.length === state.cities.length) {
      // Route complete - calculate distance
      state.userDistance = calculateRouteDistance(state.userRoute);
      uiManager.updateUserDistance(state.userDistance);
      
      // Store in routeResults
      routeResults.user = {
        path: [...state.userRoute],
        distance: state.userDistance,
        time: null,
        complexity: '-',
        optimal: false
      };
      
      // Render comparison table
      renderComparisonTable();
    }

    animationEngine.render();
  }

  /**
   * Calculate total route distance
   */
  function calculateRouteDistance(route) {
    if (route.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < route.length; i++) {
      const from = state.cities[route[i]];
      const to = state.cities[route[(i + 1) % route.length]];
      if (from && to) {
        total += calculateDistance(from, to);
      }
    }
    return total;
  }

  // ============================================================================
  // INTERACTIVE COMPARISON TABLE
  // ============================================================================

  /**
   * Render comparison table dynamically
   */
  function renderComparisonTable() {
    const tbody = document.querySelector("#comparisonTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const methods = [
      { key: 'user', label: 'User', complexity: '-' },
      { key: 'greedy', label: 'Greedy', complexity: 'O(n²)' },
      { key: 'optimal', label: 'Optimal', complexity: 'O(n!)' }
    ];

    methods.forEach(method => {
      const result = routeResults[method.key];
      const row = document.createElement("tr");
      row.id = `row-${method.key}`;
      row.dataset.key = method.key;

      const hasData = result !== null;
      const distance = hasData ? result.distance.toFixed(2) : '-';
      const time = hasData && result.time !== null ? `${result.time.toFixed(2)} ms` : '-';
      let optimal = '-';
      
      if (method.key === 'optimal') {
        optimal = hasData ? '<i data-lucide="check" class="icon-yes"></i>' : '-';
      } else {
        optimal = '<i data-lucide="x" class="icon-no"></i>';
      }

      row.innerHTML = `
        <td class="method-name">${method.label}</td>
        <td class="distance-cell">${distance}</td>
        <td class="time-cell">${time}</td>
        <td class="complexity-cell">${method.complexity}</td>
        <td class="optimal-cell">${optimal}</td>
      `;

      // Add click handler only if route exists
      if (hasData && result.path) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
          activateRow(row);
          drawSelectedRoute(method.key);
        });
      } else {
        row.style.cursor = 'default';
        row.style.opacity = '0.6';
      }

      tbody.appendChild(row);
    });

    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Apply best distance highlighting
    highlightBestDistance();
  }

  /**
   * Highlight best distance in table
   */
  function highlightBestDistance() {
    const distances = Object.values(routeResults)
      .filter(r => r !== null)
      .map(r => r.distance);

    if (distances.length === 0) return;

    const bestDistance = Math.min(...distances);

    // Highlight all cells with best distance
    document.querySelectorAll('#comparisonTable .distance-cell').forEach(cell => {
      const value = parseFloat(cell.textContent);
      if (!isNaN(value) && Math.abs(value - bestDistance) < 0.01) {
        cell.classList.add('best-distance');
      } else {
        cell.classList.remove('best-distance');
      }
    });
  }

  /**
   * Activate selected row
   */
  function activateRow(selectedRow) {
    document.querySelectorAll("#comparisonTable tbody tr")
      .forEach(row => row.classList.remove("active-row"));

    selectedRow.classList.add("active-row");
  }

  /**
   * Draw selected route on canvas
   */
  function drawSelectedRoute(key) {
    const result = routeResults[key];
    if (!result || !result.path) return;

    state.activeView = key;
    updateRouteLabel(`Viewing: ${key.toUpperCase()} Route - Distance: ${result.distance.toFixed(2)}`);
    updateRouteSequence(result.path);

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the selected route
    drawRouteOnCanvas(result.path, getRouteColor(key), 3);

    // Draw cities
    state.cities.forEach(city => {
      const glow = CONFIG.CITY_GLOW;
      const color = CONFIG.CITY_COLOR;
      const radius = CONFIG.CITY_RADIUS;

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
      ctx.font = `bold ${CONFIG.FONT_SIZE}px ${CONFIG.FONT_FAMILY}`;
      ctx.fillStyle = CONFIG.TEXT_COLOR;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(city.id.toString(), city.x, city.y - radius - 15);
    });
  }

  /**
   * Draw route on canvas with specified color
   */
  function drawRouteOnCanvas(route, color, lineWidth) {
    if (!route || route.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;

    ctx.beginPath();
    const firstCity = state.cities[route[0]];
    if (!firstCity) return;

    ctx.moveTo(firstCity.x, firstCity.y);

    for (let i = 1; i < route.length; i++) {
      const city = state.cities[route[i]];
      if (city) {
        ctx.lineTo(city.x, city.y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /**
   * Get route color based on type
   */
  function getRouteColor(key) {
    const colors = {
      user: '#00ff88',    // Green
      greedy: '#00c8ff',  // Cyan
      optimal: '#ffd700'  // Gold
    };
    return colors[key] || '#ffffff';
  }

  /**
   * Update route label above canvas
   */
  function updateRouteLabel(text) {
    const label = document.getElementById("routeLabel");
    if (label) {
      label.textContent = text;
    }
  }

  /**
   * Update route sequence display
   */
  function updateRouteSequence(path) {
    const element = document.getElementById("routeSequence");
    if (!element) return;

    if (!path || path.length === 0) {
      element.textContent = "None";
      return;
    }

    let fullPath = [...path];

    // Ensure route is closed (returns to start)
    if (path[0] !== path[path.length - 1]) {
      fullPath.push(path[0]);
    }

    element.textContent = fullPath.join(" → ");
  }

  // ============================================================================
  // STEP CONTROL FUNCTIONS
  // ============================================================================

  /**
   * Show step control panel
   */
  function showStepControl() {
    const panel = document.getElementById("stepControlPanel");
    if (panel) {
      panel.style.display = "block";
    }
  }

  /**
   * Hide step control panel
   */
  function hideStepControl() {
    const panel = document.getElementById("stepControlPanel");
    if (panel) {
      panel.style.display = "none";
    }
  }

  /**
   * Update step control UI based on controller state
   */
  function updateStepControlUI() {
    const uiState = stepController.getUIState();

    // Update buttons
    const playBtn = document.getElementById("stepPlay");
    const pauseBtn = document.getElementById("stepPause");
    const nextBtn = document.getElementById("stepNext");
    const replayBtn = document.getElementById("stepReplay");
    const resetBtn = document.getElementById("stepReset");

    if (playBtn) playBtn.disabled = !uiState.canPlay;
    if (pauseBtn) pauseBtn.disabled = !uiState.canPause;
    if (nextBtn) nextBtn.disabled = !uiState.canNext;
    if (replayBtn) replayBtn.disabled = !uiState.canReplay;
    if (resetBtn) resetBtn.disabled = !uiState.canReset;

    // Update step counter
    const stepIndex = document.getElementById("stepIndex");
    if (stepIndex) {
      stepIndex.textContent = `Step ${uiState.currentIndex + 1} / ${uiState.totalSteps}`;
    }

    // Update progress bar
    const progressFill = document.getElementById("stepProgress");
    if (progressFill) {
      progressFill.style.width = `${uiState.progressPercent}%`;
    }

    // Update explanation
    const explanation = document.getElementById("stepExplanation");
    if (explanation) {
      explanation.textContent = stepController.getCurrentExplanation();
    }

    // Render current step
    const currentStep = stepController.getCurrentStep();
    if (currentStep) {
      stepRenderer.render(state.cities, stepController.steps, stepController.currentStepIndex, state.userRoute);
    }
  }

  /**
   * Setup step controller callbacks
   */
  function setupStepControllerCallbacks() {
    stepController.onStepChanged = () => {
      updateStepControlUI();
    };

    stepController.onPlaybackStateChanged = () => {
      updateStepControlUI();
    };
  }

  /**
   * Run Greedy algorithm with Step Control
   */
  async function runGreedyAlgorithm() {
    if (state.cities.length < 2) {
      alert("Generate at least 2 cities");
      return;
    }

    if (state.isAnimating) return;
    state.isAnimating = true;
    uiManager.disableButtons(true);

    const startTime = performance.now();

    try {
      // Generate steps
      const steps = generateGreedySteps(state.cities);
      
      // Setup step controller
      stepController.initialize("Greedy", state.cities.length, state.userRoute);
      stepController.addSteps(steps);
      setupStepControllerCallbacks();

      // Run with greedy algorithm to get results
      const result = greedyTSP(state.cities);
      state.greedyRoute = result.path;
      state.greedyDistance = result.distance;
      
      // Calculate execution time
      const endTime = performance.now();
      state.greedyExecutionTime = endTime - startTime;

      uiManager.updateEducationalPanel("greedy", state.cities.length);
      showStepControl();
      updateStepControlUI();

      // Store greedy results
      routeResults.greedy = {
        path: [...state.greedyRoute],
        distance: state.greedyDistance,
        time: state.greedyExecutionTime,
        complexity: 'O(n²)',
        optimal: false
      };
      
      // Render comparison table
      renderComparisonTable();
    } catch (err) {
      console.error("Greedy algorithm error:", err);
      alert("Error running Greedy algorithm");
    }

    state.isAnimating = false;
    uiManager.disableButtons(false);
  }

  /**
   * Run Brute Force algorithm with Real-Time Async Visualization
   * Shows algorithm thinking in progress without precomputation
   */
  async function runBruteForceAlgorithm() {
    if (state.cities.length < 2) {
      alert("Generate at least 2 cities");
      return;
    }

    if (state.cities.length > CONFIG.OPTIMAL_CITY_LIMIT) {
      alert(`Brute Force limited to ${CONFIG.OPTIMAL_CITY_LIMIT} cities maximum`);
      return;
    }

    if (state.isAnimating) return;
    state.isAnimating = true;
    uiManager.disableButtons(true);

    // Show step control panel for pause/resume
    showStepControl();

    // Create cancellation controller
    state.bruteForceController = createBruteForceController();

    const startTime = performance.now();

    try {
      // Determine speed from selected animation speed
      let delayMs = 50;
      const speedControl = document.getElementById("speedControl");
      if (speedControl) {
        const speedValue = speedControl.value;
        if (speedValue === "slow") delayMs = 150;
        else if (speedValue === "medium") delayMs = 50;
        else if (speedValue === "fast") delayMs = 10;
      }

      // Get explanation element once
      const explanation = document.getElementById("stepExplanation");

      uiManager.updateEducationalPanel("bruteForce", state.cities.length);

      // Update explanation with real-time status
      if (explanation) {
        explanation.textContent = `Real-time Brute Force search in progress. Pause to stop.`;
      }

      // Run brute force in real-time async mode
      const result = await runBruteForceLive(
        state.cities,
        ctx,
        canvas,
        CONFIG,
        state,
        delayMs,
        (progress) => {
          // Update UI with live progress
          const stepIndex = document.getElementById("stepIndex");
          if (stepIndex) {
            stepIndex.textContent = `${progress.progress.toFixed(1)}% - ${progress.permutationsChecked.toLocaleString()} / ${progress.totalPermutations.toLocaleString()}`;
          }

          const progressFill = document.getElementById("stepProgress");
          if (progressFill) {
            progressFill.style.width = `${progress.progress}%`;
          }

          if (explanation) {
            explanation.textContent = `Current: ${progress.currentDistance.toFixed(2)} | Best: ${progress.bestDistance.toFixed(2)}`;
          }
        }
      );

      // Store results
      state.optimalRoute = result.path;
      state.optimalDistance = result.distance;
      state.optimalExecutionTime = performance.now() - startTime;

      // Generate steps including final result for clear visualization
      const steps = generateBruteForceSteps(state.cities);
      
      // Initialize step controller with generated steps
      stepController.initialize("Brute Force", state.cities.length, state.userRoute);
      stepController.addSteps(steps);
      setupStepControllerCallbacks();
      
      // Jump directly to final result step (last step)
      stepController.currentStepIndex = steps.length - 1;
      
      // Render the final result with locked optimal route
      updateStepControlUI();
      
      // Store optimal results
      routeResults.optimal = {
        path: [...state.optimalRoute],
        distance: state.optimalDistance,
        time: state.optimalExecutionTime,
        complexity: 'O(n!)',
        optimal: true
      };
      
      // Render comparison table
      renderComparisonTable();
      
      // Update explanation with final result
      if (explanation) {
        explanation.textContent = stepController.getCurrentExplanation();
      }
    } catch (err) {
      console.error("Brute Force algorithm error:", err);
      alert("Error running Brute Force algorithm: " + err.message);
    }

    state.isAnimating = false;
    uiManager.disableButtons(false);
    state.bruteForceController = null;
  }

  /**
   * Run all algorithms sequentially
   */
  async function runAllAlgorithms() {
    if (state.cities.length < 2) {
      alert("Generate at least 2 cities");
      return;
    }

    if (state.isAnimating) return;

    // Run Greedy first
    await runGreedyAlgorithm();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run optimal if allowed
    if (state.cities.length <= CONFIG.OPTIMAL_CITY_LIMIT) {
      await runBruteForceAlgorithm();
    }
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Generate button
    const generateBtn = document.getElementById("generateCities");
    if (generateBtn) {
      generateBtn.addEventListener("click", () => {
        generateCities(state.cityCount);
      });
    }

    // City count slider
    const cityCountSlider = document.getElementById("cityCount");
    if (cityCountSlider) {
      cityCountSlider.addEventListener("change", (e) => {
        const count = parseInt(e.target.value);
        generateCities(count);
        uiManager.updateCityCountDisplay(count);
      });
    }

    // Speed control dropdown
    const speedControl = document.getElementById("speedControl");
    if (speedControl) {
      speedControl.addEventListener("change", (e) => {
        animationEngine.setSpeed(e.target.value);
      });
    }

    // Algorithm buttons
    const greedyBtn = document.getElementById("runGreedy");
    if (greedyBtn) {
      greedyBtn.addEventListener("click", runGreedyAlgorithm);
    }

    const bruteForceBtn = document.getElementById("runBruteForce");
    if (bruteForceBtn) {
      bruteForceBtn.addEventListener("click", runBruteForceAlgorithm);
    }

    const runAllBtn = document.getElementById("runAllAlgorithms");
    if (runAllBtn) {
      runAllBtn.addEventListener("click", runAllAlgorithms);
    }

    // Canvas click for user route
    canvas.addEventListener("click", handleCanvasClick);

    // Step control buttons
    const stepPlayBtn = document.getElementById("stepPlay");
    if (stepPlayBtn) {
      stepPlayBtn.addEventListener("click", () => {
        stepController.play();
        updateStepControlUI();
      });
    }

    const stepPauseBtn = document.getElementById("stepPause");
    if (stepPauseBtn) {
      stepPauseBtn.addEventListener("click", () => {
        // Pause step-based algorithms
        stepController.pause();
        
        // Stop real-time brute force
        if (state.bruteForceController) {
          state.bruteForceController.cancel();
        }
        
        updateStepControlUI();
      });
    }

    const stepNextBtn = document.getElementById("stepNext");
    if (stepNextBtn) {
      stepNextBtn.addEventListener("click", () => {
        stepController.next();
        updateStepControlUI();
      });
    }

    const stepReplayBtn = document.getElementById("stepReplay");
    if (stepReplayBtn) {
      stepReplayBtn.addEventListener("click", () => {
        stepController.replay();
        updateStepControlUI();
      });
    }

    const stepResetBtn = document.getElementById("stepReset");
    if (stepResetBtn) {
      stepResetBtn.addEventListener("click", () => {
        stepController.reset();
        updateStepControlUI();
      });
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize application
   */
  function init() {
    generateCities(state.cityCount);
    uiManager.updateCityCountDisplay(state.cityCount);
    uiManager.updateBruteForceAvailability(state.cityCount);
    initEventListeners();
    
    // Initialize comparison table
    renderComparisonTable();
  }

  init();
});