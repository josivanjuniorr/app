import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ShieldCheck, ShieldAlert, Search, Eye, Calendar, User, Clock } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 15;

const Garantias = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;

  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ativas");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { if (lojaSlug) fetchVendas(); }, [lojaSlug]);
  useEffect(() => { setCurrentPage(1); }, [search, activeTab]);

  const fetchVendas = async () => {
    try {
      const response = await axios.get(`${API}/loja/${lojaSlug}/vendas`);
      // Filter only sales with warranty
      const vendasComGarantia = response.data.filter(v => v.garantia_meses && v.garantia_meses > 0);
      setVendas(vendasComGarantia);
    } catch (error) {
      toast.error("Erro ao carregar garantias");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const getDaysRemaining = (garantiaAte) => {
    if (!garantiaAte) return 0;
    const end = new Date(garantiaAte);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (status, garantiaAte) => {
    if (status === "ativa") {
      const days = getDaysRemaining(garantiaAte);
      if (days <= 30) {
        return (
          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-semibold rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Vence em {days} dias
          </span>
        );
      }
      return (
        <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-semibold rounded flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Ativa
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-semibold rounded flex items-center gap-1">
        <ShieldAlert className="w-3 h-3" />
        Vencida
      </span>
    );
  };

  const filteredVendas = vendas.filter((v) => {
    const matchesSearch = 
      v.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      v.itens_parsed?.some(i => i.modelo_nome?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesTab = activeTab === "todas" ? true : v.garantia_status === (activeTab === "ativas" ? "ativa" : "vencida");
    
    return matchesSearch && matchesTab;
  });

  // Sort: expiring soon first for active, most recent for expired
  const sortedVendas = [...filteredVendas].sort((a, b) => {
    if (activeTab === "ativas") {
      return new Date(a.garantia_ate) - new Date(b.garantia_ate);
    }
    return new Date(b.garantia_ate) - new Date(a.garantia_ate);
  });

  // Pagination
  const totalPages = Math.ceil(sortedVendas.length / ITEMS_PER_PAGE);
  const paginatedVendas = sortedVendas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const garantiasAtivas = vendas.filter(v => v.garantia_status === "ativa").length;
  const garantiasVencidas = vendas.filter(v => v.garantia_status === "vencida").length;
  const vencendoEm30Dias = vendas.filter(v => v.garantia_status === "ativa" && getDaysRemaining(v.garantia_ate) <= 30).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37]">Carregando...</div></div>;

  return (
    <div className="space-y-6" data-testid="garantias-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Garantias</h1>
            <p className="text-sm text-gray-400">Gerencie as garantias dos produtos vendidos</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#141414] border border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{garantiasAtivas}</p>
              <p className="text-sm text-gray-400">Garantias Ativas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-yellow-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{vencendoEm30Dias}</p>
              <p className="text-sm text-gray-400">Vencendo em 30 dias</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-red-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{garantiasVencidas}</p>
              <p className="text-sm text-gray-400">Garantias Vencidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar por cliente ou produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#0A0A0A] border-white/10 text-white"
              data-testid="search-garantia"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Table */}
      <Card className="bg-[#141414] border border-white/5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b border-white/5 pb-0">
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger 
                value="ativas" 
                className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-400"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Ativas ({garantiasAtivas})
              </TabsTrigger>
              <TabsTrigger 
                value="vencidas"
                className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400"
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Vencidas ({garantiasVencidas})
              </TabsTrigger>
              <TabsTrigger 
                value="todas"
                className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400"
              >
                <Shield className="w-4 h-4 mr-2" />
                Todas ({vendas.length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-0">
            {paginatedVendas.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Cliente</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Produto</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Data Venda</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Garantia</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Vencimento</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Status</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs text-right whitespace-nowrap">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedVendas.map((venda) => (
                        <TableRow key={venda.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500 hidden sm:block" />
                              <span className="text-gray-300 font-medium">{venda.cliente_nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="text-[#D4AF37] font-medium">
                              {venda.itens_parsed?.map(i => i.modelo_nome).join(", ") || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500 hidden sm:block" />
                              {formatDate(venda.data)}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded">
                              {venda.garantia_meses} {venda.garantia_meses === 1 ? "mês" : "meses"}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-400 whitespace-nowrap">
                            {formatDate(venda.garantia_ate)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getStatusBadge(venda.garantia_status, venda.garantia_ate)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Link to={`/${lojaSlug}/vendas/${venda.id}`}>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10">
                                <Eye className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Ver</span>
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={sortedVendas.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">
                  {activeTab === "ativas" 
                    ? "Nenhuma garantia ativa"
                    : activeTab === "vencidas"
                    ? "Nenhuma garantia vencida"
                    : "Nenhuma garantia encontrada"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Garantias;
