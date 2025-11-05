import type { GateTemplate } from './DesignerCanvas';

type GatePaletteProps = {
  templates: GateTemplate[];
};

const GatePalette = ({ templates }: GatePaletteProps) => {
  return (
    <aside className="palette">
      <h2>Gate library</h2>
      <ul>
        {templates.map((template) => (
          <li
            key={template.type}
            draggable
            onDragStart={(event) => {
              event.dataTransfer?.setData('application/gate-type', template.type);
            }}
          >
            {template.label}
          </li>
        ))}
      </ul>
      <p className="palette-hint">Drag gates onto the canvas to instantiate them.</p>
    </aside>
  );
};

export default GatePalette;
