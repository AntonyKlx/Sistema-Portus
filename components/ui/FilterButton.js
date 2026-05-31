import { SlidersHorizontal } from "lucide-react";

export default function FilterButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="btn-filter">
      Filtro
      <SlidersHorizontal size={16} />
    </button>
  );
}