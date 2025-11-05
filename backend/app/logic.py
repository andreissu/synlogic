"""Core logic evaluation utilities for biosensor circuit designs."""
from __future__ import annotations

from dataclasses import dataclass
from itertools import product
from typing import Dict, Iterable, List, Sequence


@dataclass
class Gate:
    """Representation of a logic gate in the circuit graph."""

    id: str
    type: str
    inputs: Sequence[str]


class LogicEvaluationError(Exception):
    """Raised when the logic graph cannot be evaluated."""


def evaluate_gate(gate_type: str, values: Sequence[int]) -> int:
    """Evaluate a single logic gate for the provided input values."""

    gate_type = gate_type.upper()
    if gate_type == "AND":
        return int(all(values))
    if gate_type == "OR":
        return int(any(values))
    if gate_type == "NOT":
        if len(values) != 1:
            raise LogicEvaluationError("NOT gate expects a single input")
        return int(not values[0])
    if gate_type == "NAND":
        return int(not all(values))
    if gate_type == "NOR":
        return int(not any(values))
    if gate_type == "XOR":
        return int(sum(values) % 2 == 1)
    if gate_type in {"OUTPUT", "BUFFER"}:
        if not values:
            raise LogicEvaluationError("Output gate requires at least one inbound connection")
        return int(values[-1])
    raise LogicEvaluationError(f"Unsupported gate type: {gate_type}")


def evaluate_circuit(
    inputs: Sequence[str],
    gates: Sequence[Gate],
    output_gate: str,
    input_assignment: Dict[str, int],
) -> int:
    """Evaluate the circuit for a particular input assignment."""

    values: Dict[str, int] = dict(input_assignment)
    gate_lookup: Dict[str, Gate] = {gate.id: gate for gate in gates}

    def resolve(node_id: str) -> int:
        if node_id in values:
            return values[node_id]
        if node_id not in gate_lookup:
            raise LogicEvaluationError(f"Unknown gate or input: {node_id}")
        gate = gate_lookup[node_id]
        resolved_inputs = [resolve(source) for source in gate.inputs]
        gate_value = evaluate_gate(gate.type, resolved_inputs)
        values[gate.id] = gate_value
        return gate_value

    return resolve(output_gate)


def compute_truth_table(
    inputs: Sequence[str],
    gates: Sequence[Gate],
    output_gate: str,
) -> List[Dict[str, int]]:
    """Compute the full truth table for a circuit design."""

    if not inputs:
        raise LogicEvaluationError("At least one input is required to compute a truth table")

    rows: List[Dict[str, int]] = []
    for assignment in product([0, 1], repeat=len(inputs)):
        mapping = dict(zip(inputs, assignment))
        output_value = evaluate_circuit(inputs, gates, output_gate, mapping)
        rows.append({**mapping, "output": output_value})
    return rows


def suggest_promoters(signals: Iterable[str], output: str) -> List[Dict[str, str]]:
    """Return simple promoter-part suggestions for the provided signals."""

    library = {
        "nitrate": {
            "promoter": "PnarG",
            "compatible_outputs": ["GFP", "IL-10"],
            "notes": "Well-characterised nitrate responsive promoter",
        },
        "tetrathionate": {
            "promoter": "PttrSR",
            "compatible_outputs": ["GFP"],
            "notes": "Best paired with fluorescent reporters",
        },
        "lactate": {
            "promoter": "PlacI",
            "compatible_outputs": ["IL-10", "LacZ"],
            "notes": "Repressible promoter supporting inversion logic",
        },
    }

    suggestions: List[Dict[str, str]] = []
    for signal in signals:
        entry = library.get(signal.lower())
        if not entry:
            continue
        is_compatible = output in entry["compatible_outputs"]
        suggestions.append(
            {
                "signal": signal,
                "promoter": entry["promoter"],
                "compatible": "yes" if is_compatible else "partial",
                "notes": entry["notes"],
            }
        )
    return suggestions


def build_construct_map(
    inputs: Sequence[str],
    output: str,
    gates: Sequence[Gate],
) -> Dict[str, List[Dict[str, str]]]:
    """Generate a simplistic construct map for downstream CAD tools."""

    promoter_map = suggest_promoters(inputs, output)
    modules: List[Dict[str, str]] = []
    for gate in gates:
        modules.append(
            {
                "module": gate.id,
                "type": gate.type,
                "sequence_template": f"// placeholder sequence for {gate.type} gate",
            }
        )
    modules.append(
        {
            "module": "output",
            "type": output,
            "sequence_template": f"ATG... // coding sequence for {output}",
        }
    )

    return {
        "promoters": promoter_map,
        "modules": modules,
    }
