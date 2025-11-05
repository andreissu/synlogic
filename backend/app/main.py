"""FastAPI application powering the SynLogic circuit designer."""
from __future__ import annotations

from typing import List, Sequence

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

from .logic import Gate as GateModel
from .logic import LogicEvaluationError, build_construct_map, compute_truth_table, suggest_promoters

app = FastAPI(title="SynLogic Circuit API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Gate(BaseModel):
    id: str
    type: str
    inputs: List[str] = Field(default_factory=list)

    @validator("type")
    def normalise_type(cls, value: str) -> str:
        return value.upper()


class LogicRequest(BaseModel):
    inputs: List[str]
    gates: List[Gate]
    output_gate: str

    @validator("inputs")
    def ensure_unique_inputs(cls, value: Sequence[str]) -> Sequence[str]:
        if len(set(value)) != len(value):
            raise ValueError("Inputs must be unique")
        return value


class PromoterRequest(BaseModel):
    signals: List[str]
    output: str


class ConstructRequest(LogicRequest):
    output: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/logic-table")
def logic_table(request: LogicRequest) -> dict[str, List[dict[str, int]]]:
    try:
        truth_table = compute_truth_table(
            request.inputs,
            [GateModel(g.id, g.type, g.inputs) for g in request.gates],
            request.output_gate,
        )
    except LogicEvaluationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"truth_table": truth_table}


@app.post("/promoter-compatibility")
def promoter_compatibility(request: PromoterRequest) -> dict[str, List[dict[str, str]]]:
    suggestions = suggest_promoters(request.signals, request.output)
    if not suggestions:
        raise HTTPException(status_code=404, detail="No promoter data found for the provided signals")
    return {"suggestions": suggestions}


@app.post("/construct-export")
def construct_export(request: ConstructRequest) -> dict[str, object]:
    try:
        construct = build_construct_map(
            request.inputs,
            request.output,
            [GateModel(g.id, g.type, g.inputs) for g in request.gates],
        )
    except LogicEvaluationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"construct": construct}
