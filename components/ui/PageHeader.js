import Image from "next/image";

// Recebe o user via props ou session (next-auth)
// Exemplo: <PageHeader title="Dashboard" user={{ name: "Usuário Teste", role: "Admin" }} />

export default function PageHeader({ title, user }) {
  const initials = user?.name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>

      {user && (
        <div className="avatar-chip">
          <div className="w-8 h-8 rounded-full bg-[#F6ECFF] flex items-center justify-center text-[12px] font-bold text-[#582688] shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex flex-col">
            <span className="avatar-chip-name">{user.name}</span>
            <span className="avatar-chip-role">{user.role}</span>
          </div>
        </div>
      )}
    </div>
  );
}