import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart2, Calendar, DollarSign, TrendingUp, Smartphone, Users, Receipt, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

const toInputDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMesAtualRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    inicio: toInputDateLocal(firstDay),
    fim: toInputDateLocal(now),
  };
};

const Relatorio = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;

  const [loading, setLoading] = useState(true);
  const [vendas, setVendas] = useState([]);

  const [inicioDraft, setInicioDraft] = useState(() => getMesAtualRange().inicio);
  const [fimDraft, setFimDraft] = useState(() => getMesAtualRange().fim);
  const [inicioFiltro, setInicioFiltro] = useState(() => getMesAtualRange().inicio);
  const [fimFiltro, setFimFiltro] = useState(() => getMesAtualRange().fim);

  useEffect(() => {
    if (!lojaSlug) return;

    const fetchVendas = async () => {
      try {
        const response = await axios.get(`${API}/loja/${lojaSlug}/vendas`);
        setVendas(response.data || []);
      } catch (error) {
        toast.error("Erro ao carregar dados do relatório");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, [lojaSlug]);

  const aplicarFiltros = () => {
    if (inicioDraft && fimDraft && inicioDraft > fimDraft) {
      toast.error("Data inicial não pode ser maior que a final");
      return;
    }

    setInicioFiltro(inicioDraft);
    setFimFiltro(fimDraft);
  };

  const limparPeriodo = () => {
    setInicioDraft("");
    setFimDraft("");
    setInicioFiltro("");
    setFimFiltro("");
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const vendasFiltradas = useMemo(() => {
    return vendas.filter((venda) => {
      const saleDate = new Date(venda.data);

      if (inicioFiltro) {
        const start = new Date(`${inicioFiltro}T00:00:00`);
        if (saleDate < start) return false;
      }

      if (fimFiltro) {
        const end = new Date(`${fimFiltro}T23:59:59`);
        if (saleDate > end) return false;
      }

      return true;
    });
  }, [vendas, inicioFiltro, fimFiltro]);

  const resumo = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const valorTotal = vendasFiltradas.reduce((sum, v) => sum + (v.valor_total || 0), 0);
    const lucroEstimado = vendasFiltradas.reduce((sum, v) => sum + (v.lucro_estimado || 0), 0);
    const celularesVendidos = vendasFiltradas.reduce((sum, v) => sum + (v.itens_parsed?.length || 0), 0);

    const clientesUnicos = new Set(vendasFiltradas.map((v) => v.cliente_id).filter(Boolean)).size;
    const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

    const formasPagamentoMap = {};
    const modelosMap = {};

    vendasFiltradas.forEach((venda) => {
      const forma = venda.forma_pagamento || "nao_informada";
      formasPagamentoMap[forma] = (formasPagamentoMap[forma] || 0) + 1;

      (venda.itens_parsed || []).forEach((item) => {
        const key = item.modelo_id || item.modelo_nome || "desconhecido";
        if (!modelosMap[key]) {
          modelosMap[key] = {
            nome: item.modelo_nome || "Modelo não identificado",
            quantidade: 0,
            valor: 0,
          };
        }

        modelosMap[key].quantidade += 1;
        modelosMap[key].valor += item.preco || 0;
      });
    });

    const topModelos = Object.values(modelosMap)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);

    const formasPagamento = Object.entries(formasPagamentoMap)
      .map(([forma, quantidade]) => ({ forma, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    return {
      totalVendas,
      valorTotal,
      lucroEstimado,
      celularesVendidos,
      clientesUnicos,
      ticketMedio,
      topModelos,
      formasPagamento,
    };
  }, [vendasFiltradas]);

  const formatPayment = (payment) => {
    const labels = {
      dinheiro: "Dinheiro",
      pix: "PIX",
      cartao_credito: "Cartão de Crédito",
      cartao_debito: "Cartão de Débito",
      transferencia: "Transferência",
      nao_informada: "Não informada",
    };
    return labels[payment] || payment;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="relatorio-page">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
            <FileBarChart2 className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white font-['Outfit']">Relatório</h1>
            <p className="text-gray-400">Resumo completo do período selecionado</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={inicioDraft}
              onChange={(e) => setInicioDraft(e.target.value)}
              className="bg-transparent text-gray-300 text-sm outline-none"
              data-testid="relatorio-inicio"
            />
            <span className="text-gray-500 text-xs">até</span>
            <input
              type="date"
              value={fimDraft}
              onChange={(e) => setFimDraft(e.target.value)}
              className="bg-transparent text-gray-300 text-sm outline-none"
              data-testid="relatorio-fim"
            />
          </div>

          <Button
            onClick={aplicarFiltros}
            className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]"
            data-testid="btn-atualizar-relatorio"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>

          <Button
            variant="outline"
            className="border-white/10 text-gray-300 hover:bg-white/5"
            onClick={limparPeriodo}
            data-testid="btn-limpar-relatorio"
          >
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Total de Vendas</p>
                <p className="text-2xl font-bold text-white mt-1">{resumo.totalVendas}</p>
              </div>
              <Receipt className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Faturamento</p>
                <p className="text-xl font-bold text-[#D4AF37] mt-1">{formatCurrency(resumo.valorTotal)}</p>
              </div>
              <DollarSign className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Lucro Estimado</p>
                <p className="text-xl font-bold text-green-500 mt-1">{formatCurrency(resumo.lucroEstimado)}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Celulares Vendidos</p>
                <p className="text-2xl font-bold text-white mt-1">{resumo.celularesVendidos}</p>
              </div>
              <Smartphone className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Clientes Atendidos</p>
                <p className="text-2xl font-bold text-white mt-1">{resumo.clientesUnicos}</p>
              </div>
              <Users className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Ticket Médio</p>
                <p className="text-xl font-bold text-white mt-1">{formatCurrency(resumo.ticketMedio)}</p>
              </div>
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="bg-[#141414] border border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg text-white">Modelos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {resumo.topModelos.length > 0 ? (
              <ul className="space-y-3">
                {resumo.topModelos.map((modelo, idx) => (
                  <li
                    key={`${modelo.nome}-${idx}`}
                    className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-gray-300">{modelo.nome}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{modelo.quantidade} vendas</p>
                      <p className="text-xs text-gray-500">{formatCurrency(modelo.valor)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum modelo vendido no período</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg text-white">Formas de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {resumo.formasPagamento.length > 0 ? (
              <ul className="space-y-3">
                {resumo.formasPagamento.map((item) => {
                  const percentual = resumo.totalVendas > 0 ? (item.quantidade / resumo.totalVendas) * 100 : 0;
                  return (
                    <li key={item.forma} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{formatPayment(item.forma)}</span>
                        <span className="text-white font-semibold">{item.quantidade} ({percentual.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-[#0A0A0A] rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4AF37]" style={{ width: `${percentual}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8">Sem pagamentos no período</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#141414] border border-white/5">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-lg text-white">Últimas Vendas do Período</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vendasFiltradas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs uppercase text-gray-500 p-4">Data</th>
                    <th className="text-left text-xs uppercase text-gray-500 p-4">Cliente</th>
                    <th className="text-left text-xs uppercase text-gray-500 p-4">Itens</th>
                    <th className="text-left text-xs uppercase text-gray-500 p-4">Pagamento</th>
                    <th className="text-right text-xs uppercase text-gray-500 p-4">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {[...vendasFiltradas]
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .slice(0, 10)
                    .map((venda) => (
                      <tr key={venda.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 text-gray-300 whitespace-nowrap">{formatDate(venda.data)}</td>
                        <td className="p-4 text-gray-300 whitespace-nowrap">{venda.cliente_nome || "Cliente"}</td>
                        <td className="p-4 text-gray-400 whitespace-nowrap">{venda.itens_parsed?.length || 0}</td>
                        <td className="p-4 text-gray-400 whitespace-nowrap">{formatPayment(venda.forma_pagamento)}</td>
                        <td className="p-4 text-right text-[#D4AF37] font-semibold whitespace-nowrap">{formatCurrency(venda.valor_total)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">Nenhuma venda encontrada para o período selecionado</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorio;
