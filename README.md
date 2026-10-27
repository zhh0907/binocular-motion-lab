# Binocular Motion Lab

Browser-based binocular eye-motion simulation and gaze replay by [Honghao Zhao](https://zhh0907.github.io/).

**[Open live demo](https://zhh0907.github.io/binocular-motion-lab/)** · [User guide](https://zhh0907.github.io/binocular-motion-lab/guide.html) · [Camera calibration](https://zhh0907.github.io/binocular-motion-lab/calibration-guide.html)

## Overview

Explore simulated eye movements, replay public gaze recordings, and inspect model comparisons in an interactive 3D workspace. This repository contains the browser demo and bundled inference assets; it is not a complete training-code release.

- Interactive binocular simulation, target controls, and gaze replay.
- Model comparisons and plots available through **Tools → Results**.
- Optional camera controls and screen/camera calibration.
- Responsive workspace for desktop and mobile browsers.
- Numbered, persistent virtual-patient libraries with stratified sampling and deterministic horizontal impairment candidates. No NIHSS scores are assigned.

## Virtual patients

Open **Tools → Setup → Virtual patients** (desktop: settings sidebar). Select a pattern and side, enter **30**, and generate a batch. Enter **17** or **P000017** to activate that saved patient for all target inputs. New batches append IDs; existing parameters do not change. Export the library JSON for backup or transfer to another browser. The normal reference can be restored with one button.

[Patient workflow and mathematical model](https://zhh0907.github.io/binocular-motion-lab/patient-guide.html) · [中文说明](PATIENT_MODEL.zh-CN.md)

The layer is a directional drive-saturation / overdamped-response approximation. Vertical output is preserved, and arbitrary target motion is supported. Parameters and ranges are engineering exploration choices, not validated clinical cutoffs. Exported run JSON includes the patient, initial state and reference-angle sequence for reproduction; CSV includes both reference and altered angles. Patient parameters are fixed, but different finger paths produce different trajectories. See the guide for reset, storage and 120-second export-buffer behavior.

Checks: `node --test tests/patients.test.mjs`; browser integration: `node tests/patients-browser.cjs` (Playwright + Chrome). These checks do not validate medical realism or physical camera performance.

## Quick start

Open the live demo; no installation or GitHub account is needed. Use **Tools** for model selection, replay, calibration, and results. Camera access is optional and requires HTTPS or localhost.

For local use, serve this repository with a static HTTP server, for example:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000/`. Keep `vendor/`, `recordings/`, and the model JSON files beside the application. Do not open `index.html` directly through a file URL.

## Repository map

| Files | Purpose |
| --- | --- |
| `index.html`, `app.js`, `engine.js` | Browser application and simulation |
| `models.json`, `model.json` | Bundled model assets |
| `comparison.json`, `report.json` | Evaluation summaries |
| `recordings/` | Public gaze replay excerpts |
| `camera*.js`, `calibration*.js` | Camera and calibration utilities |
| `guide.html`, `calibration-guide.html` | Detailed usage instructions |
| `vendor/`, `THIRD_PARTY_NOTICES.txt` | Bundled dependencies and attribution |

## Data and interpretation

Replay material includes attributed public GazeBaseVR excerpts. See the in-app guide and third-party notices for data provenance. Model comparisons are research results, not evidence of clinical validity. Simulated eye motion and uncalibrated camera controls should not be interpreted as calibrated clinical measurements.

Camera processing runs locally in the browser. Front-camera previews are mirrored; calibrated geometry and exported physical coordinates are unchanged. Mobile-emulation checks do not establish compatibility or performance on physical iPhone/Android devices.

## Deployment

The live demo is hosted on GitHub Pages. Preserve `.nojekyll` and the complete asset structure. No backend, npm build, or API key is required for the published demo. Optional Python calibration tools are separate from browser operation.
