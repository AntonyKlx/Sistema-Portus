"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"; // Importação do NextAuth no topo
import {
  StatCard,
  Badge,
  PageHeader,
  PageWrapper,
  SearchInput,
  Table
} from "@/components/ui";

export default function EncomendasPorteiroPage() {
  const { data: session } = useSession();

  const usuarioReal = {
    name: session?.user?.name,
    role: session?.user?.perfil
      ? session.user.perfil.charAt(0).toUpperCase() + session.user.perfil.slice(1)
      : ""
  };

  const [encomendas, setEncomendas] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  // Estados para o modal de baixa
  const [modalBaixaAberto, setModalBaixaAberto] = useState(false);
  const [encomendaParaBaixa, setEncomendaParaBaixa] = useState(null);
  const [nomeRetirante, setNomeRetirante] = useState("");

  const processarBaixa = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch(`/api/porteiro/encomendas/${encomendaParaBaixa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeRetirante }),
      });

      if (!res.ok) throw new Error("Erro ao dar baixa");

      setAviso({ texto: "Entrega confirmada!", tipo: "sucesso" });
      
      setTimeout(() => {
        setModalBaixaAberto(false);
        setEncomendaParaBaixa(null);
        setNomeRetirante("");
        setAviso({ texto: "", tipo: "" });
        carregarEncomendas();
      }, 1500);

    } catch (error) {
      setAviso({ texto: "Erro ao atualizar status.", tipo: "erro" });
    }
  };

  // Estados para o modal de edição
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [encomendaParaEditar, setEncomendaParaEditar] = useState({
    id: "",
    bloco: "",
    numUnidade: "",
    remetente: "",
    codigoPacote: ""
  });

  const salvarEdicao = async (e) => {
    e.preventDefault();
    setAviso({ texto: "Salvando alterações...", tipo: "info" });

    try {
      const res = await fetch(`/api/porteiro/encomendas/${encomendaParaEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encomendaParaEditar),
      });

      const data = await res.json();

      if (!res.ok) return setAviso({ texto: data.message, tipo: "erro" });

      setAviso({ texto: "Alterações salvas!", tipo: "sucesso" });
      
      setTimeout(() => {
        setModalEditarAberto(false);
        setAviso({ texto: "", tipo: "" });
        carregarEncomendas();
      }, 1500);

    } catch (error) {
      setAviso({ texto: "Erro ao conectar com o servidor.", tipo: "erro" });
    }
  };

  // Estados para o modal de registro 
  const [modalRegistroAberto, setModalRegistroAberto] = useState(false);
  const [aviso, setAviso] = useState({ texto: "", tipo: "" });
  const [formRegistro, setFormRegistro] = useState({
    bloco: "",
    numUnidade: "",
    remetente: "",
    codigoPacote: ""
  });

  const carregarEncomendas = async () => {
    try {
      const res = await fetch("/api/porteiro/encomendas");
      const data = await res.json();
      setEncomendas(data);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarBlocos = async () => {
    try {
      const res = await fetch("/api/porteiro/encomendas/blocos");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar blocos");
      }

      setBlocos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar blocos:", error);
    }
  };

  const salvarEncomenda = async (e) => {
    e.preventDefault();
    setAviso({ texto: "Processando...", tipo: "info" });

    try {
      const res = await fetch("/api/porteiro/encomendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formRegistro),
      });

      const data = await res.json();

      if (!res.ok) {
        return setAviso({ texto: data.message, tipo: "erro" });
      }

      setAviso({ texto: "Registrada com sucesso!", tipo: "sucesso" });

      setTimeout(() => {
        setModalRegistroAberto(false);
        setFormRegistro({ bloco: "", numUnidade: "", remetente: "", codigoPacote: "" });
        setAviso({ texto: "", tipo: "" });
        carregarEncomendas();
      }, 1000);

    } catch (error) {
      setAviso({ texto: "Erro ao conectar com o servidor.", tipo: "erro" });
    }
  };

  useEffect(() => {
    carregarEncomendas();
    carregarBlocos();
  }, []);
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const filtradas = encomendas
  .filter(enc => {
    const termo = busca.toLowerCase();
    const bateTexto = enc.apartamento?.toLowerCase().includes(termo) || 
                      enc.bloco?.toLowerCase().includes(termo) ||
                      enc.morador?.toLowerCase().includes(termo);
    const bateStatus = filtroStatus === "Todos" || enc.status === filtroStatus;
    return bateTexto && bateStatus;
  })
  .sort((a, b) => {
    if (a.status === "Aguardando Retirada" && b.status === "Retirada") return -1;
    if (a.status === "Retirada" && b.status === "Aguardando Retirada") return 1;
    return 0;
  });

  const stats = {
    pendentes: encomendas.filter(e => e.status === "Aguardando Retirada").length,
    entreguesHoje: encomendas.filter(e => e.status === "Retirada").length,
    totalSemanal: encomendas.length
  };

  return (
    <PageWrapper>
      <PageHeader title="Encomendas" user={usuarioReal} />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        <StatCard label="Encomendas Pendentes" value={stats.pendentes} color="purple" />
        <StatCard label="Entregues Hoje" value={stats.entreguesHoje} color="purple" />
        <StatCard label="Total Semanal" value={stats.totalSemanal} color="purple" />
      </section>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 w-full md:w-auto">
          <SearchInput 
            placeholder="Buscar encomendas..." 
            value={busca} 
            onChange={(e) => setBusca(e.target.value)}
          />
          
          <select 
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border-2 border-gray-100 rounded-md px-3 py-2 bg-white text-gray-600 outline-none focus:border-purple-300 transition-all text-sm font-medium"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Aguardando Retirada">Pendentes</option>
            <option value="Retirada">Entregues</option>
          </select>
        </div>

        <button
          onClick={() => setModalRegistroAberto(true)}
          className="bg-[#582688] text-white px-6 py-2 rounded-md hover:bg-[#4f217a] transition-all font-medium"
        >
          Registrar encomenda +
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={["Bloco", "Apartamento", "Morador", "Data", "Status", "Ações"]}>
          {carregando ? (
            <tr><td colSpan={6} className="p-10 text-center text-gray-400">Carregando encomendas...</td></tr>
          ) : filtradas.map((enc) => (
            <tr key={enc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="p-4 text-gray-700 font-medium">{enc.bloco}</td>
              <td className="p-4 text-gray-700 font-medium">{enc.apartamento}</td>
              <td className="p-4 text-gray-600">{enc.morador}</td>
              <td className="p-4 text-sm text-gray-500">
                {new Date(enc.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </td>
              <td className="p-4">
                <Badge
                  label={enc.status === "Aguardando Retirada" ? "Pendente" : "Entregue"}
                  variant={enc.status === "Aguardando Retirada" ? "orange" : "green"}
                />
              </td>
              <td className="p-4 flex gap-3">
                <button 
                  title="Editar"
                  className="p-1 hover:bg-gray-200 rounded text-gray-950 transition-colors"
                  onClick={() => {
                    setEncomendaParaEditar({
                      id: enc.id,
                      bloco: enc.bloco || "",
                      numUnidade: enc.apartamento.replace("Apto ", ""),
                      remetente: enc.remetente,
                      codigoPacote: enc.codigo
                    });
                    setModalEditarAberto(true);
                  }}
                >
                  <EditIcon />
                </button>
                {enc.status === "Aguardando Retirada" && (
                  <button 
                    title="Confirmar Entrega"
                    className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
                    onClick={() => {
                      setEncomendaParaBaixa(enc);
                      setModalBaixaAberto(true);
                    }}
                  >
                    <CheckIcon />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {modalRegistroAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl border border-purple-100">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Registrar Pacote</h2>
            <form onSubmit={salvarEncomenda} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bloco</label>
                <select
                  required
                  className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-purple-300 outline-none transition-all"
                  value={formRegistro.bloco}
                  onChange={(e) => setFormRegistro({ ...formRegistro, bloco: e.target.value })}
                >
                  <option value="">Selecione o bloco</option>
                  {blocos.map((bloco) => (
                    <option key={bloco} value={bloco}>Bloco {bloco}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Apartamento / Unidade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 101"
                  className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-purple-300 outline-none transition-all"
                  value={formRegistro.numUnidade}
                  onChange={(e) => setFormRegistro({ ...formRegistro, numUnidade: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Remetente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amazon, Mercado Livre"
                  className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-purple-300 outline-none transition-all"
                  value={formRegistro.remetente}
                  onChange={(e) => setFormRegistro({ ...formRegistro, remetente: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Código do Pacote</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: BR7721901"
                  className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-purple-300 outline-none transition-all"
                  value={formRegistro.codigoPacote}
                  onChange={(e) => setFormRegistro({ ...formRegistro, codigoPacote: e.target.value })}
                />
              </div>

              {aviso.texto && (
                <div className={`p-3 rounded-lg text-sm font-medium ${aviso.tipo === 'erro' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {aviso.texto}
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => { setModalRegistroAberto(false); setAviso({ texto: "", tipo: "" }); }}
                  className="flex-1 px-4 py-3 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#F6ECFF' }}
                  className="flex-1 px-4 py-3 text-[#582688] font-bold rounded-xl hover:bg-[#ebd9ff] transition-colors shadow-sm"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modalBaixaAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl border border-purple-100">
            <h2 className="text-2xl font-bold text-purple-900 mb-2">Confirmar Entrega</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Unidade: <span className="font-bold text-gray-700">{encomendaParaBaixa?.apartamento}</span>
            </p>
            <form onSubmit={processarBaixa} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quem está retirando?</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Próprio morador, Familiar, etc."
                  className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-purple-300 outline-none transition-all"
                  value={nomeRetirante}
                  onChange={(e) => setNomeRetirante(e.target.value)}
                />
              </div>
              {aviso.texto && (
                <div className={`p-3 rounded-lg text-sm font-medium ${aviso.tipo === 'erro' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {aviso.texto}
                </div>
              )}
              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => { setModalBaixaAberto(false); setNomeRetirante(""); setAviso({texto:"", tipo:""}); }}
                  className="flex-1 px-4 py-3 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ backgroundColor: '#F6ECFF' }}
                  className="flex-1 px-4 py-3 text-[#582688] font-bold rounded-xl hover:bg-[#ebd9ff] transition-colors shadow-sm"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEditarAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl border border-purple-100">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Editar Encomenda</h2>
            <form onSubmit={salvarEdicao} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bloco</label>
                <select
                  required
                  className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none"
                  value={encomendaParaEditar.bloco}
                  onChange={(e) => setEncomendaParaEditar({...encomendaParaEditar, bloco: e.target.value})}
                >
                  <option value="">Selecione o bloco</option>
                  {blocos.map((bloco) => (
                    <option key={bloco} value={bloco}>Bloco {bloco}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Apartamento</label>
                <input 
                  type="text"
                  required
                  className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none"
                  value={encomendaParaEditar.numUnidade}
                  onChange={(e) => setEncomendaParaEditar({...encomendaParaEditar, numUnidade: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Remetente</label>
                <input 
                  type="text" required
                  className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none"
                  value={encomendaParaEditar.remetente}
                  onChange={(e) => setEncomendaParaEditar({...encomendaParaEditar, remetente: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Código do Pacote</label>
                <input 
                  type="text" required
                  className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none"
                  value={encomendaParaEditar.codigoPacote}
                  onChange={(e) => setEncomendaParaEditar({...encomendaParaEditar, codigoPacote: e.target.value})}
                />
              </div>
              {aviso.texto && (
                <div className={`p-3 rounded-lg text-sm ${aviso.tipo === 'erro' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {aviso.texto}
                </div>
              )}
              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setModalEditarAberto(false)}
                  className="flex-1 px-4 py-3 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ backgroundColor: '#F6ECFF' }}
                  className="flex-1 px-4 py-3 text-[#582688] font-bold rounded-xl shadow-sm hover:bg-[#ebd9ff]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function CheckIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}

function EditIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
}
