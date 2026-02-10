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
import { Smartphone, Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

const Modelos = () => {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchModelos();
  }, []);

  const fetchModelos = async () => {
    try {
      const response = await axios.get(`${API}/modelos`);
      setModelos(response.data);
    } catch (error) {
      toast.error("Erro ao carregar modelos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await axios.delete(`${API}/modelos/${deleteId}`);
      toast.success("Modelo excluído com sucesso");
      fetchModelos();
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao excluir modelo";
      toast.error(message);
    } finally {
      setDeleteId(null);
    }
  };

  const filteredModelos = modelos.filter((modelo) =>
    modelo.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="modelos-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Modelos</h1>
            <p className="text-sm text-gray-400">Gerencie os modelos de celulares</p>
          </div>
        </div>
        <Link to="/modelos/novo">
          <Button className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" data-testid="btn-novo-modelo">
            <Plus className="w-4 h-4 mr-2" />
            Novo Modelo
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
              data-testid="search-modelo"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-0">
          {filteredModelos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Nome</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-center">Quantidade</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModelos.map((modelo) => (
                  <TableRow key={modelo.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-gray-300 font-medium">{modelo.nome}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        modelo.quantidade_produtos > 0 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {modelo.quantidade_produtos}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/modelos/${modelo.id}`}>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10" data-testid={`btn-view-${modelo.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link to={`/modelos/editar/${modelo.id}`}>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10" data-testid={`btn-edit-${modelo.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => setDeleteId(modelo.id)}
                          data-testid={`btn-delete-${modelo.id}`}
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
              <Smartphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum modelo encontrado</p>
              <Link to="/modelos/novo">
                <Button className="mt-4 bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Modelo
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
              Tem certeza que deseja excluir este modelo? Esta ação não pode ser desfeita.
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

export default Modelos;
