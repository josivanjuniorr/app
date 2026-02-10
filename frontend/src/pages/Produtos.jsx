import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Search, Edit, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeloFilter, setModeloFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [produtosRes, modelosRes] = await Promise.all([
        axios.get(`${API}/produtos`, { params: { vendido: false } }),
        axios.get(`${API}/modelos`)
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
      await axios.delete(`${API}/produtos/${deleteId}`);
      toast.success("Produto excluído com sucesso");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir produto");
    } finally {
      setDeleteId(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const filteredProdutos = produtos.filter((produto) => {
    const matchesSearch = 
      produto.cor.toLowerCase().includes(search.toLowerCase()) ||
      produto.memoria.toLowerCase().includes(search.toLowerCase()) ||
      produto.modelo_nome?.toLowerCase().includes(search.toLowerCase()) ||
      produto.imei?.toLowerCase().includes(search.toLowerCase());
    
    const matchesModelo = modeloFilter === "all" || produto.modelo_id === modeloFilter;
    
    return matchesSearch && matchesModelo;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="produtos-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Listagem de Produtos</h1>
            <p className="text-sm text-gray-400">Todos os produtos em estoque</p>
          </div>
        </div>
        <Link to="/produtos/novo">
          <Button className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" data-testid="btn-novo-produto">
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar por cor, memória, IMEI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                data-testid="search-produto"
              />
            </div>
            <Select value={modeloFilter} onValueChange={setModeloFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-[#0A0A0A] border-white/10 text-white focus:ring-[#D4AF37]" data-testid="filter-modelo">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por modelo" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-white/10">
                <SelectItem value="all" className="text-gray-300 focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">
                  Todos os modelos
                </SelectItem>
                {modelos.map((modelo) => (
                  <SelectItem 
                    key={modelo.id} 
                    value={modelo.id}
                    className="text-gray-300 focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
                  >
                    {modelo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-0">
          {filteredProdutos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Modelo</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Cor</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Memória</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Bateria</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">IMEI</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Preço</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProdutos.map((produto) => (
                  <TableRow key={produto.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-[#D4AF37] font-medium">{produto.modelo_nome}</TableCell>
                    <TableCell className="text-gray-300">{produto.cor}</TableCell>
                    <TableCell className="text-gray-300">{produto.memoria}</TableCell>
                    <TableCell className="text-gray-300">{produto.bateria ? `${produto.bateria}%` : "-"}</TableCell>
                    <TableCell className="text-gray-400 text-sm font-mono">{produto.imei || "-"}</TableCell>
                    <TableCell className="text-green-500 font-semibold">{formatCurrency(produto.preco)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/produtos/editar/${produto.id}`}>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10" data-testid={`btn-edit-${produto.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => setDeleteId(produto.id)}
                          data-testid={`btn-delete-${produto.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
              <Link to="/produtos/novo">
                <Button className="mt-4 bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#141414] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;
