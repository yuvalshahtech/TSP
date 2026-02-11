# TSP Arena – Algorithm Visualization Lab

**Interactive Traveling Salesman Problem Visualization with Step Control, Real-Time Animations, and Comparative Analysis**

🌐 **Live Deployment**: [Add Netlify URL here]

---

## 🚀 Features

- ✅ **Interactive TSP Visualization** – Click to build your own route
- ✅ **Step Control Mode** – Play/Pause/Next/Previous/Replay/Reset with frame-by-frame algorithm execution
- ✅ **Greedy vs Optimal Comparison** – Side-by-side algorithm performance metrics
- ✅ **Brute Force (Full Permutations)** – Exhaustive search with n ≤ 9 city limit (O(n!) complexity)
- ✅ **Academic P vs NP Explanation** – Educational panels explaining time complexity
- ✅ **Comparative Metrics Table** – Interactive table with route visualization switching
- ✅ **Route Order Display** – Shows exact city index sequence for selected algorithm
- ✅ **Glassmorphism UI** – Modern neon-themed responsive design

---

## 📂 Project Structure

```
tsp-arena/
│
├── src/
│   ├── index.html              # Main HTML entry point
│   ├── styles.css              # Complete UI styling
│   ├── script.js               # Main orchestration script
│   │
│   ├── modules/
│   │   ├── animation-engine.js          # Canvas rendering engine
│   │   ├── metrics-engine.js            # Performance comparison logic
│   │   ├── ui-manager.js                # DOM manipulation manager
│   │   ├── greedyStepGenerator.js       # Greedy algorithm step trace
│   │   ├── bruteForceStepGenerator.js   # Brute force step trace
│   │   ├── bruteForceRealtime.js        # Real-time async brute force
│   │   ├── stepRenderer.js              # Deterministic step rendering
│   │   └── stepController.js            # Playback control manager
│   │
│   └── algorithms/
│       └── tsp-solver.js        # Pure TSP algorithm implementations
│
├── netlify.toml                 # Netlify deployment config
├── package.json                 # Project metadata
└── README.md                    # This file
```

---

## 🧠 Algorithms Implemented

### 1. User Route
- **Manual city selection** by clicking cities in sequence
- **Real-time distance calculation** as route is built
- **Comparison against algorithms** to test human intuition

### 2. Greedy (Nearest Neighbor) – O(n²)
- **Strategy**: Always choose the nearest unvisited city
- **Visualization**: 5-phase step animation showing candidate edges and decision-making
- **Performance**: Fast, but not guaranteed optimal
- **Use Case**: Quick approximation for large problem instances

### 3. Brute Force (Full Permutations) – O(n!)
- **Strategy**: Enumerate all possible routes and select shortest
- **Visualization**: Real-time permutation counter with live canvas updates
- **Performance**: Guaranteed optimal, but factorial time complexity
- **Limitation**: Restricted to ≤ 9 cities (362,880 permutations max)
- **Educational Value**: Demonstrates NP-hard factorial explosion

---

## ⚙️ Run Locally

### Option 1: Using VS Code Live Server
1. Install [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `src/index.html`
3. Select **"Open with Live Server"**
4. Application opens at `http://localhost:5500`

### Option 2: Using Python HTTP Server
```bash
cd src
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser

### Option 3: Direct File Access
Simply open `src/index.html` directly in a modern browser (Chrome, Firefox, Edge)

---

## 🌍 Deploying to Netlify

### Automatic Deployment (Recommended)
1. Push this repository to GitHub
2. Log in to [Netlify](https://netlify.com)
3. Click **"Add new site"** → **"Import an existing project"**
4. Connect your GitHub repository
5. **Build settings**:
   - Build command: *(leave empty)*
   - Publish directory: `src`
6. Click **"Deploy site"**

The `netlify.toml` file is pre-configured with the correct publish directory.

### Manual Deployment
1. Zip the `src` folder
2. Drag and drop to [Netlify Drop](https://app.netlify.com/drop)
3. Get instant live URL

---

## 🎯 How It Works

### Interactive Comparison Table
Click any row in the comparison table to visualize that algorithm's route:
- **User Row** → Shows your manually selected route (green)
- **Greedy Row** → Shows nearest-neighbor path (cyan)
- **Optimal Row** → Shows brute force best path (gold)

### Step Control System
Use playback controls for educational frame-by-frame analysis:
- **▶ Play**: Auto-advance through algorithm steps
- **⏸ Pause**: Stop at current step
- **⏭ Next**: Advance one step forward
- **⏮ Previous**: Go back one step
- **🔁 Replay**: Restart from beginning
- **🔄 Reset**: Clear to initial state

### Route Order Display
Shows exact city visit sequence: `0 → 3 → 2 → 1 → 4 → 0`
- Updates dynamically when switching between algorithm views
- Always displays closed loop (returns to start city)

---

## 🔬 Technical Details

### Architecture
- **Modular ES6 modules** with clean separation of concerns
- **Pure algorithm functions** independent of rendering
- **Step-based generator architecture** for deterministic playback
- **Real-time async mode** for live brute force visualization
- **Canvas 2D API** for high-performance rendering

### Performance Optimizations
- **Generator functions** for memory-efficient permutation enumeration
- **requestAnimationFrame** for smooth UI responsiveness
- **Cancellation controller** for aborting long-running operations
- **Precomputed step arrays** for instant replay

### Browser Compatibility
- Modern browsers with ES6 module support
- Chrome 61+, Firefox 60+, Safari 11+, Edge 16+

---

## 📊 Educational Value

This project demonstrates:
- **P vs NP complexity classes** through visual factorial growth
- **Greedy algorithms**: Local optimization vs global optimum
- **Exhaustive search**: When brute force is feasible vs infeasible
- **Algorithm analysis**: Big-O notation in action
- **Optimization problems**: Real-world applications (routing, logistics, scheduling)

Perfect for:
- Computer Science courses (Algorithms, Complexity Theory)
- Coding bootcamps and tutorials
- Algorithm visualization research
- Technical interviews and portfolio projects

---

## 🛠️ Technologies Used

- **HTML5** – Semantic structure
- **CSS3** – Glassmorphism styling with neon theme
- **JavaScript (ES6+)** – Modular architecture with async/await
- **Canvas 2D API** – High-performance rendering
- **Netlify** – Static site deployment

---

## 📜 License

MIT License – Free for educational and commercial use

---

## 👤 Author

Built with precision for algorithm education and visualization

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs via GitHub Issues
- Submit feature requests
- Create pull requests for improvements

---

**⭐ Star this repository if you find it useful for learning or teaching algorithms!**
