export default function IconButton({ icon: Icon, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="icon-btn"
    >
      <Icon size={17} />
    </button>
  );
}