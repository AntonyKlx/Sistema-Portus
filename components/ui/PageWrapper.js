// Wrapper do conteúdo principal de cada página
// Uso:
// <PageWrapper>
//   <PageHeader title="Dashboard" user={user} />
//   ... conteúdo da página
// </PageWrapper>

export default function PageWrapper({ children }) {
  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="page-wrapper">
        {children}
      </div>
    </main>
  );
}