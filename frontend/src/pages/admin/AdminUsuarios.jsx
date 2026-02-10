import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
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
import { Users, Plus, Search, Edit, Trash2, Shield, Store } from "lucide-react";
import { toast } from "sonner";

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${API}/admin/usuarios`);
      setUsuarios(response.data);
    } catch (error) {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await axios.delete(`${API}/admin/usuarios/${deleteId}`);
      toast.success("Usuário excluído com sucesso");
      fetchUsuarios();
    } catch (error) {
      toast.error("Erro ao excluir usuário");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) =>
    usuario.nome.toLowerCase().includes(search.toLowerCase()) ||
    usuario.email.toLowerCase().includes(search.toLowerCase()) ||
    usuario.loja_nome?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-usuarios-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Usuários</h1>
            <p className="text-sm text-gray-400">Gerencie os usuários do sistema</p>
          </div>
        </div>
        <Link to="/admin/usuarios/novo">
          <Button className="bg-purple-600 text-white font-bold hover:bg-purple-700" data-testid="btn-novo-usuario">
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-[#141414] border border-purple-500/20">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500"
              data-testid="search-usuario"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#141414] border border-purple-500/20">
        <CardContent className="p-0">
          {filteredUsuarios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Usuário</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Tipo</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Loja</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-center">Status</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{usuario.nome}</p>
                        <p className="text-xs text-gray-500">{usuario.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {usuario.role === "super_admin" ? (
                          <>
                            <Shield className="w-4 h-4 text-purple-500" />
                            <span className="text-purple-400">Super Admin</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-4 h-4 text-[#D4AF37]" />
                            <span className="text-[#D4AF37]">Admin Loja</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {usuario.loja_nome || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        usuario.ativo 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/usuarios/editar/${usuario.id}`}>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-purple-400 hover:bg-purple-400/10">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => setDeleteId(usuario.id)}
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
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
              <Link to="/admin/usuarios/novo">
                <Button className="mt-4 bg-purple-600 text-white font-bold hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Usuário
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#141414] border border-purple-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-purple-500/20 text-gray-300 hover:bg-white/10">
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

export default AdminUsuarios;
