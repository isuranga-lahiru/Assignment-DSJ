export default function SearchBar({ value, onChange }) {
  return (
    <label className="search-bar">
      <span>Search notes</span>
      <input
        type="search"
        placeholder="Search by title or subject"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
