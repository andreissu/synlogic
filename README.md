# synlogic
LogicGate Designer — Modular Biosensor Circuit Builder

## Overview

This repository contains a prototype drag-and-drop interface for assembling logical biosensor
programs alongside a Python API that simulates the behaviour of the resulting circuits. The goal is
to help ImmunoSense teams rapidly sketch designs such as "release IL-10 only when both nitrate and
tetrathionate are present" using characterised promoter response data.

### Frontend

* **Stack:** React + D3.js (Vite tooling)
* **Features:**
  * Palette of logic gates (AND/OR/NOT/etc.) to drag onto a canvas
  * Manual wiring between nodes to describe signal flow
  * Calls into the backend for truth-table simulation, promoter compatibility and construct export

### Backend

* **Stack:** FastAPI
* **Features:**
  * `/logic-table` – compute digital truth tables for the designed network
  * `/promoter-compatibility` – return promoter suggestions for selected inputs and outputs
  * `/construct-export` – assemble a lightweight construct map suitable for SBOL/Benshling import

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

The API will be available on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to interact with the builder. The frontend expects the backend
to be running on `http://localhost:8000` (override via `VITE_API_BASE`).

### Exporting designs

Use the **Export construct map** button once a design is assembled to download a JSON representation
containing promoter suggestions and placeholder sequence templates.
