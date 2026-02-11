/**
 * Metrics Engine for TSP Arena
 * Calculates statistics, time complexity, and performance metrics
 */

class MetricsEngine {
  /**
   * Calculate performance metrics
   */
  static calculateMetrics(userDistance, greedyDistance, optimalDistance) {
    const metrics = {
      userDistance: parseFloat(userDistance.toFixed(2)),
      greedyDistance: parseFloat(greedyDistance.toFixed(2)),
      optimalDistance: optimalDistance ? parseFloat(optimalDistance.toFixed(2)) : null,
      userVsGreedy: null,
      userVsOptimal: null,
      greedyVsOptimal: null
    };

    if (greedyDistance > 0) {
      metrics.userVsGreedy = parseFloat((((userDistance - greedyDistance) / greedyDistance) * 100).toFixed(2));
    }

    if (optimalDistance && optimalDistance > 0) {
      metrics.userVsOptimal = parseFloat((((userDistance - optimalDistance) / optimalDistance) * 100).toFixed(2));
      metrics.greedyVsOptimal = parseFloat((((greedyDistance - optimalDistance) / optimalDistance) * 100).toFixed(2));
    }

    return metrics;
  }

  /**
   * Determine winner
   */
  static determineWinner(metrics) {
    if (metrics.optimalDistance) {
      if (metrics.userDistance === metrics.optimalDistance) {
        return { winner: "user", message: "🏆 Perfect! You found optimal!" };
      }
      if (metrics.userDistance < metrics.greedyDistance) {
        return { winner: "user", message: "🔥 You beat Greedy!" };
      }
      return { winner: "greedy", message: "🤖 Greedy wins this round." };
    } else {
      if (metrics.userDistance < metrics.greedyDistance) {
        return { winner: "user", message: "🔥 You beat Greedy!" };
      }
      return { winner: "greedy", message: "🤖 Greedy wins this round." };
    }
  }

  /**
   * Get time complexity explanation
   */
  static getTimeComplexity(algorithmName, cityCount) {
    const complexities = {
      greedy: {
        notation: "O(n²)",
        explanation: "Greedy algorithm checks all unvisited cities at each step.",
        expanded: `Approximate operations: ${cityCount * cityCount}`
      },
      bruteForce: {
        notation: "O(n!)",
        explanation: "Brute Force evaluates all possible permutations.",
        expanded: `Approximate operations: ${this.factorial(cityCount)}`
      }
    };

    return complexities[algorithmName] || null;
  }

  /**
   * Calculate factorial
   */
  static factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Format execution time
   */
  static formatTime(ms) {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Calculate scoring
   */
  static calculateScore(userDistance, optimalDistance) {
    if (!optimalDistance || optimalDistance === 0) return 0;

    const percentDifference = ((userDistance - optimalDistance) / optimalDistance) * 100;

    if (percentDifference === 0) return 100;
    if (percentDifference <= 5) return 80;
    if (percentDifference <= 10) return 60;
    if (percentDifference <= 20) return 40;
    if (percentDifference <= 50) return 20;
    return 0;
  }
}

export default MetricsEngine;
