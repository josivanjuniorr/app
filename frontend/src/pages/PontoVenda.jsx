import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart, Search, User, Package, Plus, X, CreditCard, CheckCircle, Shield, Percent } from "lucide-react";
import { toast } from "sonner";

const PontoVenda = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;
  
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchProduto, setSearchProduto] = useState("");
  const [searchCliente, setSearchCliente] = useState("");
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedProdutos, setSelectedProdutos] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [garantiaMeses, setGarantiaMeses] = useState("0");
  const [garantiaInicio, setGarantiaInicio] = useState(() => new Date().toISOString().split("T")[0]);
  const [desconto, setDesconto] = useState("");
  const [possuiTroca, setPossuiTroca] = useState(false);
  const [trocaModeloId, setTrocaModeloId] = useState("");
  const [trocaCor, setTrocaCor] = useState("");
  const [trocaArmazenamento, setTrocaArmazenamento] = useState("");
  const [trocaMemoriaRam, setTrocaMemoriaRam] = useState("");
  const [trocaBateria, setTrocaBateria] = useState("");
  const [trocaImei, setTrocaImei] = useState("");
  const [trocaValorRecebido, setTrocaValorRecebido] = useState("");

  useEffect(() => { if (lojaSlug) fetchData(); }, [lojaSlug]);

  const fetchData = async () => {
    try {
      const [produtosRes, clientesRes, modelosRes] = await Promise.all([
        axios.get(`${API}/loja/${lojaSlug}/produtos`, { params: { vendido: false } }),
        axios.get(`${API}/loja/${lojaSlug}/clientes`),
        axios.get(`${API}/loja/${lojaSlug}/modelos`)
      ]);
      setProdutos(produtosRes.data);
      setClientes(clientesRes.data);
      setModelos(modelosRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const filteredProdutos = useMemo(() => {
    return produtos.filter((p) => {
      const s = searchProduto.toLowerCase();
      const notSelected = !selectedProdutos.some(sp => sp.id === p.id);
      return notSelected && (
        p.modelo_nome?.toLowerCase().includes(s) ||
        p.cor.toLowerCase().includes(s) ||
        (p.armazenamento || p.memoria || "").toLowerCase().includes(s) ||
        (p.memoria_ram || "").toLowerCase().includes(s)
      );
    });
  }, [produtos, searchProduto, selectedProdutos]);

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const s = searchCliente.toLowerCase();
      return c.nome.toLowerCase().includes(s) || c.cpf.includes(searchCliente) || c.whatsapp.includes(searchCliente);
    });
  }, [clientes, searchCliente]);

  const total = useMemo(() => selectedProdutos.reduce((sum, p) => sum + p.preco, 0), [selectedProdutos]);
  const custoTotal = useMemo(() => selectedProdutos.reduce((sum, p) => sum + (p.valor_compra || 0), 0), [selectedProdutos]);
  const descontoValue = useMemo(() => {
    if (possuiTroca) return parseFloat(trocaValorRecebido) || 0;
    return parseFloat(desconto) || 0;
  }, [desconto, possuiTroca, trocaValorRecebido]);
  const totalComDesconto = useMemo(() => Math.max(0, total - descontoValue), [total, descontoValue]);
  const lucroEstimado = useMemo(() => totalComDesconto - custoTotal, [totalComDesconto, custoTotal]);

  const handleSubmit = async () => {
    if (!selectedCliente) { toast.error("Selecione um cliente"); return; }
    if (selectedProdutos.length === 0) { toast.error("Adicione ao menos um produto"); return; }
    if (!formaPagamento) { toast.error("Selecione a forma de pagamento"); return; }
    if (possuiTroca) {
      const valorRecebido = parseFloat(trocaValorRecebido);
      if (!trocaModeloId) { toast.error("Selecione o modelo do aparelho recebido"); return; }
      if (!trocaCor.trim() || !trocaArmazenamento.trim() || !trocaMemoriaRam.trim()) { toast.error("Cor, armazenamento e memória RAM da troca são obrigatórios"); return; }
      if (isNaN(valorRecebido) || valorRecebido <= 0) { toast.error("Informe um valor recebido válido para a troca"); return; }
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/loja/${lojaSlug}/vendas`, {
        cliente_id: selectedCliente.id,
        produtos: selectedProdutos.map(p => p.id),
        forma_pagamento: formaPagamento,
        observacao: observacao || null,
        garantia_meses: parseInt(garantiaMeses) || 0,
        garantia_inicio: parseInt(garantiaMeses) > 0 && garantiaInicio ? garantiaInicio : null,
        desconto: descontoValue > 0 ? descontoValue : null,
        possui_troca: possuiTroca,
        troca: possuiTroca ? {
          modelo_id: trocaModeloId,
          cor: trocaCor.trim(),
          armazenamento: trocaArmazenamento.trim(),
          memoria_ram: trocaMemoriaRam.trim(),
          bateria: trocaBateria ? parseInt(trocaBateria) : null,
          imei: trocaImei.trim() || null,
          valor_recebido: parseFloat(trocaValorRecebido)
        } : null
      });
      toast.success("Venda finalizada com sucesso!");
      navigate(`/${lojaSlug}/vendas`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao finalizar venda");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37]">Carregando...</div></div>;

  return (
    <div className="space-y-6" data-testid="ponto-venda-page">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-[#D4AF37]" /></div>
        <div><h1 className="text-2xl font-bold text-white font-['Outfit']">Ponto de Venda</h1><p className="text-sm text-gray-400">Realize vendas para seus clientes</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-[#141414] border border-white/5">
            <CardHeader className="border-b border-white/5 py-4"><div className="flex items-center gap-3"><Package className="w-5 h-5 text-blue-500" /><CardTitle className="text-base font-semibold text-white">Produtos Disponíveis</CardTitle></div></CardHeader>
            <CardContent className="p-4">
              <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><Input placeholder="Buscar produto..." value={searchProduto} onChange={(e) => setSearchProduto(e.target.value)} className="pl-10 bg-[#0A0A0A] border-white/10 text-white" data-testid="search-produto-venda" /></div>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredProdutos.length > 0 ? filteredProdutos.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
                    <div className="flex-1"><p className="text-[#D4AF37] font-medium">{produto.modelo_nome}</p><p className="text-sm text-gray-400">{produto.cor} • {produto.armazenamento || produto.memoria} • {produto.memoria_ram || "RAM n/i"}{produto.bateria && ` • ${produto.bateria}%`}</p></div>
                    <div className="flex items-center gap-3"><span className="text-green-500 font-semibold">{formatCurrency(produto.preco)}</span><Button size="sm" onClick={() => setSelectedProdutos([...selectedProdutos, produto])} className="bg-[#D4AF37] text-black hover:bg-[#B5952F]" data-testid={`add-produto-${produto.id}`}><Plus className="w-4 h-4" /></Button></div>
                  </div>
                )) : <p className="text-center text-gray-500 py-8">Nenhum produto disponível</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-[#141414] border border-white/5">
            <CardHeader className="border-b border-white/5 py-4"><div className="flex items-center gap-3"><User className="w-5 h-5 text-green-500" /><CardTitle className="text-base font-semibold text-white">Cliente</CardTitle></div></CardHeader>
            <CardContent className="p-4">
              {selectedCliente ? (
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div><p className="text-white font-medium">{selectedCliente.nome}</p><p className="text-sm text-gray-400">{selectedCliente.whatsapp}</p></div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedCliente(null)} className="text-gray-400 hover:text-red-400" data-testid="remove-cliente"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <>
                  <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><Input placeholder="Buscar cliente..." value={searchCliente} onChange={(e) => setSearchCliente(e.target.value)} className="pl-10 bg-[#0A0A0A] border-white/10 text-white" data-testid="search-cliente-venda" /></div>
                  {searchCliente && <div className="max-h-[200px] overflow-y-auto space-y-2">{filteredClientes.map((c) => (<div key={c.id} onClick={() => { setSelectedCliente(c); setSearchCliente(""); }} className="p-3 bg-[#1A1A1A] rounded-lg border border-white/5 hover:border-[#D4AF37]/30 cursor-pointer" data-testid={`select-cliente-${c.id}`}><p className="text-white font-medium">{c.nome}</p><p className="text-sm text-gray-400">{c.cpf}</p></div>))}</div>}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border border-white/5">
            <CardHeader className="border-b border-white/5 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><ShoppingCart className="w-5 h-5 text-[#D4AF37]" /><CardTitle className="text-base font-semibold text-white">Carrinho</CardTitle></div><span className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold rounded">{selectedProdutos.length} itens</span></div></CardHeader>
            <CardContent className="p-4">
              {selectedProdutos.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedProdutos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg border border-white/5">
                      <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{p.modelo_nome}</p><p className="text-sm text-gray-400 truncate">{p.cor} • {p.armazenamento || p.memoria} • {p.memoria_ram || "RAM n/i"}</p></div>
                      <div className="flex items-center gap-2"><span className="text-green-500 font-semibold text-sm">{formatCurrency(p.preco)}</span><Button size="sm" variant="ghost" onClick={() => setSelectedProdutos(selectedProdutos.filter(sp => sp.id !== p.id))} className="text-gray-400 hover:text-red-400 p-1" data-testid={`remove-produto-${p.id}`}><X className="w-4 h-4" /></Button></div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-gray-500 py-6">Carrinho vazio</p>}
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border border-white/5">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2"><Label className="text-gray-300">Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white" data-testid="select-pagamento"><CreditCard className="w-4 h-4 mr-2 text-gray-500" /><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-[#141414] border-white/10">
                    <SelectItem value="dinheiro" className="text-gray-300">Dinheiro</SelectItem>
                    <SelectItem value="pix" className="text-gray-300">PIX</SelectItem>
                    <SelectItem value="cartao_credito" className="text-gray-300">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito" className="text-gray-300">Cartão de Débito</SelectItem>
                    <SelectItem value="transferencia" className="text-gray-300">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo de Garantia */}
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Garantia
                </Label>
                <Select value={garantiaMeses} onValueChange={setGarantiaMeses}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white" data-testid="select-garantia">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border-white/10">
                    <SelectItem value="0" className="text-gray-300">Sem garantia</SelectItem>
                    <SelectItem value="1" className="text-gray-300">1 mês</SelectItem>
                    <SelectItem value="3" className="text-gray-300">3 meses</SelectItem>
                    <SelectItem value="6" className="text-gray-300">6 meses</SelectItem>
                    <SelectItem value="12" className="text-gray-300">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {parseInt(garantiaMeses) > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Data de início da garantia</Label>
                  <Input
                    type="date"
                    value={garantiaInicio}
                    onChange={(e) => setGarantiaInicio(e.target.value)}
                    className="bg-[#0A0A0A] border-white/10 text-white"
                    data-testid="input-garantia-inicio"
                  />
                </div>
              )}
              
              {/* Campo de Desconto */}
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-green-400" />
                  Desconto (R$)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  disabled={possuiTroca}
                  className="bg-[#0A0A0A] border-white/10 text-white"
                  data-testid="input-desconto"
                />
                {possuiTroca && <p className="text-xs text-yellow-400">Desconto automático pela troca: {formatCurrency(descontoValue)}</p>}
              </div>

              <div className="space-y-3 rounded-lg border border-white/10 p-3 bg-[#101010]">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Possui troca?</Label>
                  <Switch checked={possuiTroca} onCheckedChange={setPossuiTroca} data-testid="switch-possui-troca" />
                </div>
                {possuiTroca && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-gray-300">Modelo do aparelho recebido *</Label>
                      <Select value={trocaModeloId} onValueChange={setTrocaModeloId}>
                        <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white" data-testid="select-troca-modelo">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141414] border-white/10">
                          {modelos.map((m) => (
                            <SelectItem key={m.id} value={m.id} className="text-gray-300">{m.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label className="text-gray-300">Cor *</Label><Input value={trocaCor} onChange={(e) => setTrocaCor(e.target.value)} placeholder="Ex: Preto" className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-troca-cor" /></div>
                    <div className="space-y-2"><Label className="text-gray-300">Armazenamento *</Label><Input value={trocaArmazenamento} onChange={(e) => setTrocaArmazenamento(e.target.value)} placeholder="Ex: 128GB" className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-troca-armazenamento" /></div>
                    <div className="space-y-2"><Label className="text-gray-300">Memória RAM *</Label><Input value={trocaMemoriaRam} onChange={(e) => setTrocaMemoriaRam(e.target.value)} placeholder="Ex: 8GB" className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-troca-memoria-ram" /></div>
                    <div className="space-y-2"><Label className="text-gray-300">Bateria (%)</Label><Input type="number" value={trocaBateria} onChange={(e) => setTrocaBateria(e.target.value)} placeholder="Ex: 85" className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-troca-bateria" /></div>
                    <div className="space-y-2"><Label className="text-gray-300">IMEI</Label><Input value={trocaImei} onChange={(e) => setTrocaImei(e.target.value)} placeholder="Ex: 123456789" className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-troca-imei" /></div>
                    <div className="space-y-2 md:col-span-2"><Label className="text-gray-300">Valor recebido na troca (R$) *</Label><Input type="number" min="0" step="0.01" value={trocaValorRecebido} onChange={(e) => setTrocaValorRecebido(e.target.value)} placeholder="Ex: 1500" className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-troca-valor" /></div>
                    <p className="text-xs text-gray-400 md:col-span-2">O aparelho recebido será cadastrado automaticamente no estoque com este valor como custo e também como desconto da venda.</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2"><Label className="text-gray-300">Observação</Label><Textarea placeholder="Observações..." value={observacao} onChange={(e) => setObservacao(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white min-h-[60px]" data-testid="input-observacao" /></div>
              
              <div className="pt-4 border-t border-white/10">
                {descontoValue > 0 && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Subtotal</span>
                      <span className="text-gray-400">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-500 text-sm">Desconto</span>
                      <span className="text-green-500">-{formatCurrency(descontoValue)}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Custo total</span>
                    <span className="text-gray-400">{formatCurrency(custoTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#D4AF37] text-sm">Lucro estimado</span>
                    <span className="text-[#D4AF37]">{formatCurrency(lucroEstimado)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 uppercase text-sm tracking-wider">Total</span>
                  <span className="text-2xl font-bold text-[#D4AF37]" data-testid="total-value">{formatCurrency(totalComDesconto)}</span>
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !selectedCliente || selectedProdutos.length === 0 || !formaPagamento} className="w-full h-12 bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F] disabled:opacity-50" data-testid="btn-finalizar-venda">
                  {submitting ? "Finalizando..." : <><CheckCircle className="w-5 h-5 mr-2" />Finalizar Venda</>}
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
