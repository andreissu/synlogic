import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import GatePalette from './GatePalette';

export type GateTemplate = {
  type: string;
  label: string;
};

export type NodeDatum = {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
};

export type LinkDatum = {
  source: string;
  target: string;
};

export type CircuitDesign = {
  nodes: NodeDatum[];
  links: LinkDatum[];
};

type DesignerCanvasProps = {
  templates: GateTemplate[];
  design: CircuitDesign;
  onDesignChange: (design: CircuitDesign) => void;
};

const nodeColour = (type: string) => {
  switch (type) {
    case 'INPUT':
      return '#2f855a';
    case 'OUTPUT':
      return '#2b6cb0';
    case 'NOT':
      return '#d97706';
    default:
      return '#4c51bf';
  }
};

const DesignerCanvas = ({ templates, design, onDesignChange }: DesignerCanvasProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const idCounter = useRef<number>(design.nodes.length + 1);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }
    const svg = d3.select(svgRef.current);

    const dragBehaviour = d3
      .drag<SVGGElement, NodeDatum>()
      .on('drag', function drag(event, d) {
        d.x += event.dx;
        d.y += event.dy;
        d3.select(this).attr('transform', `translate(${d.x}, ${d.y})`);
        onDesignChange({ ...design, nodes: [...design.nodes] });
      });

    const nodeSelection = svg
      .select('.nodes')
      .selectAll<SVGGElement, NodeDatum>('g.node')
      .data(design.nodes, (d: any) => d.id);

    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .call(dragBehaviour);

    nodeEnter
      .append('circle')
      .attr('r', 32)
      .attr('fill', (d) => nodeColour(d.type))
      .attr('stroke', '#1a202c')
      .attr('stroke-width', 2);

    nodeEnter
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', 5);

    nodeSelection
      .merge(nodeEnter)
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

    nodeSelection.exit().remove();

    const lineGenerator = d3
      .line<[number, number]>()
      .curve(d3.curveBundle.beta(1));

    const links = design.links.map((link) => {
      const source = design.nodes.find((node) => node.id === link.source);
      const target = design.nodes.find((node) => node.id === link.target);
      if (!source || !target) {
        return null;
      }
      return {
        id: `${link.source}-${link.target}`,
        path: lineGenerator([
          [source.x, source.y],
          [(source.x + target.x) / 2, source.y - 40],
          [target.x, target.y],
        ]) ?? '',
      };
    });

    const linkSelection = svg
      .select('.links')
      .selectAll<SVGPathElement, { id: string; path: string }>('path.link')
      .data(links.filter(Boolean) as { id: string; path: string }[], (d) => d.id);

    const linkEnter = linkSelection
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', '#4a5568')
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    linkSelection.merge(linkEnter).attr('d', (d) => d.path);
    linkSelection.exit().remove();
  }, [design, onDesignChange]);

  const handleDrop = (type: string, x: number, y: number) => {
    const id = (() => {
      if (type === 'INPUT') {
        return `signal-${idCounter.current}`;
      }
      if (type === 'OUTPUT') {
        return `output-${idCounter.current}`;
      }
      return `${type.toLowerCase()}-${idCounter.current}`;
    })();
    idCounter.current += 1;
    const label = (() => {
      if (type === 'INPUT') {
        return `signal-${idCounter.current - 1}`;
      }
      if (type === 'OUTPUT') {
        return 'GFP';
      }
      return `${type}-${idCounter.current - 1}`;
    })();

    const node: NodeDatum = {
      id,
      type,
      label,
      x,
      y,
    };
    onDesignChange({ ...design, nodes: [...design.nodes, node] });
  };

  const handleLinkCreation = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return;
    }
    const exists = design.links.some(
      (link) => link.source === sourceId && link.target === targetId,
    );
    if (exists) {
      return;
    }
    onDesignChange({ ...design, links: [...design.links, { source: sourceId, target: targetId }] });
  };

  const paletteTemplates = useMemo(
    () => templates.filter((template) => template.type !== 'OUTPUT' || design.nodes.every((node) => node.type !== 'OUTPUT')),
    [templates, design.nodes],
  );

  return (
    <section className="canvas-wrapper">
      <GatePalette templates={paletteTemplates} />
      <svg
        ref={svgRef}
        className="canvas"
        width={640}
        height={480}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const type = event.dataTransfer?.getData('application/gate-type');
          if (!type) {
            return;
          }
          const rect = svgRef.current?.getBoundingClientRect();
          const x = event.clientX - (rect?.left ?? 0);
          const y = event.clientY - (rect?.top ?? 0);
          handleDrop(type, x, y);
        }}
      >
        <g className="links" />
        <g className="nodes" />
      </svg>
      <ConnectionHelper nodes={design.nodes} onConnect={handleLinkCreation} />
    </section>
  );
};

type ConnectionHelperProps = {
  nodes: NodeDatum[];
  onConnect: (source: string, target: string) => void;
};

const ConnectionHelper = ({ nodes, onConnect }: ConnectionHelperProps) => {
  return (
    <div className="connection-helper">
      <h2>Wire logic</h2>
      <p>Choose source and destination nodes to create connections.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const source = formData.get('source') as string;
          const target = formData.get('target') as string;
          if (source && target) {
            onConnect(source, target);
            event.currentTarget.reset();
          }
        }}
      >
        <label>
          Source
          <select name="source" defaultValue="">
            <option value="" disabled>
              Select node
            </option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Target
          <select name="target" defaultValue="">
            <option value="" disabled>
              Select node
            </option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Connect</button>
      </form>
    </div>
  );
};

export default DesignerCanvas;
