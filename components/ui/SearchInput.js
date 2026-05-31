import { Search } from "lucide-react";

export default function SearchInput({ placeholder = "Buscar...", value, onChange }) {
  return (
    <div className="input-icon-wrapper">
      <span className="input-icon">
        <Search size={16} />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input input-with-icon"
      />
    </div>
  );
}