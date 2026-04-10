# 📊 Šuvakov-Dmitrašinović Solutions Guide

## About These Solutions

In 2013, Milovan Šuvakov and Veljko Dmitrašinović discovered **13 new families** of three-body problem solutions, representing a breakthrough in understanding these complex systems. The simulator now includes **8 of these solutions** that were tested in Ibrahim El-Serwy's research paper (2024).

## The 8 Solutions Implemented

### 1. Figure-8 ⭐ **[STABLE]**
**Initial Conditions:**
- Body 1: x=-1, y=0, vx=0.347111, vy=0.532728
- Body 2: x=1, y=0, vx=0.347111, vy=0.532728  
- Body 3: x=0, y=0, vx=-0.694222, vy=-1.065456

**Stability:** ✅ **Most Stable**
- Stable with 4th body mass: 0.001 - 0.01
- Shows remarkable resilience to perturbations
- Original discovery by Chris Moore (1993)
- Exhibits near-perfect symmetry

**Why it's special:** The figure-8 is one of the most famous periodic solutions. Three equal masses chase each other along a figure-eight path with zero angular momentum.

---

### 2. Butterfly-I 🦋 **[UNSTABLE]**
**Initial Conditions:**
- Body 1: x=-1, y=0, vx=0.306893, vy=0.125507
- Body 2: x=1, y=0, vx=0.306893, vy=0.125507
- Body 3: x=0, y=0, vx=-0.613786, vy=-0.251014

**Stability:** ❌ **Unstable**
- Fails with any added 4th body
- Very sensitive to perturbations
- Beautiful but fragile

**Why it's interesting:** Despite its instability, it demonstrates beautiful butterfly-wing patterns before disruption.

---

### 3. Butterfly-II 🦋 **[MODERATELY STABLE]**
**Initial Conditions:**
- Body 1: x=-1, y=0, vx=0.392955, vy=0.097579
- Body 2: x=1, y=0, vx=0.392955, vy=0.097579
- Body 3: x=0, y=0, vx=-0.785910, vy=-0.195158

**Stability:** ✅ **Stable (Limited Range)**
- Stable with 4th body mass: 0.001 - 0.0019
- Shows strong gravitational binding within range
- Exhibits compression due to added mass

**Why it's interesting:** Shows how slight variations in initial conditions can dramatically affect stability compared to Butterfly-I.

---

### 4. Bumblebee 🐝 **[STABLE WITH GAPS]**
**Initial Conditions:**
- Body 1: x=-1, y=0, vx=0.184279, vy=0.587188
- Body 2: x=1, y=0, vx=0.184279, vy=0.587188
- Body 3: x=0, y=0, vx=-0.368558, vy=-1.174376

**Stability:** ⚠️ **Mostly Stable**
- Stable with 4th body mass: 0.001 - 0.0031
- Islands of instability at: {0.0021, 0.0023, 0.0025, 0.0028, 0.003}
- Shows "strange behavior" with chaotic pockets

**Why it's interesting:** Demonstrates non-linear stability - stable regions interspersed with chaotic ones, like islands in an ocean.

---

### 5. Dragonfly 🦟 **[STABLE]**
**Initial Conditions:**
- Body 1: x=-1, y=0, vx=0.080584, vy=0.588836
- Body 2: x=1, y=0, vx=0.080584, vy=0.588836
- Body 3: x=0, y=0, vx=-0.161168, vy=-1.177672

**Stability:** ✅ **Stable (Good Range)**
- Stable with 4th body mass: 0.001 - 0.0021
- Distorted but maintains gravitational binding
- Reliable within its stability range

**Why it's interesting:** Shows consistent behavior within stability range despite significant deformation from original configuration.

---

### 6. Goggles 🥽 **[VERY UNSTABLE]**
**Initial Conditions:**
- Body 1: x=-1, y=0, vx=0.083300, vy=0.127889
- Body 2: x=1, y=0, vx=0.083300, vy=0.127889
- Body 3: x=0, y=0, vx=-0.166600, vy=-0.255778

**Stability:** ❌ **Very Unstable**
- Instantly unstable with any 4th body
- Splits into 2-body + 2 single-body systems
- Extremely sensitive to perturbations

**Why it's interesting:** Perfect example of a solution that exists mathematically but is too fragile for real-world conditions.

---

### 7. Moth-I 🦋 **[STABLE WITH GAPS]**
**Initial Conditions:**
- Body 1: x=-1, y=0, vx=0.464445, vy=0.396060
- Body 2: x=1, y=0, vx=0.464445, vy=0.396060
- Body 3: x=0, y=0, vx=-0.928890, vy=-0.792120

**Stability:** ✅ **Stable (Best Range)**
- Stable with 4th body mass: 0.001 - 0.0041
- Unstable points: {0.0035, 0.0036}
- Maintains overall shape remarkably well
- Bodies move faster leading to condensed patterns

**Why it's interesting:** Longest stability range among the tested solutions, making it a candidate for real astronomical systems.

---

### 8. Moth-II 🦋 **[EXTREMELY UNSTABLE]**
**Initial Conditions:**
- Body 1: x=-1, y=0, vx=0.439166, vy=0.452968
- Body 2: x=1, y=0, vx=0.439166, vy=0.452968
- Body 3: x=0, y=0, vx=-0.878332, vy=-0.905936

**Stability:** ❌ **Extremely Unstable**
- Only stable at masses: {0.0011, 0.0012}
- Smallest stability range of all solutions
- Fails outside tiny mass range

**Why it's interesting:** Shows extreme sensitivity - viable only under nearly perfect conditions.

---

## Stability Summary Table

| Solution | Stability Range | Category |
|----------|----------------|----------|
| **Figure-8** | 0.001 - 0.01 | ✅ Very Stable |
| **Butterfly-I** | None | ❌ Unstable |
| **Butterfly-II** | 0.001 - 0.0019 | ⚠️ Moderately Stable |
| **Bumblebee** | 0.001 - 0.0031* | ⚠️ Stable with gaps |
| **Dragonfly** | 0.001 - 0.0021 | ✅ Stable |
| **Goggles** | None | ❌ Very Unstable |
| **Moth-I** | 0.001 - 0.0041* | ✅ Very Stable |
| **Moth-II** | 0.0011 - 0.0012 | ❌ Extremely Unstable |

\* Has islands of instability within range

## Key Findings from the Research

### What Was Tested:
1. **Mass variation** of a 4th body (0.001 to 0.01)
2. **Position variation** of 4th body (chaotic results)
3. **Velocity variation** of 4th body (chaotic results)

### Key Insights:
- ⚠️ **All solutions are significantly affected** by adding even a tiny 4th body (0.1% mass)
- 📊 **Non-linear stability** - islands of stability exist among unstable regions
- 🌀 **Position and velocity changes** of 4th body lead to complete chaos
- 🔬 **Equal mass assumption** (mi = 1) used throughout
- ⏱️ **Long simulation times** (up to 670 time units) to verify stability

## Understanding Stability

**Stable System:**
- Bodies remain gravitationally bound
- May show deformation but maintain configuration
- Predictable over long time periods

**Unstable System:**
- Bodies escape to infinity
- System splits apart
- Chaotic, unpredictable behavior

**Measurement:**
Distance between bodies at final time:
- **< 10 units** = Stable
- **> 10 units** = Unstable

## Real-World Implications

### Why This Matters:
1. **Trinary star systems** with planets
2. **Asteroid dynamics** in solar system
3. **Gravitational wave production** from chaotic systems
4. **Understanding stability** in n-body problems

### Could These Exist in Nature?
- **Figure-8**: Most likely candidate
- **Moth-I**: Good chance in isolated systems
- **Dragonfly**: Possible in controlled environments
- **Others**: Unlikely due to environmental perturbations

## Try It Yourself!

1. **Select a preset** from the control panel
2. **Click Play** and watch the orbit
3. **Compare stable vs unstable** solutions
4. **Use custom editor** to test your own configurations
5. **Experiment** with adding slight perturbations

## References

- **Šuvakov, M., & Dmitrašinović, V. (2013).** "Three Classes of Newtonian Three-Body Planar Periodic Orbits." Physical Review Letters, 110(11).
- **El-Serwy, I. E. (2024).** "Stability of Three-body Problem Solutions with a Fourth Body." STEM Research Paper.
- **Three-body Gallery:** http://three-body.ipb.ac.rs/

---

**Explore these fascinating solutions and discover the delicate balance between order and chaos!** 🌌
