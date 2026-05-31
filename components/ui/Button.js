const variants = {
  primary:        "btn-primary",
  "outline-green": "btn-outline-green",
  "outline-red":   "btn-outline-red",
  filter:         "btn-filter",
};

export default function Button({ children, variant = "primary", onClick, type = "button", className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}