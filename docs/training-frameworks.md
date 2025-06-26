# Training Framework Selected for AI Cycling Coach

We will begin with **one proven framework** that suits the majority of endurance-cycling scenarios.

| Framework | Core Principle | Typical Zone Distribution | Best For |
|-----------|----------------|---------------------------|----------|
| **Polarized (80/20)** | 80 % of training time in low-intensity (Z1–Z2) and 20 % in high-intensity (Z4+). Mid-intensity (Z3) is largely avoided. Popularised by Stephen Seiler. | Z1 + Z2 ≈ 80 %, Z4–Z7 ≈ 20 % | Building aerobic base while still improving VO₂-max for endurance cyclists of all levels. |

## Why Polarized?
1. **Strong evidence base** – backed by peer-reviewed research and elite coaching practice.
2. **Simplicity** – easy to communicate ("go easy most of the time, hard occasionally") and track via time-in-zone metrics we already store.
3. **Scalability** – works for novices through to professionals; volume can be scaled while keeping the 80/20 split.

## Implementation Notes
1. **Plan Generation**
   - The training-plan generator (Task 4.3) will target weekly zone totals that reach ≈ 80 % Z1–Z2 and ≈ 20 % Z4+.
   - Session count per week is derived from recent consistency (see generator docs).
2. **Feedback Rules**
   - If the athlete accumulates too much time in Z3 (“grey zone”), the coach will suggest easier endurance rides or discrete VO₂ intervals.
3. **Extensibility**
   - Additional frameworks (e.g., Sweet-Spot) can be added later by extending the JSON definitions and plan logic. 