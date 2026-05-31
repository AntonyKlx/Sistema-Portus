const variants = {
  green:  "badge-green",
  orange: "badge-orange",
  red:    "badge-red",
  blue:   "badge-blue",
  purple: "badge-purple",
};

export default function Badge({ label, variant = "blue" }) {
  return (
    <span className={`badge ${variants[variant]}`}>
      {label}
    </span>
  );
}