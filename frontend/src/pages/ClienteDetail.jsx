import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, ArrowLeft, Phone, FileText, ShoppingBag, 
  RefreshCw, DollarSign, Calendar, Eye, Shield,
  Package
} from "lucide-react";
import { toast } from "sonner";

const ClienteDetail = () => {
  const { slug, id } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;
  
  const [cliente, setCliente] = useState(null);
  const [compras, setCompras] = useState([]);
  const [trocas, setTrocas] = useState([]);
  const [resumo, setResumo] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("compras");

  useEffect(() => {
    if (lojaSlug && id) {
      fetchHistorico();
    }
  }, [lojaSlug, id]);

  const fetchHistorico = async () => {
    try {
      const response = await axios.get(`${API}/loja/${lojaSlug}/clientes/${id}/historico`);
      setCliente(response.data.cliente);
      setCompras(response.data.compras);
      setTrocas(response.data.trocas);
      setResumo(response.data.resumo);
    } catch (error) {
      toast.error("Erro ao carregar histórico do cliente");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    });
  };

  const formatPayment = (p) => ({
    'dinheiro': 'Dinheiro',
    'pix': 'PIX',
    'cartao_credito': 'Cartão Crédito',
    'cartao_debito': 'Cartão Débito',
    'transferencia': 'Transferência'
  }[p] || p);

  const getGarantiaStatusBadge = (status) => {
    if (!status || status === "sem_garantia") return null;
    const styles = {
      ativa: "bg-green-500/10 text-green-500 border-green-500/30",
      vencida: "bg-red-500/10 text-red-500 border-red-500/30"
    };
    const labels = { ativa: "Ativa", vencida: "Vencida" };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">Carregando...</div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cliente não encontrado</p>
        <Link to={`/${lojaSlug}/clientes`}>
          <Button className="mt-4">Voltar para Clientes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="cliente-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/${lojaSlug}/clientes`}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <User className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">{cliente.nome}</h1>
            <p className="text-sm text-gray-400">Histórico do Cliente</p>
          </div>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">CPF</p>
                <p className="text-white font-medium">{cliente.cpf || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">WhatsApp</p>
                <p className="text-white font-medium">{cliente.whatsapp || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Compras</p>
                <p className="text-[#D4AF37] font-bold">{resumo.total_compras || 0} aparelhos</p>
                <p className="text-xs text-gray-400">{formatCurrency(resumo.valor_total_compras)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Trocas</p>
                <p className="text-purple-400 font-bold">{resumo.total_trocas || 0} aparelhos</p>
                <p className="text-xs text-gray-400">{formatCurrency(resumo.valor_total_trocas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#141414] border border-white/5">
          <TabsTrigger 
            value="compras" 
            className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37]"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Compras ({compras.length})
          </TabsTrigger>
          <TabsTrigger 
            value="trocas"
            className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Trocas ({trocas.length})
          </TabsTrigger>
        </TabsList>

        {/* Compras Tab */}
        <TabsContent value="compras">
          <Card className="bg-[#141414] border border-white/5">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                Celulares Comprados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {compras.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Data</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Modelo</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Cor</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Memória</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Valor</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Pagamento</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Garantia</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs text-right whitespace-nowrap">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compras.map((compra, index) => (
                        <TableRow key={index} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-gray-400 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500 hidden sm:block" />
                              {formatDate(compra.data)}
                            </div>
                          </TableCell>
                          <TableCell className="text-[#D4AF37] font-medium whitespace-nowrap">
                            {compra.modelo_nome}
                          </TableCell>
                          <TableCell className="text-gray-300 whitespace-nowrap">{compra.cor}</TableCell>
                          <TableCell className="text-gray-300 whitespace-nowrap">{compra.memoria}</TableCell>
                          <TableCell className="text-green-500 font-semibold whitespace-nowrap">
                            {formatCurrency(compra.preco)}
                          </TableCell>
                          <TableCell className="text-gray-300 whitespace-nowrap">
                            {formatPayment(compra.forma_pagamento)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {compra.garantia_meses ? (
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-400" />
                                <span className="text-gray-300">{compra.garantia_meses}m</span>
                                {getGarantiaStatusBadge(compra.garantia_status)}
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Link to={`/${lojaSlug}/vendas/${compra.venda_id}`}>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10">
                                <Eye className="w-4 h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Ver</span>
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma compra registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trocas Tab */}
        <TabsContent value="trocas">
          <Card className="bg-[#141414] border border-white/5">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-400" />
                Celulares Dados em Troca
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {trocas.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Data</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Aparelho</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs whitespace-nowrap">Valor da Troca</TableHead>
                        <TableHead className="text-gray-400 uppercase text-xs text-right whitespace-nowrap">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trocas.map((troca, index) => (
                        <TableRow key={index} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-gray-400 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500 hidden sm:block" />
                              {formatDate(troca.data)}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-purple-400" />
                              <span className="text-purple-300 font-medium">{troca.descricao}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-green-500 font-semibold whitespace-nowrap">
                            {formatCurrency(troca.valor)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Link to={`/${lojaSlug}/vendas/${troca.venda_id}`}>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-purple-400 hover:bg-purple-400/10">
                                <Eye className="w-4 h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Ver Venda</span>
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <RefreshCw className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma troca registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClienteDetail;
