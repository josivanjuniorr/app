import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShoppingCart, 
  Search, 
  User, 
  Package, 
  Plus, 
  Minus, 
  X,
  CreditCard,
  CheckCircle,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

const PontoVenda = () => {
  const navigate = useNavigate();
  
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Search states
  const [searchProduto, setSearchProduto] = useState("");
  const [searchCliente, setSearchCliente] = useState("");
  
  // Selection states
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedProdutos, setSelectedProdutos] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [produtosRes, clientesRes] = await Promise.all([
        axios.get(`${API}/produtos`, { params: { vendido: false } }),
        axios.get(`${API}/clientes`)
      ]);
      setProdutos(produtosRes.data);
      setClientes(clientesRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const filteredProdutos = useMemo(() => {
    return produtos.filter((p) => {
      const searchLower = searchProduto.toLowerCase();
      const notSelected = !selectedProdutos.some(sp => sp.id === p.id);
      return notSelected && (
        p.modelo_nome?.toLowerCase().includes(searchLower) ||
        p.cor.toLowerCase().includes(searchLower) ||
        p.memoria.toLowerCase().includes(searchLower) ||
        p.imei?.toLowerCase().includes(searchLower)
      );
    });
  }, [produtos, searchProduto, selectedProdutos]);

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const searchLower = searchCliente.toLowerCase();
      return c.nome.toLowerCase().includes(searchLower) ||
             c.cpf.includes(searchCliente) ||
             c.whatsapp.includes(searchCliente);
    });
  }, [clientes, searchCliente]);

  const total = useMemo(() => {
    return selectedProdutos.reduce((sum, p) => sum + p.preco, 0);
  }, [selectedProdutos]);

  const handleAddProduto = (produto) => {
    setSelectedProdutos([...selectedProdutos, produto]);
  };

  const handleRemoveProduto = (produtoId) => {
    setSelectedProdutos(selectedProdutos.filter(p => p.id !== produtoId));
  };

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    setSearchCliente("");
  };

  const handleSubmit = async () => {
    if (!selectedCliente) {
      toast.error("Selecione um cliente");
      return;
    }
    if (selectedProdutos.length === 0) {
      toast.error("Adicione ao menos um produto");
      return;
    }
    if (!formaPagamento) {
      toast.error("Selecione a forma de pagamento");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/vendas`, {
        cliente_id: selectedCliente.id,
        produtos: selectedProdutos.map(p => p.id),
        forma_pagamento: formaPagamento,
        observacao: observacao || null
      });
      
      toast.success("Venda finalizada com sucesso!");
      navigate("/vendas");
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao finalizar venda";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ponto-venda-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">Ponto de Venda</h1>
          <p className="text-sm text-gray-400">Realize vendas para seus clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Search */}
          <Card className="bg-[#141414] border border-white/5">
            <CardHeader className="border-b border-white/5 py-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-base font-semibold text-white">Produtos Disponíveis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchProduto}
                  onChange={(e) => setSearchProduto(e.target.value)}
                  className="pl-10 bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                  data-testid="search-produto-venda"
                />
              </div>
              
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredProdutos.length > 0 ? (
                  filteredProdutos.map((produto) => (
                    <div 
                      key={produto.id}
                      className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg border border-white/5 hover:border-[#D4AF37]/30 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-[#D4AF37] font-medium">{produto.modelo_nome}</p>
                        <p className="text-sm text-gray-400">
                          {produto.cor} • {produto.memoria}
                          {produto.bateria && ` • ${produto.bateria}%`}
                        </p>
                        {produto.imei && (
                          <p className="text-xs text-gray-500 font-mono mt-1">IMEI: {produto.imei}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-green-500 font-semibold">{formatCurrency(produto.preco)}</span>
                        <Button 
                          size="sm"
                          onClick={() => handleAddProduto(produto)}
                          className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                          data-testid={`add-produto-${produto.id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">Nenhum produto disponível</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Column */}
        <div className="space-y-4">
          {/* Client Selection */}
          <Card className="bg-[#141414] border border-white/5">
            <CardHeader className="border-b border-white/5 py-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-green-500" />
                <CardTitle className="text-base font-semibold text-white">Cliente</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {selectedCliente ? (
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div>
                    <p className="text-white font-medium">{selectedCliente.nome}</p>
                    <p className="text-sm text-gray-400">{selectedCliente.whatsapp}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedCliente(null)}
                    className="text-gray-400 hover:text-red-400"
                    data-testid="remove-cliente"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={searchCliente}
                      onChange={(e) => setSearchCliente(e.target.value)}
                      className="pl-10 bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                      data-testid="search-cliente-venda"
                    />
                  </div>
                  {searchCliente && (
                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                      {filteredClientes.map((cliente) => (
                        <div 
                          key={cliente.id}
                          onClick={() => handleSelectCliente(cliente)}
                          className="p-3 bg-[#1A1A1A] rounded-lg border border-white/5 hover:border-[#D4AF37]/30 cursor-pointer transition-colors"
                          data-testid={`select-cliente-${cliente.id}`}
                        >
                          <p className="text-white font-medium">{cliente.nome}</p>
                          <p className="text-sm text-gray-400">{cliente.cpf}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="bg-[#141414] border border-white/5">
            <CardHeader className="border-b border-white/5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
                  <CardTitle className="text-base font-semibold text-white">Carrinho</CardTitle>
                </div>
                <span className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold rounded">
                  {selectedProdutos.length} itens
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {selectedProdutos.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {selectedProdutos.map((produto) => (
                    <div 
                      key={produto.id}
                      className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg border border-white/5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{produto.modelo_nome}</p>
                        <p className="text-sm text-gray-400 truncate">{produto.cor} • {produto.memoria}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500 font-semibold text-sm">{formatCurrency(produto.preco)}</span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleRemoveProduto(produto.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                          data-testid={`remove-produto-${produto.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6">Carrinho vazio</p>
              )}
            </CardContent>
          </Card>

          {/* Payment & Total */}
          <Card className="bg-[#141414] border border-white/5">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white focus:ring-[#D4AF37]" data-testid="select-pagamento">
                    <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border-white/10">
                    <SelectItem value="dinheiro" className="text-gray-300 focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">Dinheiro</SelectItem>
                    <SelectItem value="pix" className="text-gray-300 focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">PIX</SelectItem>
                    <SelectItem value="cartao_credito" className="text-gray-300 focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito" className="text-gray-300 focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">Cartão de Débito</SelectItem>
                    <SelectItem value="transferencia" className="text-gray-300 focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Observação</Label>
                <Textarea
                  placeholder="Observações sobre a venda..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37] min-h-[60px]"
                  data-testid="input-observacao"
                />
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 uppercase text-sm tracking-wider">Total</span>
                  <span className="text-2xl font-bold text-[#D4AF37]" data-testid="total-value">
                    {formatCurrency(total)}
                  </span>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedCliente || selectedProdutos.length === 0 || !formaPagamento}
                  className="w-full h-12 bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F] disabled:opacity-50"
                  data-testid="btn-finalizar-venda"
                >
                  {submitting ? (
                    "Finalizando..."
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Finalizar Venda
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PontoVenda;
