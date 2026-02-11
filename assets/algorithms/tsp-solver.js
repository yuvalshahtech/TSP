/**
 * Calculate Euclidean distance between two cities
 */
function calculateDistance(cityA, cityB) {
    const dx = cityB.x - cityA.x;
    const dy = cityB.y - cityA.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate total distance of a path
 */
function calculateTotalDistance(path, cities) {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
        totalDistance += calculateDistance(cities[path[i]], cities[path[i + 1]]);
    }
    return totalDistance;
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
        
        if (distance < minDistance) {
            minDistance = distance;
            optimalPath = path;
        }
    }

    return { path: optimalPath, distance: minDistance };
}

export { greedyTSP, bruteForceTSP, calculateDistance, calculateTotalDistance };