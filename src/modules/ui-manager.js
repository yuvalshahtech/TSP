/**
 * UI Manager for TSP Arena
 * Handles all DOM manipulation and UI updates
 */

class UIManager {
  constructor(state, config) {
    this.state = state;
    this.config = config;
    this.elements = this.cacheElements();
  }

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    return {
      generateBtn: document.getElementById("generateCities"),
      greedyBtn: document.getElementById("runGreedy"),
      bruteForceBtn: document.getElementById("runBruteForce"),
      runAllBtn: document.getElementById("runAllAlgorithms"),
      cityCountSlider: document.getElementById("cityCount"),
      cityCountDisplay: document.getElementById("cityCountValue"),
      comparisonTable: document.getElementById("comparisonTable"),
      userDistanceDisplay: document.getElementById("userDistanceDisplay"),
      educationalPanel: document.getElementById("educationalPanel"),
      educationalContent: document.getElementById("educationalContent"),
      canvas: document.getElementById("tspCanvas")
    };
  }

  /**
   * Update comparison table with algorithm results
   */
  updateComparisonTable(data) {
    const {
      userDistance = null,
      greedyDistance = null,
      greedyTime = null,
      optimalDistance = null,
      optimalTime = null
    } = data;

    // Determine best distance for highlighting
    const distances = [userDistance, greedyDistance, optimalDistance].filter(d => d !== null);
    const bestDistance = distances.length > 0 ? Math.min(...distances) : null;

    // Update User row
    const rowUser = document.getElementById('row-user');
    if (rowUser) {
      const distanceCell = rowUser.querySelector('.distance-cell');
      const timeCell = rowUser.querySelector('.time-cell');
      const optimalCell = rowUser.querySelector('.optimal-cell');
      
      if (distanceCell) {
        distanceCell.textContent = userDistance !== null ? userDistance.toFixed(2) : '-';
        distanceCell.classList.toggle('best-distance', userDistance === bestDistance && bestDistance !== null);
      }
      if (timeCell) timeCell.textContent = '-';
      if (optimalCell) {
        optimalCell.textContent = (userDistance === bestDistance && bestDistance !== null && optimalDistance !== null) ? '✅' : '❌';
      }
    }

    // Update Greedy row
    const rowGreedy = document.getElementById('row-greedy');
    if (rowGreedy) {
      const distanceCell = rowGreedy.querySelector('.distance-cell');
      const timeCell = rowGreedy.querySelector('.time-cell');
      const optimalCell = rowGreedy.querySelector('.optimal-cell');
      
      if (distanceCell) {
        distanceCell.textContent = greedyDistance !== null ? greedyDistance.toFixed(2) : '-';
        distanceCell.classList.toggle('best-distance', greedyDistance === bestDistance && bestDistance !== null);
      }
      if (timeCell) timeCell.textContent = greedyTime !== null ? `${greedyTime.toFixed(2)} ms` : '-';
      if (optimalCell) {
        optimalCell.textContent = (greedyDistance === bestDistance && bestDistance !== null && optimalDistance !== null) ? '✅' : '❌';
      }
    }

    // Update Optimal row
    const rowOptimal = document.getElementById('row-optimal');
    if (rowOptimal) {
      const distanceCell = rowOptimal.querySelector('.distance-cell');
      const timeCell = rowOptimal.querySelector('.time-cell');
      const optimalCell = rowOptimal.querySelector('.optimal-cell');
      
      if (distanceCell) {
        distanceCell.textContent = optimalDistance !== null ? optimalDistance.toFixed(2) : '-';
        distanceCell.classList.toggle('best-distance', optimalDistance === bestDistance && bestDistance !== null);
      }
      if (timeCell) timeCell.textContent = optimalTime !== null ? `${optimalTime.toFixed(2)} ms` : '-';
      if (optimalCell) {
        optimalCell.textContent = optimalDistance !== null ? '✅' : '-';
      }
      
      // Add gold highlighting to optimal row
      rowOptimal.classList.toggle('optimal-row', optimalDistance !== null);
    }
  }

  /**
   * Update educational panel
   */
  updateEducationalPanel(algorithmName, cityCount) {
    if (!this.elements.educationalContent) return;

    const content = {
      greedy: `
        <h3>Greedy (Nearest Neighbor)</h3>
        <p><strong>Strategy:</strong> Always choose the nearest unvisited city.</p>
        <p><strong>Time Complexity:</strong> O(n²)</p>
        <p><strong>Pros:</strong> Fast, simple, often finds decent solutions.</p>
        <p><strong>Cons:</strong> Not guaranteed optimal, locally greedy decisions.</p>
        <p><strong>Use Case:</strong> Quick approximation when optimality isn't critical.</p>
      `,
      bruteForce: `
        <h3>Brute Force (Exact)</h3>
        <p><strong>Strategy:</strong> Try every possible route and pick the best.</p>
        <p><strong>Time Complexity:</strong> O(n!) - Factorial explosion!</p>
        <p><strong>Pros:</strong> Guaranteed optimal solution.</p>
        <p><strong>Cons:</strong> Extremely slow for large n (${cityCount} cities = ${this.factorial(cityCount)} permutations!).</p>
        <p><strong>Use Case:</strong> Only practical for very small (n ≤ 10) instances.</p>
      `
    };

    this.elements.educationalContent.innerHTML = content[algorithmName] || '';
    this.elements.educationalPanel.style.display = "block";
  }

  /**
   * Update city count slider
   */
  updateCityCountDisplay(count) {
    if (this.elements.cityCountDisplay) {
      this.elements.cityCountDisplay.textContent = count;
    }
  }

  /**
   * Update user distance display
   */
  updateUserDistance(distance) {
    if (this.elements.userDistanceDisplay) {
      this.elements.userDistanceDisplay.innerHTML = `
        <div class="distance-display">
          <span>Your Distance:</span>
          <span class="distance-value">${distance.toFixed(2)}</span>
        </div>
      `;
      this.elements.userDistanceDisplay.style.display = "block";
    }
  }

  /**
   * Disable buttons during animation
   */
  disableButtons(disable = true) {
    if (this.elements.generateBtn) this.elements.generateBtn.disabled = disable;
    if (this.elements.greedyBtn) this.elements.greedyBtn.disabled = disable;
    if (this.elements.bruteForceBtn) this.elements.bruteForceBtn.disabled = disable;
    if (this.elements.runAllBtn) this.elements.runAllBtn.disabled = disable;
  }

  /**
   * Enable/disable brute force based on city count
   */
  updateBruteForceAvailability(cityCount) {
    if (!this.elements.bruteForceBtn) return;

    if (cityCount > 9) {
      this.elements.bruteForceBtn.disabled = true;
      this.elements.bruteForceBtn.title = `Brute Force disabled (${cityCount} cities > 9 limit)`;
    } else {
      this.elements.bruteForceBtn.disabled = false;
      this.elements.bruteForceBtn.title = "Run Brute Force (Optimal)";
    }
  }

  /**
   * Clear results display
   */
  clearResults() {
    // Reset comparison table to default state
    this.updateComparisonTable({
      userDistance: null,
      greedyDistance: null,
      greedyTime: null,
      optimalDistance: null,
      optimalTime: null
    });
    if (this.elements.educationalPanel) this.elements.educationalPanel.style.display = "none";
  }

  /**
   * Calculate factorial for display
   */
  factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
      if (result > 1000000000) return "1,000,000,000+";
    }
    return result.toLocaleString();
  }
}

export default UIManager;
