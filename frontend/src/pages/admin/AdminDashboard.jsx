import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  Users, 
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Plus
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`);
      setStats(response.data);
    } catch (error) {
      toast.error("Erro ao carregar dashboard");
      console.error(error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Dashboard Admin</h1>
          <p className="text-gray-400 mt-1">Visão geral do sistema CellControl</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/lojas/nova">
            <Button className="bg-purple-600 text-white font-bold hover:bg-purple-700" data-testid="btn-nova-loja">
              <Plus className="w-4 h-4 mr-2" />
              Nova Loja
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#141414] border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Lojas</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.total_lojas || 0}</p>
                <p className="text-xs text-green-500 mt-1">{stats?.lojas_ativas || 0} ativas</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-600/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Usuários</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.total_usuarios || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Vendas Totais</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.total_vendas_global || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Faturamento</p>
                <p className="text-2xl font-bold text-white mt-2">{formatCurrency(stats?.valor_total_global)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stores Table */}
      <Card className="bg-[#141414] border border-purple-500/20">
        <CardHeader className="border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg font-semibold text-white">Performance por Loja</CardTitle>
            </div>
            <Link to="/admin/lojas">
              <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-600/10">
                Ver todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.lojas?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-gray-400 uppercase text-xs tracking-wider font-medium px-6 py-4">Loja</th>
                    <th className="text-center text-gray-400 uppercase text-xs tracking-wider font-medium px-6 py-4">Status</th>
                    <th className="text-center text-gray-400 uppercase text-xs tracking-wider font-medium px-6 py-4">Produtos</th>
                    <th className="text-center text-gray-400 uppercase text-xs tracking-wider font-medium px-6 py-4">Clientes</th>
                    <th className="text-center text-gray-400 uppercase text-xs tracking-wider font-medium px-6 py-4">Vendas</th>
                    <th className="text-right text-gray-400 uppercase text-xs tracking-wider font-medium px-6 py-4">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lojas.map((loja) => (
                    <tr key={loja.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{loja.nome}</p>
                          <p className="text-xs text-gray-500">/{loja.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          loja.ativo 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {loja.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-300">{loja.total_produtos}</td>
                      <td className="px-6 py-4 text-center text-gray-300">{loja.total_clientes}</td>
                      <td className="px-6 py-4 text-center text-gray-300">{loja.total_vendas}</td>
                      <td className="px-6 py-4 text-right text-[#D4AF37] font-semibold">
                        {formatCurrency(loja.valor_total_vendas)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Store className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma loja cadastrada</p>
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

export default AdminDashboard;
