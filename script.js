// ============================================
// THREE-BODY PROBLEM SIMULATOR
// ============================================

// ============================================
// PHYSICS ENGINE
// ============================================

class Body {
    constructor(x, y, vx, vy, mass, color, name) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.color = color;
        this.name = name;
        this.trail = [];
        this.ax = 0;
        this.ay = 0;
    }

    addTrailPoint() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > simulation.trailLength) {
            this.trail.shift();
        }
    }

    clearTrail() {
        this.trail = [];
    }
}

class Simulation {
    constructor() {
        this.bodies = [];
        this.time = 0;
        this.dt = 0.001; // Time step for integration
        this.G = 1; // Gravitational constant (normalized)
        this.paused = true;
        this.speed = 1.0;
        this.trailLength = 500;
        this.showTrails = true;
        this.showVelocity = false;
        this.followCenterOfMass = true;
        this.initialEnergy = 0;
        this.integrator = 'rk4'; // 'rk4' or 'verlet' (symplectic)
        
        // Analysis data tracking
        this.energyHistory = [];
        this.angularMomentumHistory = [];
        this.distanceHistory = { r12: [], r23: [], r13: [] };
        this.timeHistory = [];
        this.maxHistoryLength = 500;
        
        // Period detection
        this.positionHistory = [];  // Store positions for period detection
        this.detectedPeriod = null;
        this.lastPeriodCheck = 0;
        
        // Advanced analysis
        this.poincarePoints = [];  // Store Poincaré section crossings
        this.lyapunovEnabled = false;
        this.shadowBodies = [];  // For Lyapunov calculation
        this.initialSeparation = 1e-8;
        this.lyapunovSum = 0;
        this.lyapunovSamples = 0;
    }

    addBody(x, y, vx, vy, mass, color, name) {
        this.bodies.push(new Body(x, y, vx, vy, mass, color, name));
    }

    clearBodies() {
        this.bodies = [];
        this.time = 0;
        this.clearHistory();
    }

    calculateAccelerations() {
        // Reset accelerations
        for (let body of this.bodies) {
            body.ax = 0;
            body.ay = 0;
        }

        // Calculate gravitational forces between all pairs
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const body1 = this.bodies[i];
                const body2 = this.bodies[j];

                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                // Softening parameter to avoid singularities
                const softening = 0.01;
                const force = (this.G * body1.mass * body2.mass) / (distSq + softening * softening);

                const fx = force * dx / dist;
                const fy = force * dy / dist;

                // Apply force to both bodies (Newton's third law)
                body1.ax += fx / body1.mass;
                body1.ay += fy / body1.mass;
                body2.ax -= fx / body2.mass;
                body2.ay -= fy / body2.mass;
            }
        }
    }

    // Runge-Kutta 4th order integration method
    step() {
        const bodies = this.bodies;
        const n = bodies.length;
        
        // Store initial states
        const initialStates = bodies.map(b => ({
            x: b.x, y: b.y, vx: b.vx, vy: b.vy
        }));

        // k1
        this.calculateAccelerations();
        const k1 = bodies.map(b => ({
            vx: b.vx, vy: b.vy, ax: b.ax, ay: b.ay
        }));

        // k2
        for (let i = 0; i < n; i++) {
            bodies[i].x = initialStates[i].x + k1[i].vx * this.dt / 2;
            bodies[i].y = initialStates[i].y + k1[i].vy * this.dt / 2;
            bodies[i].vx = initialStates[i].vx + k1[i].ax * this.dt / 2;
            bodies[i].vy = initialStates[i].vy + k1[i].ay * this.dt / 2;
        }
        this.calculateAccelerations();
        const k2 = bodies.map(b => ({
            vx: b.vx, vy: b.vy, ax: b.ax, ay: b.ay
        }));

        // k3
        for (let i = 0; i < n; i++) {
            bodies[i].x = initialStates[i].x + k2[i].vx * this.dt / 2;
            bodies[i].y = initialStates[i].y + k2[i].vy * this.dt / 2;
            bodies[i].vx = initialStates[i].vx + k2[i].ax * this.dt / 2;
            bodies[i].vy = initialStates[i].vy + k2[i].ay * this.dt / 2;
        }
        this.calculateAccelerations();
        const k3 = bodies.map(b => ({
            vx: b.vx, vy: b.vy, ax: b.ax, ay: b.ay
        }));

        // k4
        for (let i = 0; i < n; i++) {
            bodies[i].x = initialStates[i].x + k3[i].vx * this.dt;
            bodies[i].y = initialStates[i].y + k3[i].vy * this.dt;
            bodies[i].vx = initialStates[i].vx + k3[i].ax * this.dt;
            bodies[i].vy = initialStates[i].vy + k3[i].ay * this.dt;
        }
        this.calculateAccelerations();
        const k4 = bodies.map(b => ({
            vx: b.vx, vy: b.vy, ax: b.ax, ay: b.ay
        }));

        // Final update using weighted average
        for (let i = 0; i < n; i++) {
            bodies[i].x = initialStates[i].x + (k1[i].vx + 2*k2[i].vx + 2*k3[i].vx + k4[i].vx) * this.dt / 6;
            bodies[i].y = initialStates[i].y + (k1[i].vy + 2*k2[i].vy + 2*k3[i].vy + k4[i].vy) * this.dt / 6;
            bodies[i].vx = initialStates[i].vx + (k1[i].ax + 2*k2[i].ax + 2*k3[i].ax + k4[i].ax) * this.dt / 6;
            bodies[i].vy = initialStates[i].vy + (k1[i].ay + 2*k2[i].ay + 2*k3[i].ay + k4[i].ay) * this.dt / 6;
        }

        this.time += this.dt;
    }

    // Velocity Verlet integration (symplectic - better energy conservation)
    stepVerlet() {
        const bodies = this.bodies;
        
        // Store current accelerations
        this.calculateAccelerations();
        const oldAccel = bodies.map(b => ({ ax: b.ax, ay: b.ay }));
        
        // Update positions: x(t + dt) = x(t) + v(t) * dt + 0.5 * a(t) * dt^2
        for (let i = 0; i < bodies.length; i++) {
            bodies[i].x += bodies[i].vx * this.dt + 0.5 * oldAccel[i].ax * this.dt * this.dt;
            bodies[i].y += bodies[i].vy * this.dt + 0.5 * oldAccel[i].ay * this.dt * this.dt;
        }
        
        // Calculate new accelerations at new positions
        this.calculateAccelerations();
        
        // Update velocities: v(t + dt) = v(t) + 0.5 * (a(t) + a(t + dt)) * dt
        for (let i = 0; i < bodies.length; i++) {
            bodies[i].vx += 0.5 * (oldAccel[i].ax + bodies[i].ax) * this.dt;
            bodies[i].vy += 0.5 * (oldAccel[i].ay + bodies[i].ay) * this.dt;
        }
        
        this.time += this.dt;
    }

    update() {
        if (this.paused) return;

        const steps = Math.ceil(this.speed * 10);
        for (let i = 0; i < steps; i++) {
            if (this.integrator === 'verlet') {
                this.stepVerlet();
            } else {
                this.step();
            }
        }

        // Update trails
        for (let body of this.bodies) {
            body.addTrailPoint();
        }
        
        // Track analysis data (every 10th frame to reduce overhead)
        if (Math.floor(this.time / this.dt) % 10 === 0) {
            this.trackAnalysisData();
            this.checkPoincareSection();
        }
        
        // Calculate Lyapunov if enabled
        if (this.lyapunovEnabled) {
            this.calculateLyapunovExponent();
        }
    }

    calculateEnergy() {
        let kineticEnergy = 0;
        let potentialEnergy = 0;

        // Calculate kinetic energy
        for (let body of this.bodies) {
            const v2 = body.vx * body.vx + body.vy * body.vy;
            kineticEnergy += 0.5 * body.mass * v2;
        }

        // Calculate potential energy
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const body1 = this.bodies[i];
                const body2 = this.bodies[j];
                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                potentialEnergy -= (this.G * body1.mass * body2.mass) / dist;
            }
        }

        return kineticEnergy + potentialEnergy;
    }

    calculateAngularMomentum() {
        let L = 0;
        const com = this.getCenterOfMass();
        
        for (let body of this.bodies) {
            const rx = body.x - com.x;
            const ry = body.y - com.y;
            // L = r × p = r × mv (z-component only for 2D)
            L += body.mass * (rx * body.vy - ry * body.vx);
        }
        
        return L;
    }

    getPairwiseDistances() {
        if (this.bodies.length < 3) return { r12: 0, r23: 0, r13: 0 };
        
        const dx12 = this.bodies[1].x - this.bodies[0].x;
        const dy12 = this.bodies[1].y - this.bodies[0].y;
        const r12 = Math.sqrt(dx12 * dx12 + dy12 * dy12);
        
        const dx23 = this.bodies[2].x - this.bodies[1].x;
        const dy23 = this.bodies[2].y - this.bodies[1].y;
        const r23 = Math.sqrt(dx23 * dx23 + dy23 * dy23);
        
        const dx13 = this.bodies[2].x - this.bodies[0].x;
        const dy13 = this.bodies[2].y - this.bodies[0].y;
        const r13 = Math.sqrt(dx13 * dx13 + dy13 * dy13);
        
        return { r12, r23, r13 };
    }

    trackAnalysisData() {
        this.timeHistory.push(this.time);
        this.energyHistory.push(this.calculateEnergy());
        this.angularMomentumHistory.push(this.calculateAngularMomentum());
        
        const distances = this.getPairwiseDistances();
        this.distanceHistory.r12.push(distances.r12);
        this.distanceHistory.r23.push(distances.r23);
        this.distanceHistory.r13.push(distances.r13);
        
        // Store first body's position for period detection
        if (this.bodies.length > 0) {
            const body = this.bodies[0];
            this.positionHistory.push({
                x: body.x,
                y: body.y,
                vx: body.vx,
                vy: body.vy
            });
        }
        
        // Limit history length
        if (this.timeHistory.length > this.maxHistoryLength) {
            this.timeHistory.shift();
            this.energyHistory.shift();
            this.angularMomentumHistory.shift();
            this.distanceHistory.r12.shift();
            this.distanceHistory.r23.shift();
            this.distanceHistory.r13.shift();
            this.positionHistory.shift();
        }
    }

    clearHistory() {
        this.energyHistory = [];
        this.angularMomentumHistory = [];
        this.distanceHistory = { r12: [], r23: [], r13: [] };
        this.timeHistory = [];
        this.positionHistory = [];
        this.detectedPeriod = null;
        this.lastPeriodCheck = 0;
        this.poincarePoints = [];
        this.lyapunovSum = 0;
        this.lyapunovSamples = 0;
        this.shadowBodies = [];
    }

    detectPeriod() {
        // Only check periodicity every 5 time units to avoid false positives
        if (this.time - this.lastPeriodCheck < 5) return null;
        this.lastPeriodCheck = this.time;
        
        // Need at least 100 points
        if (this.positionHistory.length < 100) return null;
        
        // Simple period detection: look for when body returns near starting position
        const startPos = this.positionHistory[0];
        const threshold = 0.1;  // Distance threshold for "close enough"
        
        // Check recent positions for return to start
        for (let i = Math.max(50, Math.floor(this.positionHistory.length / 2)); i < this.positionHistory.length - 10; i++) {
            const pos = this.positionHistory[i];
            const dx = pos.x - startPos.x;
            const dy = pos.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < threshold) {
                // Check if velocities also match
                const dvx = pos.vx - startPos.vx;
                const dvy = pos.vy - startPos.vy;
                const vdist = Math.sqrt(dvx * dvx + dvy * dvy);
                
                if (vdist < threshold) {
                    const period = this.timeHistory[i] - this.timeHistory[0];
                    if (period > 1.0) {  // Minimum reasonable period
                        this.detectedPeriod = period;
                        this.periodConfidence = {
                            positionError: dist,
                            velocityError: vdist,
                            threshold: threshold
                        };
                        return period;
                    }
                }
            }
        }
        
        return null;
    }

    checkPoincareSection() {
        // Check if body crosses y=0 plane with positive velocity
        if (this.bodies.length === 0) return;
        
        const body = this.bodies[0];  // Track first body
        const prevY = this.positionHistory.length > 0 ? 
                      this.positionHistory[this.positionHistory.length - 1].y : 0;
        
        // Check for crossing (sign change) and moving upward
        if (prevY < 0 && body.y >= 0 && body.vy > 0) {
            this.poincarePoints.push({
                x: body.x,
                vx: body.vx,
                time: this.time
            });
            
            // Limit points
            if (this.poincarePoints.length > 500) {
                this.poincarePoints.shift();
            }
        }
    }

    initializeLyapunov() {
        // Create shadow system with tiny perturbation
        this.shadowBodies = this.bodies.map(body => ({
            x: body.x + this.initialSeparation,
            y: body.y,
            vx: body.vx,
            vy: body.vy,
            mass: body.mass,
            ax: 0,
            ay: 0
        }));
    }

    calculateLyapunovExponent() {
        if (!this.lyapunovEnabled || this.shadowBodies.length === 0) return null;
        
        // Calculate accelerations for shadow system
        for (let body of this.shadowBodies) {
            body.ax = 0;
            body.ay = 0;
        }
        
        for (let i = 0; i < this.shadowBodies.length; i++) {
            for (let j = i + 1; j < this.shadowBodies.length; j++) {
                const body1 = this.shadowBodies[i];
                const body2 = this.shadowBodies[j];
                
                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                
                const softening = 0.01;
                const force = (this.G * body1.mass * body2.mass) / (distSq + softening * softening);
                
                const fx = force * dx / dist;
                const fy = force * dy / dist;
                
                body1.ax += fx / body1.mass;
                body1.ay += fy / body1.mass;
                body2.ax -= fx / body2.mass;
                body2.ay -= fy / body2.mass;
            }
        }
        
        // Update shadow system (simple Euler for speed)
        for (let body of this.shadowBodies) {
            body.vx += body.ax * this.dt;
            body.vy += body.ay * this.dt;
            body.x += body.vx * this.dt;
            body.y += body.vy * this.dt;
        }
        
        // Calculate separation
        let separation = 0;
        for (let i = 0; i < this.bodies.length; i++) {
            const dx = this.shadowBodies[i].x - this.bodies[i].x;
            const dy = this.shadowBodies[i].y - this.bodies[i].y;
            separation += Math.sqrt(dx * dx + dy * dy);
        }
        separation /= this.bodies.length;
        
        // Calculate Lyapunov exponent
        if (separation > this.initialSeparation * 1.1) {
            const lambda = Math.log(separation / this.initialSeparation) / this.time;
            this.lyapunovSum += lambda;
            this.lyapunovSamples++;
            
            // Renormalize to prevent overflow
            const scale = this.initialSeparation / separation;
            for (let i = 0; i < this.shadowBodies.length; i++) {
                this.shadowBodies[i].x = this.bodies[i].x + (this.shadowBodies[i].x - this.bodies[i].x) * scale;
                this.shadowBodies[i].y = this.bodies[i].y + (this.shadowBodies[i].y - this.bodies[i].y) * scale;
                this.shadowBodies[i].vx = this.bodies[i].vx + (this.shadowBodies[i].vx - this.bodies[i].vx) * scale;
                this.shadowBodies[i].vy = this.bodies[i].vy + (this.shadowBodies[i].vy - this.bodies[i].vy) * scale;
            }
        }
        
        return this.lyapunovSamples > 0 ? this.lyapunovSum / this.lyapunovSamples : 0;
    }

    getCenterOfMass() {
        let totalMass = 0;
        let cx = 0;
        let cy = 0;

        for (let body of this.bodies) {
            cx += body.x * body.mass;
            cy += body.y * body.mass;
            totalMass += body.mass;
        }

        return { x: cx / totalMass, y: cy / totalMass };
    }

    clearTrails() {
        for (let body of this.bodies) {
            body.clearTrail();
        }
    }
}

// ============================================
// PRESET SCENARIOS
// ============================================

const PRESETS = {
    figure8: {
        name: "Figure-8 Orbit",
        description: "Famous stable periodic orbit discovered by Moore (1993). Stable with 4th body mass 0.001-0.01",
        bodies: [
            { x: -1, y: 0, vx: 0.347111, vy: 0.532728, mass: 1, color: '#ff6b6b', name: 'Body 1' },
            { x: 1, y: 0, vx: 0.347111, vy: 0.532728, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0, y: 0, vx: -2 * 0.347111, vy: -2 * 0.532728, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    butterflyI: {
        name: "Butterfly-I Orbit",
        description: "Šuvakov-Dmitrašinović (2013). Unstable - sensitive to perturbations",
        bodies: [
            { x: -1, y: 0, vx: 0.306893, vy: 0.125507, mass: 1, color: '#ff6b6b', name: 'Body 1' },
            { x: 1, y: 0, vx: 0.306893, vy: 0.125507, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0, y: 0, vx: -2 * 0.306893, vy: -2 * 0.125507, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    butterflyII: {
        name: "Butterfly-II Orbit",
        description: "Šuvakov-Dmitrašinović (2013). Stable with 4th body mass 0.001-0.0019",
        bodies: [
            { x: -1, y: 0, vx: 0.392955, vy: 0.097579, mass: 1, color: '#ff6b6b', name: 'Body 1' },
            { x: 1, y: 0, vx: 0.392955, vy: 0.097579, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0, y: 0, vx: -2 * 0.392955, vy: -2 * 0.097579, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    bumblebee: {
        name: "Bumblebee Orbit",
        description: "Šuvakov-Dmitrašinović (2013). Stable with 4th body mass 0.001-0.0031",
        bodies: [
            { x: -1, y: 0, vx: 0.184279, vy: 0.587188, mass: 1, color: '#ff6b6b', name: 'Body 1' },
            { x: 1, y: 0, vx: 0.184279, vy: 0.587188, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0, y: 0, vx: -2 * 0.184279, vy: -2 * 0.587188, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    dragonfly: {
        name: "Dragonfly Orbit",
        description: "Šuvakov-Dmitrašinović (2013). Stable with 4th body mass 0.001-0.0021",
        bodies: [
            { x: -1, y: 0, vx: 0.080584, vy: 0.588836, mass: 1, color: '#ff6b6b', name: 'Body 1' },
            { x: 1, y: 0, vx: 0.080584, vy: 0.588836, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0, y: 0, vx: -2 * 0.080584, vy: -2 * 0.588836, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    goggles: {
        name: "Goggles Orbit",
        description: "Šuvakov-Dmitrašinović (2013). Unstable - very sensitive to perturbations",
        bodies: [
            { x: -1, y: 0, vx: 0.083300, vy: 0.127889, mass: 1, color: '#ff6b6b', name: 'Body 1' },
            { x: 1, y: 0, vx: 0.083300, vy: 0.127889, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0, y: 0, vx: -2 * 0.083300, vy: -2 * 0.127889, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    mothI: {
        name: "Moth-I Orbit",
        description: "Šuvakov-Dmitrašinović (2013). Stable with 4th body mass 0.001-0.0041",
        bodies: [
            { x: -1, y: 0, vx: 0.464445, vy: 0.396060, mass: 1, color: '#ff6b6b', name: 'Body 1' },
            { x: 1, y: 0, vx: 0.464445, vy: 0.396060, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0, y: 0, vx: -2 * 0.464445, vy: -2 * 0.396060, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    mothII: {
        name: "Moth-II Orbit",
        description: "Šuvakov-Dmitrašinović (2013). Very unstable - only stable at masses 0.0011, 0.0012",
        bodies: [
            { x: -1, y: 0, vx: 0.439166, vy: 0.452968, mass: 1, color: '#ff6b6b', name: 'Body 1' },
            { x: 1, y: 0, vx: 0.439166, vy: 0.452968, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0, y: 0, vx: -2 * 0.439166, vy: -2 * 0.452968, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    lagrange: {
        name: "Lagrange Equilateral Triangle",
        description: "Stable configuration discovered by Lagrange in 1772",
        bodies: [
            { x: 0, y: 0, vx: 0, vy: 0, mass: 3, color: '#ff6b6b', name: 'Body 1' },
            { x: 1.5, y: 0, vx: 0, vy: 0.8, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0.75, y: 1.3, vx: -0.7, vy: 0.4, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    binary: {
        name: "Binary System with Planet",
        description: "Two massive stars with a smaller body orbiting",
        bodies: [
            { x: -0.5, y: 0, vx: 0, vy: -0.5, mass: 2, color: '#ff6b6b', name: 'Star 1' },
            { x: 0.5, y: 0, vx: 0, vy: 0.5, mass: 2, color: '#4ecdc4', name: 'Star 2' },
            { x: 0, y: 1.5, vx: 1.2, vy: 0, mass: 0.5, color: '#ffe66d', name: 'Planet' }
        ]
    },
    chaotic: {
        name: "Chaotic System",
        description: "Highly sensitive to initial conditions",
        bodies: [
            { x: 1, y: 0, vx: 0, vy: 0.5, mass: 1, color: '#ff6b6b', name: 'Body 1' },
            { x: -1, y: 0, vx: 0, vy: -0.5, mass: 1, color: '#4ecdc4', name: 'Body 2' },
            { x: 0, y: 1.732, vx: -0.5, vy: 0, mass: 1, color: '#ffe66d', name: 'Body 3' }
        ]
    },
    random: {
        name: "Random Configuration",
        description: "Randomly generated initial conditions",
        generate: () => {
            const bodies = [];
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * 2 * Math.PI + Math.random() * 0.5;
                const radius = 0.8 + Math.random() * 0.4;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                const speed = 0.3 + Math.random() * 0.4;
                const vAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d'];
                bodies.push({
                    x, y,
                    vx: speed * Math.cos(vAngle),
                    vy: speed * Math.sin(vAngle),
                    mass: 0.8 + Math.random() * 0.4,
                    color: colors[i],
                    name: `Body ${i + 1}`
                });
            }
            return { bodies };
        }
    }
};

// ============================================
// RENDERER
// ============================================

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 100;
        this.offsetX = 0;
        this.offsetY = 0;
        this.targetScale = this.scale;
        this.targetOffsetX = 0;
        this.targetOffsetY = 0;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    clear() {
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
    }

    drawGrid() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2 + this.offsetX;
        const centerY = this.canvas.height / 2 + this.offsetY;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        const gridSize = this.scale;
        const startX = centerX % gridSize;
        const startY = centerY % gridSize;
        
        // Vertical lines
        for (let x = startX; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = startY; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
        
        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        
        // X axis
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(this.canvas.width, centerY);
        ctx.stroke();
        
        // Y axis
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, this.canvas.height);
        ctx.stroke();
    }

    worldToScreen(x, y) {
        return {
            x: this.canvas.width / 2 + x * this.scale + this.offsetX,
            y: this.canvas.height / 2 - y * this.scale + this.offsetY
        };
    }

    screenToWorld(x, y) {
        return {
            x: (x - this.canvas.width / 2 - this.offsetX) / this.scale,
            y: -(y - this.canvas.height / 2 - this.offsetY) / this.scale
        };
    }

    drawBody(body) {
        const pos = this.worldToScreen(body.x, body.y);
        const radius = Math.max(5, Math.sqrt(body.mass) * 8);
        
        const ctx = this.ctx;
        
        // Draw glow
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 2);
        gradient.addColorStop(0, body.color + '80');
        gradient.addColorStop(1, body.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw body
        ctx.fillStyle = body.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawTrail(body) {
        if (!simulation.showTrails || body.trail.length < 2) return;
        
        const ctx = this.ctx;
        ctx.strokeStyle = body.color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < body.trail.length; i++) {
            const point = body.trail[i];
            const pos = this.worldToScreen(point.x, point.y);
            
            if (i === 0) {
                ctx.moveTo(pos.x, pos.y);
            } else {
                ctx.lineTo(pos.x, pos.y);
            }
            
            // Fade out older parts of the trail
            const alpha = i / body.trail.length;
            ctx.globalAlpha = alpha * 0.6;
        }
        
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    drawVelocityVector(body) {
        if (!simulation.showVelocity) return;
        
        const pos = this.worldToScreen(body.x, body.y);
        const vel = {
            x: body.vx * this.scale * 0.5,
            y: -body.vy * this.scale * 0.5
        };
        
        const ctx = this.ctx;
        ctx.strokeStyle = body.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x + vel.x, pos.y + vel.y);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(vel.y, vel.x);
        const arrowSize = 10;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pos.x + vel.x, pos.y + vel.y);
        ctx.lineTo(
            pos.x + vel.x - arrowSize * Math.cos(angle - Math.PI / 6),
            pos.y + vel.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(pos.x + vel.x, pos.y + vel.y);
        ctx.lineTo(
            pos.x + vel.x - arrowSize * Math.cos(angle + Math.PI / 6),
            pos.y + vel.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    render() {
        // Smooth camera transitions
        this.scale += (this.targetScale - this.scale) * 0.1;
        this.offsetX += (this.targetOffsetX - this.offsetX) * 0.1;
        this.offsetY += (this.targetOffsetY - this.offsetY) * 0.1;
        
        // Adjust for center of mass
        if (simulation.followCenterOfMass && simulation.bodies.length > 0) {
            const com = simulation.getCenterOfMass();
            const comScreen = this.worldToScreen(com.x, com.y);
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            this.targetOffsetX -= (comScreen.x - centerX) * 0.05;
            this.targetOffsetY -= (comScreen.y - centerY) * 0.05;
        }
        
        this.clear();
        
        // Draw trails first
        for (let body of simulation.bodies) {
            this.drawTrail(body);
        }
        
        // Draw bodies
        for (let body of simulation.bodies) {
            this.drawBody(body);
            this.drawVelocityVector(body);
        }
    }

    zoom(delta, mouseX, mouseY) {
        const zoomFactor = 1.1;
        const oldScale = this.targetScale;
        
        if (delta > 0) {
            this.targetScale *= zoomFactor;
        } else {
            this.targetScale /= zoomFactor;
        }
        
        this.targetScale = Math.max(10, Math.min(500, this.targetScale));
        
        // Zoom towards mouse position
        const worldPos = this.screenToWorld(mouseX, mouseY);
        const newScreenPos = this.worldToScreen(worldPos.x, worldPos.y);
        this.targetOffsetX += mouseX - newScreenPos.x;
        this.targetOffsetY += mouseY - newScreenPos.y;
    }

    pan(dx, dy) {
        this.targetOffsetX += dx;
        this.targetOffsetY += dy;
    }
}

// ============================================
// UI CONTROLLER
// ============================================

class UIController {
    constructor() {
        this.setupEventListeners();
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
        this.customEditorMode = false;
        this.clickPlaceMode = false;
        this.placementStep = 0; // 0 = body1 pos, 1 = body1 vel, 2 = body2 pos, etc.
        this.tempPositions = [];
    }

    setupEventListeners() {
        // Play/Pause button
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            simulation.paused = !simulation.paused;
            this.updatePlayPauseButton();
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.loadPreset(currentPreset);
        });

        // Clear trails button
        document.getElementById('clearTrailsBtn').addEventListener('click', () => {
            simulation.clearTrails();
        });

        // Speed slider
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            simulation.speed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = simulation.speed.toFixed(1);
        });

        // Trail length slider
        const trailSlider = document.getElementById('trailLengthSlider');
        trailSlider.addEventListener('input', (e) => {
            simulation.trailLength = parseInt(e.target.value);
            document.getElementById('trailLengthValue').textContent = simulation.trailLength;
        });

        // Checkboxes
        document.getElementById('showTrailsCheckbox').addEventListener('change', (e) => {
            simulation.showTrails = e.target.checked;
        });

        document.getElementById('showVelocityCheckbox').addEventListener('change', (e) => {
            simulation.showVelocity = e.target.checked;
        });

        document.getElementById('centerOfMassCheckbox').addEventListener('change', (e) => {
            simulation.followCenterOfMass = e.target.checked;
        });

        // Integrator selection
        document.getElementById('integratorSelect').addEventListener('change', (e) => {
            simulation.integrator = e.target.value;
            console.log(`Switched to ${e.target.value === 'verlet' ? 'Velocity Verlet (Symplectic)' : 'RK4'} integrator`);
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.getAttribute('data-preset');
                this.loadPreset(preset);
                this.disableCustomEditor();
            });
        });

        // Custom editor toggle
        document.getElementById('toggleEditorBtn').addEventListener('click', () => {
            this.toggleCustomEditor();
        });

        // Apply custom configuration
        document.getElementById('applyCustomBtn').addEventListener('click', () => {
            this.applyCustomConfiguration();
        });

        // Click to place mode
        document.getElementById('clickPlaceBtn').addEventListener('click', () => {
            this.toggleClickPlaceMode();
        });

        // Input change listeners to update in real-time
        const inputs = ['mass1', 'x1', 'y1', 'vx1', 'vy1', 
                       'mass2', 'x2', 'y2', 'vx2', 'vy2',
                       'mass3', 'x3', 'y3', 'vx3', 'vy3'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => {
                    if (this.customEditorMode) {
                        this.applyCustomConfiguration();
                    }
                });
            }
        });

        // Canvas mouse interactions
        this.setupCanvasInteractions();
    }

    setupCanvasInteractions() {
        const canvas = renderer.canvas;
        let isDragging = false;
        let lastX, lastY;

        canvas.addEventListener('mousedown', (e) => {
            if (this.clickPlaceMode) {
                this.handleCanvasClick(e);
                return;
            }
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDragging && !this.clickPlaceMode) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                renderer.pan(dx, dy);
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            renderer.zoom(e.deltaY, mouseX, mouseY);
        });

        // Touch support
        let touchDistance = 0;
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging) {
                const dx = e.touches[0].clientX - lastX;
                const dy = e.touches[0].clientY - lastY;
                renderer.pan(dx, dy);
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const delta = distance - touchDistance;
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const rect = canvas.getBoundingClientRect();
                renderer.zoom(-delta, centerX - rect.left, centerY - rect.top);
                touchDistance = distance;
            }
        });

        canvas.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    handleCanvasClick(e) {
        const rect = renderer.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = renderer.screenToWorld(mouseX, mouseY);

        if (this.placementStep < 3) {
            // Placing positions
            const bodyNum = this.placementStep + 1;
            document.getElementById(`x${bodyNum}`).value = worldPos.x.toFixed(3);
            document.getElementById(`y${bodyNum}`).value = worldPos.y.toFixed(3);
            this.placementStep++;
            
            if (this.placementStep === 3) {
                // All bodies placed, apply and exit
                this.applyCustomConfiguration();
                this.toggleClickPlaceMode();
                alert('✓ All 3 bodies placed! You can now adjust their velocities and masses, or click Play to start.');
            } else {
                alert(`✓ Body ${bodyNum} placed! Click to place Body ${bodyNum + 1}`);
            }
        }
    }

    toggleCustomEditor() {
        this.customEditorMode = !this.customEditorMode;
        const panel = document.getElementById('customEditorPanel');
        const btn = document.getElementById('toggleEditorBtn');
        
        if (this.customEditorMode) {
            panel.style.display = 'block';
            btn.textContent = '🎨 Disable Custom Mode';
            btn.classList.add('editor-active');
            // Load current values into editor
            this.loadCurrentValuesToEditor();
        } else {
            panel.style.display = 'none';
            btn.textContent = '🎨 Enable Custom Mode';
            btn.classList.remove('editor-active');
            this.disableClickPlaceMode();
        }
    }

    disableCustomEditor() {
        this.customEditorMode = false;
        const panel = document.getElementById('customEditorPanel');
        const btn = document.getElementById('toggleEditorBtn');
        panel.style.display = 'none';
        btn.textContent = '🎨 Enable Custom Mode';
        btn.classList.remove('editor-active');
        this.disableClickPlaceMode();
    }

    toggleClickPlaceMode() {
        this.clickPlaceMode = !this.clickPlaceMode;
        const btn = document.getElementById('clickPlaceBtn');
        const canvas = renderer.canvas;
        
        if (this.clickPlaceMode) {
            canvas.classList.add('click-place-active');
            btn.textContent = '❌ Cancel Placement';
            btn.classList.add('editor-active');
            this.placementStep = 0;
            alert('Click on the canvas to place Body 1');
        } else {
            this.disableClickPlaceMode();
        }
    }

    disableClickPlaceMode() {
        this.clickPlaceMode = false;
        const btn = document.getElementById('clickPlaceBtn');
        const canvas = renderer.canvas;
        canvas.classList.remove('click-place-active');
        btn.textContent = '🖱️ Click to Place Bodies';
        btn.classList.remove('editor-active');
        this.placementStep = 0;
    }

    loadCurrentValuesToEditor() {
        if (simulation.bodies.length >= 3) {
            for (let i = 0; i < 3; i++) {
                const body = simulation.bodies[i];
                const num = i + 1;
                document.getElementById(`mass${num}`).value = body.mass.toFixed(2);
                document.getElementById(`x${num}`).value = body.x.toFixed(3);
                document.getElementById(`y${num}`).value = body.y.toFixed(3);
                document.getElementById(`vx${num}`).value = body.vx.toFixed(3);
                document.getElementById(`vy${num}`).value = body.vy.toFixed(3);
            }
        }
    }

    applyCustomConfiguration() {
        // Read values from inputs
        const bodies = [];
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d'];
        
        for (let i = 1; i <= 3; i++) {
            const mass = parseFloat(document.getElementById(`mass${i}`).value) || 1.0;
            const x = parseFloat(document.getElementById(`x${i}`).value) || 0;
            const y = parseFloat(document.getElementById(`y${i}`).value) || 0;
            const vx = parseFloat(document.getElementById(`vx${i}`).value) || 0;
            const vy = parseFloat(document.getElementById(`vy${i}`).value) || 0;
            
            bodies.push({
                x, y, vx, vy, mass,
                color: colors[i - 1],
                name: `Body ${i}`
            });
        }

        // Apply to simulation
        simulation.clearBodies();
        simulation.clearTrails();
        simulation.time = 0;
        simulation.paused = true;
        this.updatePlayPauseButton();

        for (let bodyData of bodies) {
            simulation.addBody(
                bodyData.x, bodyData.y,
                bodyData.vx, bodyData.vy,
                bodyData.mass,
                bodyData.color,
                bodyData.name
            );
        }

        simulation.initialEnergy = simulation.calculateEnergy();
        this.updateBodyConfig();
        
        // Reset camera
        renderer.targetScale = 100;
        renderer.targetOffsetX = 0;
        renderer.targetOffsetY = 0;

        currentPreset = 'custom';
    }

    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        if (simulation.paused) {
            btn.textContent = '▶️ Play';
            btn.classList.remove('active');
        } else {
            btn.textContent = '⏸️ Pause';
            btn.classList.add('active');
        }
    }

    loadPreset(presetName) {
        currentPreset = presetName;
        simulation.clearBodies();
        simulation.clearTrails();
        simulation.time = 0;
        simulation.paused = true;
        this.updatePlayPauseButton();

        let preset = PRESETS[presetName];
        if (presetName === 'random' && preset.generate) {
            preset = preset.generate();
        }

        for (let bodyData of preset.bodies) {
            simulation.addBody(
                bodyData.x, bodyData.y,
                bodyData.vx, bodyData.vy,
                bodyData.mass,
                bodyData.color,
                bodyData.name
            );
        }

        simulation.initialEnergy = simulation.calculateEnergy();
        this.updateBodyConfig();
        updateConfigTable(); // Update the config table immediately
        this.displayInitialConditions(presetName, preset); // Show IC card
        
        // Reset camera
        renderer.targetScale = 100;
        renderer.targetOffsetX = 0;
        renderer.targetOffsetY = 0;
    }

    displayInitialConditions(presetName, preset) {
        const container = document.getElementById('icDisplay');
        if (!container) {
            console.warn('IC Display container not found');
            return;
        }
        if (!preset || !preset.bodies) {
            console.warn('Invalid preset data');
            return;
        }
        
        // Map preset names to sources
        const sources = {
            'figure8': 'Šuvakov & Dmitrašinović (2013) - Figure-8',
            'butterflyI': 'Šuvakov & Dmitrašinović (2013) - Butterfly-I',
            'butterflyII': 'Šuvakov & Dmitrašinović (2013) - Butterfly-II',
            'bumblebee': 'Šuvakov & Dmitrašinović (2013) - Bumblebee',
            'dragonfly': 'Šuvakov & Dmitrašinović (2013) - Dragonfly',
            'goggles': 'Šuvakov & Dmitrašinović (2013) - Goggles',
            'mothI': 'Šuvakov & Dmitrašinović (2013) - Moth-I',
            'mothII': 'Šuvakov & Dmitrašinović (2013) - Moth-II',
            'lagrange': 'Lagrange (1772) - Equilateral Triangle',
            'binary': 'Classical - Binary System',
            'chaotic': 'Classical - Chaotic Example',
            'random': 'Random Generated'
        };
        
        const source = sources[presetName] || 'Custom';
        
        let html = `
            <div class="ic-card">
                <div class="ic-header">
                    <div class="ic-title">${preset.name || presetName}</div>
                    <div class="ic-source">${source}</div>
                </div>
        `;
        
        preset.bodies.forEach((body, i) => {
            html += `
                <div class="ic-body">
                    <div class="ic-body-name" style="color: ${body.color};">● ${body.name}</div>
                    <div class="ic-params">
                        <div class="ic-param"><span class="ic-param-label">m:</span> ${body.mass.toFixed(4)}</div>
                        <div class="ic-param"><span class="ic-param-label">x:</span> ${body.x.toFixed(4)}</div>
                        <div class="ic-param"><span class="ic-param-label">y:</span> ${body.y.toFixed(4)}</div>
                        <div class="ic-param"><span class="ic-param-label">vx:</span> ${body.vx.toFixed(4)}</div>
                        <div class="ic-param"><span class="ic-param-label">vy:</span> ${body.vy.toFixed(4)}</div>
                    </div>
                </div>
            `;
        });
        
        html += `
                <div class="ic-actions">
                    <button class="btn-copy" onclick="copyICAsJSON()">📋 Copy as JSON</button>
                    <button class="btn-copy" onclick="copyICAsText()">📄 Copy as Text</button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    updateBodyConfig() {
        const container = document.getElementById('bodyConfig');
        if (!container) {
            // bodyConfig was replaced with configTable, skip this
            return;
        }
        container.innerHTML = '';

        simulation.bodies.forEach((body, index) => {
            const bodyItem = document.createElement('div');
            bodyItem.className = 'body-item';
            bodyItem.innerHTML = `
                <div class="body-header">
                    <div class="body-color" style="background: ${body.color};"></div>
                    <div class="body-name">${body.name}</div>
                </div>
                <div class="body-properties">
                    <div class="property-row">
                        <span class="property-label">Mass:</span>
                        <span class="property-value">${body.mass.toFixed(2)}</span>
                    </div>
                    <div class="property-row">
                        <span class="property-label">Position:</span>
                        <span class="property-value">(${body.x.toFixed(2)}, ${body.y.toFixed(2)})</span>
                    </div>
                    <div class="property-row">
                        <span class="property-label">Velocity:</span>
                        <span class="property-value">${Math.sqrt(body.vx**2 + body.vy**2).toFixed(2)}</span>
                    </div>
                </div>
            `;
            container.appendChild(bodyItem);
        });
    }

    updateInfo() {
        // Update time display
        document.getElementById('timeDisplay').textContent = simulation.time.toFixed(2);

        // Update energy display
        const energy = simulation.calculateEnergy();
        const energyChange = simulation.initialEnergy !== 0 
            ? ((energy - simulation.initialEnergy) / simulation.initialEnergy * 100).toFixed(2)
            : 0;
        document.getElementById('energyDisplay').textContent = 
            `${energy.toFixed(2)} (Δ${energyChange}%)`;

        // Update FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFrameTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
            document.getElementById('fpsDisplay').textContent = this.fps;
            this.frameCount = 0;
            this.lastFrameTime = now;
        }
    }
}

// ============================================
// MAIN LOOP
// ============================================

let simulation;
let renderer;
let uiController;
let analysisController;
let currentPreset = 'figure8';

function init() {
    try {
        console.log('Initializing Three-Body Simulator...');
        
        const canvas = document.getElementById('simulationCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found!');
        }
        
        console.log('Creating Simulation...');
        simulation = new Simulation();
        console.log('✓ Simulation created');
        
        console.log('Creating Renderer...');
        renderer = new Renderer(canvas);
        console.log('✓ Renderer created');
        
        console.log('Creating UI Controller...');
        uiController = new UIController();
        console.log('✓ UI Controller created');
        
        console.log('Creating Analysis Controller...');
        analysisController = new AnalysisController();
        console.log('✓ Analysis Controller created');

        console.log('Loading initial preset...');
        
        // Check for URL parameters to load shared configuration
        const params = new URLSearchParams(window.location.search);
        let loadedFromURL = false;
        
        // Check if we have full body parameters in URL
        if (params.has('m1') && params.has('x1') && params.has('y1') && params.has('vx1') && params.has('vy1')) {
            console.log('Loading configuration from URL parameters...');
            
            // Load custom bodies from URL
            const bodies = [];
            for (let i = 1; i <= 3; i++) {
                if (params.has(`m${i}`)) {
                    bodies.push({
                        name: `Body ${i}`,
                        mass: parseFloat(params.get(`m${i}`)),
                        x: parseFloat(params.get(`x${i}`)),
                        y: parseFloat(params.get(`y${i}`)),
                        vx: parseFloat(params.get(`vx${i}`)),
                        vy: parseFloat(params.get(`vy${i}`))
                    });
                }
            }
            
            if (bodies.length > 0) {
                simulation.loadBodies(bodies);
                loadedFromURL = true;
                console.log(`✓ Loaded ${bodies.length} bodies from URL`);
            }
        } else if (params.has('preset')) {
            const preset = params.get('preset');
            if (typeof PRESETS !== 'undefined' && PRESETS[preset]) {
                uiController.loadPreset(preset);
                loadedFromURL = true;
                console.log(`✓ Loaded preset "${preset}" from URL`);
            }
        }
        
        // Load default preset if nothing from URL
        if (!loadedFromURL) {
            uiController.loadPreset('figure8');
            console.log('✓ Initial preset loaded');
        }
        
        // Apply integrator from URL if specified
        if (params.has('integrator')) {
            const integrator = params.get('integrator');
            if (integrator === 'verlet' || integrator === 'rk4') {
                simulation.integrator = integrator;
                const integratorSelect = document.getElementById('integratorSelect');
                if (integratorSelect) {
                    integratorSelect.value = integrator;
                }
                console.log(`✓ Set integrator to "${integrator}" from URL`);
            }
        }
        
        // Apply time step from URL if specified
        if (params.has('dt')) {
            const dt = parseFloat(params.get('dt'));
            if (!isNaN(dt) && dt > 0 && dt < 1) {
                simulation.dt = dt;
                console.log(`✓ Set time step to ${dt} from URL`);
            }
        }

        // Start animation loop
        animate();
        console.log('✅ Simulator initialized successfully!');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        console.error('Error stack:', error.stack);
        alert('Error initializing simulator: ' + error.message + '\n\nCheck browser console (F12) for details.');
    }
}function animate() {
    if (!simulation || !renderer || !uiController || !analysisController) return;
    
    simulation.update();
    renderer.render();
    uiController.updateInfo();
    analysisController.update();
    requestAnimationFrame(animate);
}

// ============================================
// ANALYSIS CONTROLLER
// ============================================

class AnalysisController {
    constructor() {
        try {
            this.energyCanvas = document.getElementById('energyChart');
            this.angularMomentumCanvas = document.getElementById('angularMomentumChart');
            this.distanceCanvas = document.getElementById('distanceChart');
            
            this.energyCtx = this.energyCanvas ? this.energyCanvas.getContext('2d') : null;
            this.angularCtx = this.angularMomentumCanvas ? this.angularMomentumCanvas.getContext('2d') : null;
            this.distanceCtx = this.distanceCanvas ? this.distanceCanvas.getContext('2d') : null;
            
            this.poincareCanvas = null;
            this.poincareCtx = null;
            
            this.setupEventListeners();
            this.collapsed = false;
        } catch (error) {
            console.error('AnalysisController initialization error:', error);
        }
    }
    
    setupEventListeners() {
        // Toggle panel
        document.getElementById('toggleAnalysis').addEventListener('click', () => {
            this.collapsed = !this.collapsed;
            const content = document.getElementById('analysisContent');
            const btn = document.getElementById('toggleAnalysis');
            
            if (this.collapsed) {
                content.style.display = 'none';
                btn.textContent = '▶';
            } else {
                content.style.display = 'block';
                btn.textContent = '▼';
            }
        });
        
        // Export CSV
        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportCSV();
        });
        
        // Export JSON
        document.getElementById('exportJSON').addEventListener('click', () => {
            this.exportJSON();
        });
        
        // Share link
        document.getElementById('shareLink').addEventListener('click', () => {
            this.generateShareLink();
        });
        
        // Poincaré section toggle
        document.getElementById('enablePoincare').addEventListener('change', (e) => {
            const canvas = document.getElementById('poincareChart');
            canvas.style.display = e.target.checked ? 'block' : 'none';
            this.poincareCanvas = canvas;
            this.poincareCtx = canvas.getContext('2d');
        });
        
        // Lyapunov exponent toggle
        document.getElementById('enableLyapunov').addEventListener('change', (e) => {
            const display = document.getElementById('lyapunovDisplay');
            display.style.display = e.target.checked ? 'block' : 'none';
            simulation.lyapunovEnabled = e.target.checked;
            
            if (e.target.checked && simulation.shadowBodies.length === 0) {
                simulation.initializeLyapunov();
            }
        });
    }
    
    drawChart(ctx, canvas, data, color, label, showMultiple = false, colors = []) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 10;
        
        ctx.clearRect(0, 0, width, height);
        
        if (!data || data.length === 0) return;
        
        // Single line chart
        if (!showMultiple) {
            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min || 1;
            
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            data.forEach((value, i) => {
                const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
                const y = height - padding - ((value - min) / range) * (height - 2 * padding);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            
            ctx.stroke();
        } else {
            // Multiple lines
            const allValues = [...data.r12, ...data.r23, ...data.r13];
            const min = Math.min(...allValues);
            const max = Math.max(...allValues);
            const range = max - min || 1;
            
            const datasets = [
                { data: data.r12, color: colors[0] || '#ff6b6b' },
                { data: data.r23, color: colors[1] || '#4ecdc4' },
                { data: data.r13, color: colors[2] || '#ffe66d' }
            ];
            
            datasets.forEach(dataset => {
                ctx.beginPath();
                ctx.strokeStyle = dataset.color;
                ctx.lineWidth = 1.5;
                
                dataset.data.forEach((value, i) => {
                    const x = padding + (i / (dataset.data.length - 1)) * (width - 2 * padding);
                    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
                    
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                
                ctx.stroke();
            });
        }
    }
    
    update() {
        if (this.collapsed || !simulation || simulation.energyHistory.length === 0) return;
        if (!this.energyCtx || !this.angularCtx || !this.distanceCtx) return; // Safety check
        
        // Update energy chart
        this.drawChart(this.energyCtx, this.energyCanvas, simulation.energyHistory, '#6366f1', 'Energy');
        
        // Calculate and display energy drift
        const currentEnergy = simulation.energyHistory[simulation.energyHistory.length - 1];
        const drift = ((currentEnergy - simulation.initialEnergy) / Math.abs(simulation.initialEnergy)) * 100;
        document.getElementById('energyDrift').textContent = drift.toFixed(4) + '%';
        
        // Calculate max drift
        const maxDrift = Math.max(...simulation.energyHistory.map((e, i) => 
            Math.abs((e - simulation.initialEnergy) / Math.abs(simulation.initialEnergy)) * 100
        ));
        document.getElementById('maxDrift').textContent = maxDrift.toFixed(4) + '%';
        
        // Update angular momentum chart
        this.drawChart(this.angularCtx, this.angularMomentumCanvas, simulation.angularMomentumHistory, '#8b5cf6', 'L');
        const currentL = simulation.angularMomentumHistory[simulation.angularMomentumHistory.length - 1] || 0;
        document.getElementById('angularMomentum').textContent = currentL.toFixed(3);
        
        // Update distance chart
        this.drawChart(this.distanceCtx, this.distanceCanvas, simulation.distanceHistory, null, null, true, 
            ['#ff6b6b', '#4ecdc4', '#ffe66d']);
        
        // Update Poincaré section if enabled
        if (this.poincareCanvas && this.poincareCanvas.style.display !== 'none') {
            this.drawPoincareSection();
        }
        
        // Update Lyapunov exponent if enabled
        const lyapunovDisplay = document.getElementById('lyapunovDisplay');
        if (simulation.lyapunovEnabled && simulation.lyapunovSamples > 10) {
            const lambda = simulation.lyapunovSum / simulation.lyapunovSamples;
            document.getElementById('lyapunovValue').textContent = lambda.toFixed(6);
            
            const indicator = document.getElementById('chaosIndicator');
            if (lambda > 0.01) {
                indicator.textContent = '🌀 Chaotic (λ > 0)';
                indicator.style.color = '#ef4444';
            } else if (lambda < -0.01) {
                indicator.textContent = '⬇️ Stable (λ < 0)';
                indicator.style.color = '#10b981';
            } else {
                indicator.textContent = '➡️ Neutral (λ ≈ 0)';
                indicator.style.color = '#f59e0b';
            }
            
            // Show the display once we have data
            if (lyapunovDisplay && lyapunovDisplay.style.display !== 'block') {
                lyapunovDisplay.style.display = 'block';
            }
        } else if (simulation.lyapunovEnabled && lyapunovDisplay) {
            // Keep hidden until we have samples
            if (simulation.lyapunovSamples === 0) {
                lyapunovDisplay.style.display = 'none';
            }
        }
    }
    
    drawPoincareSection() {
        const ctx = this.poincareCtx;
        const canvas = this.poincareCanvas;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        if (simulation.poincarePoints.length === 0) return;
        
        // Find ranges
        const xValues = simulation.poincarePoints.map(p => p.x);
        const vxValues = simulation.poincarePoints.map(p => p.vx);
        
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const vxMin = Math.min(...vxValues);
        const vxMax = Math.max(...vxValues);
        
        const padding = 10;
        
        // Draw points
        ctx.fillStyle = '#6366f1';
        simulation.poincarePoints.forEach(point => {
            const x = padding + ((point.x - xMin) / (xMax - xMin || 1)) * (width - 2 * padding);
            const y = height - padding - ((point.vx - vxMin) / (vxMax - vxMin || 1)) * (height - 2 * padding);
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, height / 2);
        ctx.lineTo(width - padding, height / 2);
        ctx.moveTo(width / 2, padding);
        ctx.lineTo(width / 2, height - padding);
        ctx.stroke();
    }
    
    exportCSV() {
        if (!simulation || simulation.timeHistory.length === 0) {
            alert('No data to export. Run the simulation first.');
            return;
        }
        
        let csv = 'Time,Body1_X,Body1_Y,Body1_VX,Body1_VY,Body2_X,Body2_Y,Body2_VX,Body2_VY,Body3_X,Body3_Y,Body3_VX,Body3_VY,Energy,AngularMomentum\n';
        
        // Note: This exports current state, not full history
        // For full trajectory export, we'd need to store all positions
        simulation.bodies.forEach((body, i) => {
            if (i === 0) {
                csv += `${simulation.time},${body.x},${body.y},${body.vx},${body.vy}`;
            } else if (i < 3) {
                csv += `,${body.x},${body.y},${body.vx},${body.vy}`;
            }
        });
        csv += `,${simulation.calculateEnergy()},${simulation.calculateAngularMomentum()}\n`;
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `three-body-data-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    exportJSON() {
        if (!simulation || simulation.bodies.length === 0) {
            alert('No data to export. Run the simulation first.');
            return;
        }
        
        const data = {
            timestamp: new Date().toISOString(),
            preset: currentPreset,
            integrator: simulation.integrator,
            time: simulation.time,
            bodies: simulation.bodies.map(b => ({
                name: b.name,
                mass: b.mass,
                position: { x: b.x, y: b.y },
                velocity: { vx: b.vx, vy: b.vy },
                color: b.color
            })),
            energy: simulation.calculateEnergy(),
            angularMomentum: simulation.calculateAngularMomentum(),
            history: {
                time: simulation.timeHistory,
                energy: simulation.energyHistory,
                angularMomentum: simulation.angularMomentumHistory,
                distances: simulation.distanceHistory
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `three-body-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    generateShareLink() {
        if (!simulation || simulation.bodies.length === 0) {
            alert('No simulation to share. Load a preset first.');
            return;
        }
        
        const params = new URLSearchParams();
        
        // Include preset name for convenience
        if (currentPreset) {
            params.set('preset', currentPreset);
        }
        
        // Include integrator and time step
        params.set('integrator', simulation.integrator);
        params.set('dt', simulation.dt);
        
        // Encode all body parameters for perfect reproducibility
        simulation.bodies.forEach((body, i) => {
            params.set(`m${i+1}`, body.mass);
            params.set(`x${i+1}`, body.x);
            params.set(`y${i+1}`, body.y);
            params.set(`vx${i+1}`, body.vx);
            params.set(`vy${i+1}`, body.vy);
        });
        
        const url = window.location.origin + window.location.pathname + '?' + params.toString();
        
        navigator.clipboard.writeText(url).then(() => {
            const msg = 'Share link copied to clipboard!\n\nThis link includes all initial conditions for perfect reproducibility.\n\n' + url;
            alert(msg);
        }).catch(() => {
            prompt('Copy this link:', url);
        });
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    // Prevent default for our shortcuts
    const key = e.key.toLowerCase();
    
    switch(key) {
        case ' ': // Space - Play/Pause
            e.preventDefault();
            document.getElementById('playPauseBtn').click();
            break;
        case 'r': // R - Reset
            document.getElementById('resetBtn').click();
            break;
        case 'c': // C - Clear trails
            document.getElementById('clearTrailsBtn').click();
            break;
        case '+':
        case '=': // + - Increase speed
            e.preventDefault();
            const speedSlider = document.getElementById('speedSlider');
            speedSlider.value = Math.min(5, parseFloat(speedSlider.value) + 0.5);
            speedSlider.dispatchEvent(new Event('input'));
            break;
        case '-':
        case '_': // - - Decrease speed
            e.preventDefault();
            const speedSliderDec = document.getElementById('speedSlider');
            speedSliderDec.value = Math.max(0.1, parseFloat(speedSliderDec.value) - 0.5);
            speedSliderDec.dispatchEvent(new Event('input'));
            break;
        case 'g': // G - Toggle Center of Mass
            document.getElementById('centerOfMassCheckbox').click();
            break;
        case 'v': // V - Toggle velocity vectors
            document.getElementById('showVelocityCheckbox').click();
            break;
    }
});

// ============================================
// CONFIGURATION TABLE UPDATE
// ============================================

function updateConfigTable() {
    const tbody = document.getElementById('configTableBody');
    
    if (!simulation || simulation.bodies.length === 0) {
        tbody.style.display = 'none';
        return;
    }
    
    // Show table when simulation is active
    tbody.style.display = '';
    
    let html = '';
    simulation.bodies.forEach((body, i) => {
        const ke = 0.5 * body.mass * (body.vx ** 2 + body.vy ** 2);
        html += `
            <tr>
                <td><span style="color:${body.color};">●</span> ${body.name}</td>
                <td>${body.mass.toFixed(2)}</td>
                <td>(${body.x.toFixed(3)}, ${body.y.toFixed(3)})</td>
                <td>(${body.vx.toFixed(3)}, ${body.vy.toFixed(3)})</td>
                <td>${ke.toFixed(3)}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Update config table periodically
setInterval(() => {
    if (simulation && !simulation.paused) {
        updateConfigTable();
        checkPeriodicity();
    }
}, 100);

// ============================================
// PERIOD CHECKING
// ============================================

function checkPeriodicity() {
    if (!simulation || simulation.time < 10) return; // Need some run time
    
    try {
        const period = simulation.detectPeriod();
        const badge = document.getElementById('periodBadge');
        if (!badge) return;
        
        if (period && period > 0) {
            const periodValueElem = document.getElementById('periodValue');
            if (periodValueElem) {
                periodValueElem.textContent = period.toFixed(2) + ' years';
            }
            
            // Add tooltip with confidence info
            if (simulation.periodConfidence) {
                const conf = simulation.periodConfidence;
                const posErr = (conf.positionError / conf.threshold * 100).toFixed(1);
                const velErr = (conf.velocityError / conf.threshold * 100).toFixed(1);
                badge.title = `Period detected with:\nPosition match: ${posErr}% of threshold\nVelocity match: ${velErr}% of threshold\n(Lower is better)`;
            }
            
            badge.style.display = 'flex';
        } else if (simulation.time > 50 && !period) {
            // Hide badge after enough time if no period detected
            badge.style.display = 'none';
        }
    } catch (error) {
        console.warn('Period detection error:', error);
    }
}

// ============================================
// COPY FUNCTIONS
// ============================================

function copyICAsJSON() {
    try {
        if (typeof PRESETS === 'undefined' || !PRESETS[currentPreset]) {
            alert('No preset loaded');
            return;
        }
        
        const preset = PRESETS[currentPreset];
        const data = {
            name: preset.name || currentPreset,
            integrator: simulation.integrator,
            bodies: preset.bodies.map(b => ({
                name: b.name,
                mass: b.mass,
                position: { x: b.x, y: b.y },
                velocity: { vx: b.vx, vy: b.vy },
                color: b.color
            }))
        };
        
        const json = JSON.stringify(data, null, 2);
        
        navigator.clipboard.writeText(json).then(() => {
            alert('✓ Initial conditions copied as JSON to clipboard!');
        }).catch(() => {
            prompt('Copy this JSON:', json);
        });
    } catch (error) {
        console.error('Copy JSON error:', error);
        alert('Error copying data: ' + error.message);
    }
}

function copyICAsText() {
    try {
        if (typeof PRESETS === 'undefined' || !PRESETS[currentPreset]) {
            alert('No preset loaded');
            return;
        }
        
        const preset = PRESETS[currentPreset];
        let text = `${preset.name || currentPreset}\n`;
        text += '='.repeat(50) + '\n\n';
        
        preset.bodies.forEach((body, i) => {
            text += `${body.name}:\n`;
            text += `  Mass:     ${body.mass.toFixed(6)}\n`;
            text += `  Position: (${body.x.toFixed(6)}, ${body.y.toFixed(6)})\n`;
            text += `  Velocity: (${body.vx.toFixed(6)}, ${body.vy.toFixed(6)})\n\n`;
        });
        
        navigator.clipboard.writeText(text).then(() => {
            alert('✓ Initial conditions copied as text to clipboard!');
        }).catch(() => {
            prompt('Copy this text:', text);
        });
    } catch (error) {
        console.error('Copy text error:', error);
        alert('Error copying data: ' + error.message);
    }
}

// Start the application when the page loads
window.addEventListener('load', init);
