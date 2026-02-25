/**
 * Calculate Euclidean distance between two cities
 */
function calculateDistance(cityA, cityB) {
    const dx = cityB.x - cityA.x;
    const dy = cityB.y - cityA.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Float comparison epsilon for robustness
const EPSILON = 1e-9;

/**
 * Calculate total distance of a route (treats route as cyclic)
 */
function calculateTotalDistance(route, cities) {
    if (!route || route.length < 2) return 0;

    let totalDistance = 0;
    const isClosed = route[0] === route[route.length - 1];

    for (let i = 0; i < route.length - 1; i++) {
        totalDistance += calculateDistance(cities[route[i]], cities[route[i + 1]]);
    }

    if (!isClosed) {
        totalDistance += calculateDistance(cities[route[route.length - 1]], cities[route[0]]);
    }

    return totalDistance;
}

/**
 * Perform a 2-opt swap between indices i and k (inclusive)
 */
function perform2OptSwap(route, i, k) {
    const start = route.slice(0, i);
    const middle = route.slice(i, k + 1).reverse();
    const end = route.slice(k + 1);
    return start.concat(middle, end);
}

/**
 * 2-opt Local Search TSP Algorithm
 * Improves an initial route by reversing segments
 * @param {Array<Object>} cities - Array of city objects [{id, x, y}, ...]
 * @param {Array<number>} initialRoute - Initial route (may be closed or open)
 * @returns {Object} {route: [city indices], distance: total distance, iterations: successful swaps}
 */
function twoOpt(cities, initialRoute) {
    if (!cities || cities.length < 2) {
        return { route: [], distance: 0, iterations: 0 };
    }

    if (!initialRoute || initialRoute.length < 2) {
        return { route: [], distance: 0, iterations: 0 };
    }

    const baseRoute = [...initialRoute];
    if (baseRoute.length > 1 && baseRoute[0] === baseRoute[baseRoute.length - 1]) {
        baseRoute.pop();
    }

    const n = baseRoute.length;
    if (n < 3) {
        const closedRoute = [...baseRoute, baseRoute[0]];
        return {
            route: closedRoute,
            distance: calculateTotalDistance(closedRoute, cities),
            iterations: 0
        };
    }

    let route = [...baseRoute];
    let bestDistance = calculateTotalDistance(route, cities);
    let improved = true;
    let iterations = 0;

    while (improved) {
        improved = false;

        for (let i = 1; i < n - 1; i++) {
            for (let k = i + 1; k < n; k++) {
                const newRoute = perform2OptSwap(route, i, k);
                const newDistance = calculateTotalDistance(newRoute, cities);

                if (newDistance < bestDistance - EPSILON) {
                    route = newRoute;
                    bestDistance = newDistance;
                    iterations += 1;
                    improved = true;
                    break;
                }
            }
            if (improved) break;
        }
    }

    const closedRoute = [...route, route[0]];

    return {
        route: closedRoute,
        distance: bestDistance,
        iterations
    };
}

/**
 * Generate all permutations of an array (for brute force TSP)
 */
function* generatePermutations(array) {
    if (array.length <= 1) {
        yield array;
    } else {
        for (let i = 0; i < array.length; i++) {
            const rest = [...array.slice(0, i), ...array.slice(i + 1)];
            for (const perm of generatePermutations(rest)) {
                yield [array[i], ...perm];
            }
        }
    }
}

/**
 * Greedy (Nearest Neighbor) TSP Algorithm
 * Time Complexity: O(n²)
 * @param {Array<Object>} cities - Array of city objects [{id, x, y}, ...]
 * @returns {Object} {path: [city indices], distance: total distance}
 */
function greedyTSP(cities) {
    if (!cities || cities.length < 2) {
        return { path: [], distance: 0 };
    }

    const visited = new Array(cities.length).fill(false);
    const path = [];
    let currentCity = 0;
    visited[currentCity] = true;
    path.push(currentCity);

    for (let i = 1; i < cities.length; i++) {
        let nearestCity = -1;
        let nearestDistance = Infinity;

        for (let j = 0; j < cities.length; j++) {
            if (!visited[j]) {
                const distance = calculateDistance(cities[currentCity], cities[j]);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestCity = j;
                }
            }
        }

        visited[nearestCity] = true;
        path.push(nearestCity);
        currentCity = nearestCity;
    }

    // Close the loop
    path.push(0);

    // Calculate total distance
    const distance = calculateTotalDistance(path, cities);

    return { path, distance };
}


/**
 * Brute Force TSP Algorithm (Optimal Solution)
 * Time Complexity: O(n!)
 * Generates ALL n! permutations (full factorial explosion visualization)
 * Only practical for n ≤ 9
 * @param {Array<Object>} cities - Array of city objects
 * @returns {Object} {path: [city indices], distance: total distance}
 */
function bruteForceTSP(cities) {
    if (!cities || cities.length < 2) {
        return { path: [], distance: 0 };
    }

    if (cities.length > 10) {
        throw new Error('Brute Force TSP only practical for n ≤ 10');
    }

    const n = cities.length;
    // Generate permutations of ALL city indices (full n! permutations)
    const allCities = Array.from({length: n}, (_, i) => i);
    
    let minDistance = Infinity;
    let optimalPath = [];

    // Generate and evaluate all n! permutations
    for (const perm of generatePermutations(allCities)) {
        // Close the loop by returning to start
        const path = [...perm, perm[0]];
        const distance = calculateTotalDistance(path, cities);
        
        if (distance < minDistance - EPSILON) {
            minDistance = distance;
            optimalPath = path;
        }
    }

    return { path: optimalPath, distance: minDistance };
}

/**
 * Internal consistency test (development only)
 * Tests with a perfect square - expected distance = 40
 */
function _runConsistencyTest() {
    const testCities = [
        { id: 0, x: 0, y: 0 },
        { id: 1, x: 0, y: 10 },
        { id: 2, x: 10, y: 10 },
        { id: 3, x: 10, y: 0 }
    ];

    const optimalRoute = [0, 1, 2, 3, 0];
    const expectedDistance = 40;

    const computedDistance = calculateTotalDistance(optimalRoute, testCities);
    const diff = Math.abs(computedDistance - expectedDistance);

    if (diff > EPSILON) {
        console.error('==========================================');
        console.error('CONSISTENCY TEST FAILED!');
        console.error('Expected distance:', expectedDistance);
        console.error('Computed distance:', computedDistance);
        console.error('Difference:', diff);
        console.error('==========================================');
        return false;
    } else {
        console.log('✓ Consistency test passed: Square route = 40.00');
        return true;
    }
}

// Run consistency test on module load (development validation)
_runConsistencyTest();

export { greedyTSP, bruteForceTSP, twoOpt, calculateDistance, calculateTotalDistance, perform2OptSwap, EPSILON };