import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Search, Eye, Calendar, DollarSign, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

const Vendas = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;

  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orderConfig, setOrderConfig] = useState({ key: "data", direction: "desc" });

  useEffect(() => { if (lojaSlug) fetchVendas(); }, [lojaSlug]);

  const fetchVendas = async () => {
    try {
      const response = await axios.get(`${API}/loja/${lojaSlug}/vendas`);
      setVendas(response.data);
    } catch (error) {
      toast.error("Erro ao carregar vendas");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatPayment = (p) => ({ 'dinheiro': 'Dinheiro', 'pix': 'PIX', 'cartao_credito': 'Cartão de Crédito', 'cartao_debito': 'Cartão de Débito', 'transferencia': 'Transferência' }[p] || p);

  const handleSort = (key) => {
    setOrderConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const renderSortIcon = (key) => {
    if (orderConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    }
    return orderConfig.direction === "asc" ? <span className="text-xs">↑</span> : <span className="text-xs">↓</span>;
  };

  const filteredVendas = vendas
    .filter((v) =>
      v.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      v.id.includes(search) ||
      formatDate(v.data).includes(search)
    )
    .sort((a, b) => {
      let valueA, valueB;

      switch (orderConfig.key) {
        case "data":
          valueA = new Date(a.data).getTime();
          valueB = new Date(b.data).getTime();
          break;
        case "valor":
          valueA = a.valor_total || 0;
          valueB = b.valor_total || 0;
          break;
        case "cliente":
          valueA = a.cliente_nome?.toLowerCase() || "";
          valueB = b.cliente_nome?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return orderConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return orderConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const totalVendas = filteredVendas.reduce((sum, v) => sum + (v.valor_total || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37]">Carregando...</div></div>;

  return (
    <div className="space-y-6" data-testid="vendas-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Receipt className="w-5 h-5 text-purple-500" /></div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Vendas</h1>
            <p className="text-sm text-gray-400">Histórico de vendas realizadas</p>
          </div>
        </div>
        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-[#D4AF37]" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold text-[#D4AF37]">{formatCurrency(totalVendas)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#0A0A0A] border-white/10 text-white"
              data-testid="search-venda"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-0">
          {filteredVendas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead
                    onClick={() => handleSort("data")}
                    className="cursor-pointer text-gray-400 uppercase text-xs"
                  >
                    <div className="flex items-center gap-2">
                      Data {renderSortIcon("data")}
                    </div>
                  </TableHead>

                  <TableHead
                    onClick={() => handleSort("cliente")}
                    className="cursor-pointer text-gray-400 uppercase text-xs"
                  >
                    <div className="flex items-center gap-2">
                      Cliente {renderSortIcon("cliente")}
                    </div>
                  </TableHead>

                  <TableHead className="text-gray-400 uppercase text-xs">Itens</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs">Pagamento</TableHead>

                  <TableHead
                    onClick={() => handleSort("valor")}
                    className="cursor-pointer text-gray-400 uppercase text-xs"
                  >
                    <div className="flex items-center gap-2">
                      Valor {renderSortIcon("valor")}
                    </div>
                  </TableHead>

                  <TableHead className="text-gray-400 uppercase text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredVendas.map((venda) => (
                  <TableRow key={venda.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {formatDate(venda.data)}
                      </div>
                    </TableCell>

                    <TableCell className="text-gray-300 font-medium">{venda.cliente_nome}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-semibold rounded">
                        {venda.itens_parsed?.length || 0} produtos
                      </span>
                    </TableCell>

                    <TableCell className="text-gray-400">{formatPayment(venda.forma_pagamento)}</TableCell>
                    <TableCell className="text-[#D4AF37] font-semibold">{formatCurrency(venda.valor_total)}</TableCell>

                    <TableCell className="text-right">
                      <Link to={`/${lojaSlug}/vendas/${venda.id}`}>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10" data-testid={`btn-view-${venda.id}`}>
                          <Eye className="w-4 h-4 mr-1" />Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma venda encontrada</p>
              <Link to={`/${lojaSlug}/ponto-venda`}>
                <Button className="mt-4 bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]">Realizar Venda</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vendas;