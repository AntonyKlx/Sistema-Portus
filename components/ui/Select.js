import { ChevronDown } from "lucide-react";

export default function Select({ label, options = [], value, onChange, name, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-gray-700">{label}</label>
      )}
      <div className="input-icon-wrapper">
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input appearance-none pr-8 cursor-pointer ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 text-gray-400 pointer-events-none">
          <ChevronDown size={16} />
        </span>
      </div>
    </div>
  );
}