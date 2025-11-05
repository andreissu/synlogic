type PromoterSuggestion = {
  signal: string;
  promoter: string;
  compatible: string;
  notes: string;
};

type PromoterPanelProps = {
  suggestions: PromoterSuggestion[];
};

const PromoterPanel = ({ suggestions }: PromoterPanelProps) => {
  if (!suggestions.length) {
    return <p className="placeholder">No promoter suggestions yet.</p>;
  }

  return (
    <table className="promoter-table">
      <thead>
        <tr>
          <th>Signal</th>
          <th>Promoter</th>
          <th>Compatible?</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {suggestions.map((suggestion) => (
          <tr key={suggestion.signal}>
            <td>{suggestion.signal}</td>
            <td>{suggestion.promoter}</td>
            <td>{suggestion.compatible}</td>
            <td>{suggestion.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export type { PromoterSuggestion };
export default PromoterPanel;
