const variants = {
  primary:        "btn-primary",
  "outline-green": "btn-outline-green",
  "outline-red":   "btn-outline-red",
  filter:         "btn-filter",
};

export default function Button({ children, variant = "primary", onClick, type = "button", className = "", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
