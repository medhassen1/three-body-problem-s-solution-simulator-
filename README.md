# Three-Body Problem Simulator

An interactive web-based simulator for exploring the famous **Three-Body Problem** in physics. Watch as three celestial bodies interact through gravity, creating mesmerizing and chaotic orbital patterns.

![Three-Body Problem](https://img.shields.io/badge/Physics-Simulation-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Real-time Physics Simulation** - Runge-Kutta 4th order (RK4) and Velocity Verlet numerical integration methods
- **8 Famous Periodic Orbits** - Figure-8, Butterfly I/II, Bumblebee, Dragonfly, Goggles, Moth I/II (Šuvakov-Dmitrašinović solutions)
- **Interactive Visualization** - HTML5 Canvas rendering with trails and glow effects
- **Full Camera Controls** - Zoom, pan, follow center of mass
- **Custom Initial Conditions** - Edit and run your own body configurations
- **Advanced Analysis** - Lyapunov exponents, Poincaré sections, period detection, energy drift monitoring
- **Export / Share** - Export configurations as JSON or share via URL parameters
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **No Dependencies** - Pure HTML/CSS/JavaScript, no install needed

## What is the Three-Body Problem?

The **Three-Body Problem** is a classical physics problem that asks:

> Given three celestial bodies with known initial positions, velocities, and masses, can we predict their future motions as they interact through gravity?

### Key Insights

1. **No General Solution** - Unlike the two-body problem (which has an exact analytical solution), the three-body problem is generally unsolvable with simple formulas.

2. **Chaotic Behavior** - The system exhibits **deterministic chaos**, meaning tiny changes in initial conditions can lead to vastly different outcomes, making long-term predictions impossible.

3. **Historical Significance** - Henri Poincaré proved in the late 1800s that the three-body problem is non-integrable for most initial conditions, which laid the foundation for chaos theory.

4. **Special Solutions** - While no general solution exists, mathematicians have discovered specific initial conditions that produce stable, periodic orbits.

## How to Use

### Getting Started

1. **Open the Simulator** - Simply open `index.html` in any modern web browser
2. **No Installation Required** - Pure HTML/CSS/JavaScript, no dependencies

Or serve it locally:
```bash
npm run serve
# Opens at http://localhost:8000
```

### Controls

#### Simulation Controls
- **Play/Pause** - Start or stop the simulation
- **Reset** - Return to the initial configuration
- **Clear Trails** - Remove the trajectory trails
- **Speed Slider** - Adjust simulation speed (0.1x to 5x)
- **Trail Length** - Control how long the orbital trails appear

#### Visual Options
- **Show Trails** - Toggle orbital trajectory trails
- **Show Velocity Vectors** - Display velocity direction and magnitude
- **Follow Center of Mass** - Keep the system centered as it evolves

#### Camera Controls
- **Mouse Wheel** - Zoom in/out
- **Click & Drag** - Pan the view
- **Touch Gestures** - Pinch to zoom, drag to pan (mobile)

### Preset Scenarios

#### Figure-8 Orbit
The famous periodic orbit discovered by Cris Moore in 1993. Three equal masses chase each other along a figure-eight path.

#### Butterfly Orbit I & II
Bodies trace elegant butterfly-like patterns. Shows the diversity of stable periodic orbits possible in the three-body system.

#### Bumblebee, Dragonfly, Goggles, Moth I & II
Additional periodic solutions from the Šuvakov-Dmitrašinović (2013) catalog, each with unique stability characteristics. See `SOLUTIONS_GUIDE.md` for detailed breakdowns.

## The Physics

### Newton's Law of Universal Gravitation

$$F = G \frac{m_1 m_2}{r^2}$$

### Equations of Motion

For each body $i$, acceleration due to all other bodies:

$$\vec{a}_i = \sum_{j \neq i} G \frac{m_j (\vec{r}_j - \vec{r}_i)}{|\vec{r}_j - \vec{r}_i|^3}$$

### Numerical Integration

**RK4 (Runge-Kutta 4th order)** — High accuracy, widely used in physics simulations:
1. Calculate four intermediate slopes (k₁, k₂, k₃, k₄)
2. Combine with weights: (k₁ + 2k₂ + 2k₃ + k₄)/6
3. Update positions and velocities

**Velocity Verlet** — Symplectic integrator, better long-term energy conservation.

### Energy Conservation

$$E_{total} = E_{kinetic} + E_{potential}$$

$$E_{kinetic} = \sum_i \frac{1}{2} m_i v_i^2 \qquad E_{potential} = -\sum_{i<j} G \frac{m_i m_j}{r_{ij}}$$

The energy display shows numerical drift — smaller changes mean better accuracy.

## Technical Details

### Technologies Used
- **HTML5 Canvas** - Graphics rendering
- **Pure JavaScript (ES6+)** - No frameworks or libraries
- **CSS3** - Styling with gradients and animations

### File Structure
```
three-body-problem-s-solution-simulator/
├── index.html          # Main HTML structure and UI
├── styles.css          # Styling and responsive design
├── script.js           # Physics engine and visualization
├── README.md           # This file
└── SOLUTIONS_GUIDE.md  # Detailed guide to the 8 periodic solutions
```

### Code Architecture

**`Body`** - Represents a celestial body (position, velocity, mass, color, trail)

**`Simulation`** - Physics engine: gravitational calculations, RK4/Verlet integration, energy and momentum tracking

**`Renderer`** - Canvas rendering, camera transformations (zoom, pan), trail effects

**`UIController`** - Event handling, preset loading, custom conditions editor, URL sharing

**`AnalysisController`** - Lyapunov exponent estimation, Poincaré sections, period detection, energy drift charts

### Performance
- 60 FPS target with `requestAnimationFrame`
- Trail length limiting to prevent memory buildup
- Softening parameter to avoid singularities at close approach

## Educational Value

This simulator is perfect for:

- **Physics Students** - Visualize orbital mechanics and chaos theory
- **Educators** - Demonstrate complex concepts interactively
- **Enthusiasts** - Explore one of physics' most fascinating problems
- **Developers** - Learn numerical methods and the Canvas API

### Learning Objectives

1. Understand gravitational interactions between multiple bodies
2. Observe chaotic dynamics and sensitivity to initial conditions
3. Appreciate numerical methods for solving differential equations
4. Explore stable periodic orbits within chaotic systems
5. Visualize conservation laws (energy, momentum)

## Future Enhancements

- [ ] Add more bodies (4-body, 5-body problems)
- [ ] Animation recording (GIF/video export)
- [ ] 3D visualization option
- [ ] Collision detection
- [ ] Relativistic effects
- [ ] Real astronomical data (Sun-Earth-Moon, etc.)
- [ ] Dark/light theme toggle

## References

### Historical Papers
- Moore, C. (1993). "Braids in classical dynamics"
- Lagrange, J. L. (1772). "Essai sur le problème des trois corps"
- Poincaré, H. (1890). "Sur le problème des trois corps"

### Modern Research
- Šuvakov, M., & Dmitrašinović, V. (2013). "Three Classes of Newtonian Three-Body Planar Periodic Orbits" - Physical Review Letters

### Online Resources
- [Three-Body Problem on Wikipedia](https://en.wikipedia.org/wiki/Three-body_problem)
- [Scholarpedia Article on N-Body Problem](http://www.scholarpedia.org/article/N-body_simulations)
- [NASA on Lagrange Points](https://solarsystem.nasa.gov/resources/754/what-is-a-lagrange-point/)

## Contributing

Contributions are welcome! Feel free to report bugs, suggest features, or submit pull requests.

## License

MIT License - Free to use for educational or personal projects.

## Author

Mohamed Zeyadne && Ibrahim el Saw.

## Acknowledgments

- Chris Moore for discovering the Figure-8 orbit
- Joseph-Louis Lagrange for his groundbreaking work on the three-body problem
- Henri Poincaré for his contributions to chaos theory

---

**Enjoy exploring the beautiful chaos of the Three-Body Problem!**
