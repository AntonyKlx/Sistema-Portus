export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  name,
  required,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="input-icon-wrapper">
        {Icon && (
          <span className="input-icon">
            <Icon size={16} />
          </span>
        )}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`input ${Icon ? "input-with-icon" : ""}`}
        />
      </div>
    </div>
  );
}