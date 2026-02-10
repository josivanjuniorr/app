import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, ArrowLeft, Printer, Calendar, User, CreditCard, Package, DollarSign, FileText, Store } from "lucide-react";
import { toast } from "sonner";

const VendaDetail = () => {
  const { slug, id } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;
  const printRef = useRef();
  
  const [venda, setVenda] = useState(null);
  const [lojaNome, setLojaNome] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (lojaSlug && id) fetchData(); }, [lojaSlug, id]);

  const fetchData = async () => {
    try {
      const [vendaRes, lojaRes] = await Promise.all([
        axios.get(`${API}/loja/${lojaSlug}/vendas/${id}`),
        axios.get(`${API}/loja/${lojaSlug}/verify`)
      ]);
      setVenda(vendaRes.data);
      setLojaNome(lojaRes.data.nome);
    } catch (error) {
      toast.error("Erro ao carregar venda");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
        <Button onClick={handlePrint} className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" data-testid="btn-imprimir"><Printer className="w-4 h-4 mr-2" />Imprimir</Button>
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
          <Card className="bg-[#141414] border border-white/5"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-purple-500" /></div><div><p className="text-xs text-gray-500 uppercase tracking-wider">Pagamento</p><p className="text-white font-medium">{formatPayment(venda.forma_pagamento)}</p></div></div></CardContent></Card>
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

        {venda.observacao && (
          <Card className="bg-[#141414] border border-white/5">
            <CardHeader className="border-b border-white/5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-gray-500" /></div><CardTitle className="text-lg font-semibold text-white">Observação</CardTitle></div></CardHeader>
            <CardContent className="p-6"><p className="text-gray-300">{venda.observacao}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VendaDetail;
