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
import { Store, Plus, Search, Edit, Power } from "lucide-react";
import { toast } from "sonner";

const AdminLojas = () => {
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLojas();
  }, []);

  const fetchLojas = async () => {
    try {
      const response = await axios.get(`${API}/admin/lojas`);
      setLojas(response.data);
    } catch (error) {
      toast.error("Erro ao carregar lojas");
    } finally {
      setLoading(false);
    }
  };

  const toggleLojaStatus = async (lojaId, currentStatus) => {
    try {
      await axios.put(`${API}/admin/lojas/${lojaId}`, { ativo: !currentStatus });
      toast.success(currentStatus ? "Loja desativada" : "Loja ativada");
      fetchLojas();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const filteredLojas = lojas.filter((loja) =>
    loja.nome.toLowerCase().includes(search.toLowerCase()) ||
    loja.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-lojas-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Lojas</h1>
            <p className="text-sm text-gray-400">Gerencie as lojas do sistema</p>
          </div>
        </div>
        <Link to="/admin/lojas/nova">
          <Button className="bg-purple-600 text-white font-bold hover:bg-purple-700" data-testid="btn-nova-loja">
            <Plus className="w-4 h-4 mr-2" />
            Nova Loja
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-[#141414] border border-purple-500/20">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar loja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500"
              data-testid="search-loja"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#141414] border border-purple-500/20">
        <CardContent className="p-0">
          {filteredLojas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium">Loja</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-center">Status</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-center">Produtos</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-center">Clientes</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-center">Vendas</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-right">Faturamento</TableHead>
                  <TableHead className="text-gray-400 uppercase text-xs tracking-wider font-medium text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLojas.map((loja) => (
                  <TableRow key={loja.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{loja.nome}</p>
                        <p className="text-xs text-gray-500">/{loja.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        loja.ativo 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {loja.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-gray-300">{loja.total_produtos}</TableCell>
                    <TableCell className="text-center text-gray-300">{loja.total_clientes}</TableCell>
                    <TableCell className="text-center text-gray-300">{loja.total_vendas}</TableCell>
                    <TableCell className="text-right text-[#D4AF37] font-semibold">
                      {formatCurrency(loja.valor_total_vendas)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/lojas/editar/${loja.id}`}>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-purple-400 hover:bg-purple-400/10">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className={`${loja.ativo 
                            ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10' 
                            : 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                          }`}
                          onClick={() => toggleLojaStatus(loja.id, loja.ativo)}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Store className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma loja encontrada</p>
              <Link to="/admin/lojas/nova">
                <Button className="mt-4 bg-purple-600 text-white font-bold hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Loja
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLojas;
