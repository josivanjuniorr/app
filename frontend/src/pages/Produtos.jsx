import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Search, Edit, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";

const Produtos = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;
  
  const [produtos, setProdutos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeloFilter, setModeloFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { if (lojaSlug) fetchData(); }, [lojaSlug]);

  const fetchData = async () => {
    try {
      const [produtosRes, modelosRes] = await Promise.all([
        axios.get(`${API}/loja/${lojaSlug}/produtos`, { params: { vendido: false } }),
        axios.get(`${API}/loja/${lojaSlug}/modelos`)
      ]);
      setProdutos(produtosRes.data);
      setModelos(modelosRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
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

  const filteredProdutos = produtos.filter((produto) => {
    const matchesSearch = produto.cor.toLowerCase().includes(search.toLowerCase()) || produto.memoria.toLowerCase().includes(search.toLowerCase()) || produto.modelo_nome?.toLowerCase().includes(search.toLowerCase());
    const matchesModelo = modeloFilter === "all" || produto.modelo_id === modeloFilter;
    return matchesSearch && matchesModelo;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37]">Carregando...</div></div>;

  return (
    <div className="space-y-6" data-testid="produtos-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Package className="w-5 h-5 text-blue-500" /></div>
          <div><h1 className="text-2xl font-bold text-white font-['Outfit']">Produtos</h1><p className="text-sm text-gray-400">Todos os produtos em estoque</p></div>
        </div>
        <Link to={`/${lojaSlug}/produtos/novo`}><Button className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" data-testid="btn-novo-produto"><Plus className="w-4 h-4 mr-2" />Novo Produto</Button></Link>
      </div>

      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-[#0A0A0A] border-white/10 text-white" data-testid="search-produto" /></div>
            <Select value={modeloFilter} onValueChange={setModeloFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-[#0A0A0A] border-white/10 text-white" data-testid="filter-modelo"><Filter className="w-4 h-4 mr-2 text-gray-500" /><SelectValue placeholder="Filtrar" /></SelectTrigger>
              <SelectContent className="bg-[#141414] border-white/10"><SelectItem value="all" className="text-gray-300">Todos</SelectItem>{modelos.map((m) => (<SelectItem key={m.id} value={m.id} className="text-gray-300">{m.nome}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-0">
          {filteredProdutos.length > 0 ? (
            <Table>
              <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 uppercase text-xs">Modelo</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Cor</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Memória</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Bateria</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Preço</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredProdutos.map((produto) => (
                  <TableRow key={produto.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-[#D4AF37] font-medium">{produto.modelo_nome}</TableCell>
                    <TableCell className="text-gray-300">{produto.cor}</TableCell>
                    <TableCell className="text-gray-300">{produto.memoria}</TableCell>
                    <TableCell className="text-gray-300">{produto.bateria ? `${produto.bateria}%` : "-"}</TableCell>
                    <TableCell className="text-green-500 font-semibold">{formatCurrency(produto.preco)}</TableCell>
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
            <div className="p-12 text-center"><Package className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-500">Nenhum produto encontrado</p></div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#141414] border border-white/10">
          <AlertDialogHeader><AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle><AlertDialogDescription className="text-gray-400">Tem certeza?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="bg-white/5 border-white/10 text-gray-300">Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;
