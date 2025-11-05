import { useMemo, useState } from 'react';
import axios from 'axios';
import DesignerCanvas, { CircuitDesign, GateTemplate } from './components/DesignerCanvas';
import LogicSummary from './components/LogicSummary';
import PromoterPanel from './components/PromoterPanel';

const DEFAULT_GATES: GateTemplate[] = [
  { type: 'INPUT', label: 'Input Signal' },
  { type: 'AND', label: 'AND' },
  { type: 'OR', label: 'OR' },
  { type: 'NOT', label: 'NOT' },
  { type: 'NAND', label: 'NAND' },
  { type: 'NOR', label: 'NOR' },
  { type: 'XOR', label: 'XOR' },
  { type: 'OUTPUT', label: 'Output Effector' },
];

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

function App() {
  const [design, setDesign] = useState<CircuitDesign>({ nodes: [], links: [] });
  const [truthTable, setTruthTable] = useState<Record<string, number>[]>([]);
  const [promoterSuggestions, setPromoterSuggestions] = useState<any[]>([]);
  const [exportData, setExportData] = useState<any | null>(null);
  const inputs = useMemo(
    () => design.nodes.filter((node) => node.type === 'INPUT').map((node) => node.label),
    [design],
  );
  const output = useMemo(
    () => design.nodes.find((node) => node.type === 'OUTPUT')?.label ?? 'GFP',
    [design],
  );

  const fetchTruthTable = async () => {
    if (!design.nodes.length) {
      return;
    }

    const logicPayload = {
      inputs: design.nodes.filter((node) => node.type === 'INPUT').map((node) => node.id),
      output_gate: design.nodes.find((node) => node.type === 'OUTPUT')?.id ?? '',
      gates: design.nodes
        .filter((node) => node.type !== 'INPUT')
        .map((node) => ({
          id: node.id,
          type: node.type,
          inputs: design.links.filter((link) => link.target === node.id).map((link) => link.source),
        })),
    };

    if (!logicPayload.output_gate) {
      return;
    }

    try {
      const { data } = await axios.post(`${API_BASE}/logic-table`, logicPayload);
      setTruthTable(data.truth_table);
    } catch (error) {
      console.error('Failed to compute truth table', error);
      alert('Unable to compute truth table. Please ensure the circuit is fully connected.');
    }
  };

  const fetchPromoters = async () => {
    if (!inputs.length) {
      return;
    }
    try {
      const { data } = await axios.post(`${API_BASE}/promoter-compatibility`, {
        signals: inputs,
        output,
      });
      setPromoterSuggestions(data.suggestions);
    } catch (error) {
      console.error('Failed to fetch promoter compatibility', error);
      alert('No promoter compatibility data available for the current inputs.');
    }
  };

  const fetchConstruct = async () => {
    if (!design.nodes.length) {
      return;
    }

    const logicPayload = {
      inputs: design.nodes.filter((node) => node.type === 'INPUT').map((node) => node.id),
      output_gate: design.nodes.find((node) => node.type === 'OUTPUT')?.id ?? '',
      gates: design.nodes
        .filter((node) => node.type !== 'INPUT')
        .map((node) => ({
          id: node.id,
          type: node.type,
          inputs: design.links.filter((link) => link.target === node.id).map((link) => link.source),
        })),
      output,
    };
    if (!logicPayload.output_gate) {
      return;
    }
    try {
      const { data } = await axios.post(`${API_BASE}/construct-export`, logicPayload);
      setExportData(data.construct);
      const blob = new Blob([JSON.stringify(data.construct, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'synlogic-construct.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export construct map', error);
      alert('Unable to export construct map. Please verify the circuit connections.');
    }
  };

  return (
    <div className="app">
      <header>
        <h1>SynLogic Circuit Designer</h1>
        <p>Prototype drag-and-drop tool for building living cell logic programs.</p>
      </header>
      <main className="layout">
        <DesignerCanvas
          templates={DEFAULT_GATES}
          design={design}
          onDesignChange={(updated) => setDesign(updated)}
        />
        <section className="side-panel">
          <div className="panel">
            <h2>Simulation</h2>
            <button type="button" onClick={fetchTruthTable}>
              Compute truth table
            </button>
            <LogicSummary truthTable={truthTable} />
          </div>
          <div className="panel">
            <h2>Promoter suggestions</h2>
            <button type="button" onClick={fetchPromoters}>
              Check compatibility
            </button>
            <PromoterPanel suggestions={promoterSuggestions} />
          </div>
          <div className="panel">
            <h2>Export</h2>
            <button type="button" onClick={fetchConstruct}>
              Export construct map
            </button>
            {exportData ? (
              <pre className="export-preview">{JSON.stringify(exportData, null, 2)}</pre>
            ) : (
              <p>No export generated yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
