# DEGREE OR DIE — The HUJI Survival Exam

> You enrolled at HUJI. Your degree fights back.

A top-down arena shooter with light bullet-hell elements, set on a glowing night-time version of the Givat Ram campus. You defeat six lecturers from Mathematics, Physics and Computer Science, collect their course credits (30 in total) and graduate.

**Play:** https://jan-t99.github.io/degree-or-die/

## Controls
| Action | Input |
| --- | --- |
| Move | WASD / Arrow keys |
| Aim | Mouse |
| Shoot | Hold left click or Space |
| Start / restart | Button or Enter |

## The lecturers (fictional)
| Lecturer | Course | Attack |
| --- | --- | --- |
| Prof. Limit | Calculus I | Radial bursts of ∫ Σ ∂ ∞ |
| Dr. Eigenvector | Linear Algebra | Vectors, three-way spreads |
| Prof. Newton | Mechanics | Lobbed apples that fall and bounce |
| Dr. Schrödinger | Quantum Physics | Wavy ψ / \|0⟩ / \|1⟩ projectiles |
| Prof. Recursion | Intro to CS | Brackets that split into two, then split again |
| Dr. Segfault | Data Structures | Rapid bursts of `ERR` / `NULL` / `SIGSEGV` |
| Dr. Probability | Statistics | Random scatter of dice and σ |
| Prof. Maxwell | Electromagnetism | Double spiral of ⚡ E B |
| Dr. Complexity | Algorithms | Slow homing `O(n²)` / `NP` |

Stages: **Year 1** (Limit, Newton, Recursion) → **Year 2** (Eigenvector, Schrödinger, Segfault) → **Year 3 — Finals** (Probability, Maxwell, Complexity). Edit `STAGES` in `game.js` to change them.

All lecturer data (names, courses, lines, attacks, stats) lives in the `LECTURERS` array at the top of `game.js`.

## Tech
- Plain HTML, CSS and JavaScript with Canvas 2D. No build step, no dependencies, no backend.
- Every graphic is drawn in code (no image files are needed).
- Runs as a static site on GitHub Pages.

To run locally, open `index.html`, or run `python3 -m http.server` and visit `localhost:8000`.

Built in an agentic programming class at the Hebrew University with Claude Code.
