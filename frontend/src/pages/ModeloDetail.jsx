import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Smartphone, ArrowLeft, Plus, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

const ModeloDetail = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;
  
  const [modelo, setModelo] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [cor, setCor] = useState("");
  const [memoria, setMemoria] = useState("");
  const [bateria, setBateria] = useState("");
  const [imei, setImei] = useState("");
  const [preco, setPreco] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (lojaSlug && id) fetchData(); }, [lojaSlug, id]);

  const fetchData = async () => {
    try {
      const [modeloRes, produtosRes] = await Promise.all([
        axios.get(`${API}/loja/${lojaSlug}/modelos/${id}`),
        axios.get(`${API}/loja/${lojaSlug}/produtos`, { params: { modelo_id: id, vendido: false } })
      ]);
      setModelo(modeloRes.data);
      setProdutos(produtosRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
      navigate(`/${lojaSlug}/modelos`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduto = async (e) => {
    e.preventDefault();
    if (!cor.trim() || !memoria.trim()) { toast.error("Cor e memória são obrigatórios"); return; }
    const precoNum = parseFloat(preco.replace(",", "."));
    if (isNaN(precoNum) || precoNum <= 0) { toast.error("Preço inválido"); return; }

    setSubmitting(true);
    try {
      await axios.post(`${API}/loja/${lojaSlug}/produtos`, {
        modelo_id: id, cor: cor.trim(), memoria: memoria.trim(),
        bateria: bateria ? parseInt(bateria) : null, imei: imei.trim() || null, preco: precoNum
      });
      toast.success("Produto cadastrado!");
      setCor(""); setMemoria(""); setBateria(""); setImei(""); setPreco(""); setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao cadastrar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/loja/${lojaSlug}/produtos/${deleteId}`);
      toast.success("Produto excluído");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir");
    } finally {
      setDeleteId(null);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37]">Carregando...</div></div>;

  return (
    <div className="space-y-6" data-testid="modelo-detail-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/${lojaSlug}/modelos`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center"><Smartphone className="w-5 h-5 text-[#D4AF37]" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Outfit']">{modelo?.nome}</h1>
              <p className="text-sm text-gray-400">{modelo?.quantidade_produtos || 0} produtos em estoque</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" data-testid="btn-add-produto">
          <Plus className="w-4 h-4 mr-2" />Adicionar Produto
        </Button>
      </div>

      {showForm && (
        <Card className="bg-[#141414] border border-white/5 animate-fade-in">
          <CardHeader className="border-b border-white/5"><CardTitle className="text-lg font-semibold text-white">Novo Produto</CardTitle></CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAddProduto} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2"><Label className="text-gray-300">Cor *</Label><Input placeholder="Ex: Preto" value={cor} onChange={(e) => setCor(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-cor" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Memória *</Label><Input placeholder="Ex: 128GB" value={memoria} onChange={(e) => setMemoria(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-memoria" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Bateria (%)</Label><Input type="number" placeholder="Ex: 100" value={bateria} onChange={(e) => setBateria(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-bateria" /></div>
              <div className="space-y-2"><Label className="text-gray-300">IMEI</Label><Input placeholder="Ex: 123456789" value={imei} onChange={(e) => setImei(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-imei" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Preço *</Label><Input placeholder="Ex: 5999" value={preco} onChange={(e) => setPreco(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-preco" /></div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={submitting} className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" data-testid="btn-salvar-produto">{submitting ? "Salvando..." : "Salvar"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-gray-300 hover:bg-white/5">Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#141414] border border-white/5">
        <CardHeader className="border-b border-white/5">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Package className="w-5 h-5 text-blue-500" /></div><CardTitle className="text-lg font-semibold text-white">Produtos em Estoque</CardTitle></div>
        </CardHeader>
        <CardContent className="p-0">
          {produtos.length > 0 ? (
            <Table>
              <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 uppercase text-xs">Cor</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Memória</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Bateria</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">IMEI</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Preço</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-gray-300">{produto.cor}</TableCell>
                    <TableCell className="text-gray-300">{produto.memoria}</TableCell>
                    <TableCell className="text-gray-300">{produto.bateria ? `${produto.bateria}%` : "-"}</TableCell>
                    <TableCell className="text-gray-400 text-sm font-mono">{produto.imei || "-"}</TableCell>
                    <TableCell className="text-[#D4AF37] font-semibold">{formatCurrency(produto.preco)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/${lojaSlug}/produtos/editar/${produto.id}`}><Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"><Edit className="w-4 h-4" /></Button></Link>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400 hover:bg-red-400/10" onClick={() => setDeleteId(produto.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center"><Package className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-500">Nenhum produto em estoque</p><Button className="mt-4 bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Adicionar Produto</Button></div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#141414] border border-white/10">
          <AlertDialogHeader><AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle><AlertDialogDescription className="text-gray-400">Tem certeza que deseja excluir este produto?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ModeloDetail;
