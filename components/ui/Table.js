// Exemplo de uso:
// <Table columns={["Apartamento", "Morador", "Data", "Status", "Ações"]} >
//   <tr className="table-row">
//     <td className="table-cell">...</td>
//   </tr>
// </Table>

export default function Table({ columns, children, title }) {
  return (
    <div className="table-wrapper">
      {title && (
        <div className="px-5 py-4 border-b border-[#C7C7C7]">
          <span className="section-title">{title}</span>
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr className="table-header-row">
            {columns.map((col) => (
              <th key={col} className="table-cell text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}