type LogicSummaryProps = {
  truthTable: Record<string, number>[];
};

const LogicSummary = ({ truthTable }: LogicSummaryProps) => {
  if (!truthTable.length) {
    return <p className="placeholder">No truth table computed yet.</p>;
  }

  const inputColumns = Object.keys(truthTable[0]).filter((key) => key !== 'output');

  return (
    <table className="truth-table">
      <thead>
        <tr>
          {inputColumns.map((column) => (
            <th key={column}>{column}</th>
          ))}
          <th>output</th>
        </tr>
      </thead>
      <tbody>
        {truthTable.map((row, index) => (
          <tr key={index}>
            {inputColumns.map((column) => (
              <td key={column}>{row[column]}</td>
            ))}
            <td>{row.output}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LogicSummary;
