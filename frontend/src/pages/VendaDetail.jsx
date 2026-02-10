import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, ArrowLeft, Printer, Calendar, User, CreditCard, Package, DollarSign, FileText, Edit, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";

const VendaDetail = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;
  const printRef = useRef();
  
  const [venda, setVenda] = useState(null);
  const [lojaNome, setLojaNome] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormaPagamento, setEditFormaPagamento] = useState("");
  const [editObservacao, setEditObservacao] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (lojaSlug && id) fetchData(); }, [lojaSlug, id]);

  const fetchData = async () => {
    try {
      const [vendaRes, lojaRes] = await Promise.all([
        axios.get(`${API}/loja/${lojaSlug}/vendas/${id}`),
        axios.get(`${API}/loja/${lojaSlug}/verify`)
      ]);
      setVenda(vendaRes.data);
      setLojaNome(lojaRes.data.nome);
      setEditFormaPagamento(vendaRes.data.forma_pagamento);
      setEditObservacao(vendaRes.data.observacao || "");
    } catch (error) {
      toast.error("Erro ao carregar venda");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormaPagamento(venda.forma_pagamento);
    setEditObservacao(venda.observacao || "");
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`${API}/loja/${lojaSlug}/vendas/${id}`, {
        forma_pagamento: editFormaPagamento,
        observacao: editObservacao || null
      });
      setVenda(response.data);
      setIsEditing(false);
      toast.success("Venda atualizada com sucesso!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao atualizar venda");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/loja/${lojaSlug}/vendas/${id}`);
      toast.success("Venda excluída com sucesso! Produtos retornados ao estoque.");
      navigate(`/${lojaSlug}/vendas`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir venda");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatPayment = (p) => ({ 'dinheiro': 'Dinheiro', 'pix': 'PIX', 'cartao_credito': 'Cartão de Crédito', 'cartao_debito': 'Cartão de Débito', 'transferencia': 'Transferência' }[p] || p);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37]">Carregando...</div></div>;
  if (!venda) return <div className="flex items-center justify-center h-64"><div className="text-red-500">Venda não encontrada</div></div>;

  return (
    <div className="space-y-6" data-testid="venda-detail-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Link to={`/${lojaSlug}/vendas`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Receipt className="w-5 h-5 text-purple-500" /></div>
            <div><h1 className="text-2xl font-bold text-white font-['Outfit']">Detalhes da Venda</h1><p className="text-sm text-gray-400">ID: {venda.id.slice(0, 8)}...</p></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button onClick={handleEdit} variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10" data-testid="btn-editar">
                <Edit className="w-4 h-4 mr-2" />Editar
              </Button>
              <Button onClick={() => setShowDeleteDialog(true)} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" data-testid="btn-excluir">
                <Trash2 className="w-4 h-4 mr-2" />Excluir
              </Button>
              <Button onClick={handlePrint} className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" data-testid="btn-imprimir">
                <Printer className="w-4 h-4 mr-2" />Imprimir
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancelEdit} variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5" data-testid="btn-cancelar">
                <X className="w-4 h-4 mr-2" />Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="bg-green-600 text-white font-bold hover:bg-green-700" data-testid="btn-salvar">
                <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div ref={printRef} className="print-content">
        {/* Print Header - Only visible when printing */}
        <div className="print-header">
          <h1>{lojaNome || lojaSlug}</h1>
          <p>Comprovante de Venda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#141414] border border-white/5"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-blue-500" /></div><div><p className="text-xs text-gray-500 uppercase tracking-wider">Data</p><p className="text-white font-medium">{formatDate(venda.data)}</p></div></div></CardContent></Card>
          <Card className="bg-[#141414] border border-white/5"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><User className="w-5 h-5 text-green-500" /></div><div><p className="text-xs text-gray-500 uppercase tracking-wider">Cliente</p><p className="text-white font-medium">{venda.cliente_nome}</p></div></div></CardContent></Card>
          
          {/* Payment - Editable */}
          <Card className="bg-[#141414] border border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-purple-500" /></div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Pagamento</p>
                  {isEditing ? (
                    <Select value={editFormaPagamento} onValueChange={setEditFormaPagamento}>
                      <SelectTrigger className="h-8 mt-1 bg-[#0A0A0A] border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-white/10">
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-white font-medium">{formatPayment(venda.forma_pagamento)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#141414] border border-white/5"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-[#D4AF37]" /></div><div><p className="text-xs text-gray-500 uppercase tracking-wider">Total</p><p className="text-[#D4AF37] font-bold text-lg">{formatCurrency(venda.valor_total)}</p></div></div></CardContent></Card>
        </div>

        <Card className="bg-[#141414] border border-white/5 mb-6">
          <CardHeader className="border-b border-white/5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Package className="w-5 h-5 text-blue-500" /></div><CardTitle className="text-lg font-semibold text-white">Itens da Venda</CardTitle></div></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 uppercase text-xs">Modelo</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Cor</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Memória</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs text-right">Preço</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {venda.itens_parsed?.map((item, index) => (
                  <TableRow key={index} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-[#D4AF37] font-medium">{item.modelo_nome}</TableCell>
                    <TableCell className="text-gray-300">{item.cor}</TableCell>
                    <TableCell className="text-gray-300">{item.memoria}</TableCell>
                    <TableCell className="text-green-500 font-semibold text-right">{formatCurrency(item.preco)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-white/5 bg-white/5">
                  <TableCell colSpan={3} className="text-right text-gray-400 uppercase text-sm font-semibold">Total</TableCell>
                  <TableCell className="text-[#D4AF37] font-bold text-lg text-right">{formatCurrency(venda.valor_total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Observation - Editable */}
        <Card className="bg-[#141414] border border-white/5">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-gray-500" /></div>
              <CardTitle className="text-lg font-semibold text-white">Observação</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isEditing ? (
              <Textarea
                placeholder="Adicione uma observação..."
                value={editObservacao}
                onChange={(e) => setEditObservacao(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white min-h-[100px]"
                data-testid="input-observacao"
              />
            ) : (
              <p className="text-gray-300">{venda.observacao || "Nenhuma observação"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#141414] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-400">Excluir Venda</DialogTitle>
            <DialogDescription className="text-gray-400">
              Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
              <br /><br />
              <span className="text-yellow-500 font-medium">Os produtos serão devolvidos ao estoque.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[#0A0A0A] p-4 rounded-lg border border-white/5 my-4">
            <p className="text-sm text-gray-400">Venda de <span className="text-white font-medium">{formatCurrency(venda.valor_total)}</span></p>
            <p className="text-sm text-gray-400">Cliente: <span className="text-white">{venda.cliente_nome}</span></p>
            <p className="text-sm text-gray-400">Data: <span className="text-white">{formatDate(venda.data)}</span></p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-white/10 text-gray-300 hover:bg-white/5" data-testid="btn-cancelar-delete">
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white hover:bg-red-700" data-testid="btn-confirmar-delete">
              {deleting ? "Excluindo..." : "Excluir Venda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendaDetail;
