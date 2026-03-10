import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Calendar,
  RefreshCcw,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

const toInputDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMesAtualRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    inicio: toInputDateLocal(firstDay),
    fim: toInputDateLocal(now),
  };
};

const Dashboard = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(() => getMesAtualRange().inicio);
  const [dataFim, setDataFim] = useState(() => getMesAtualRange().fim);

  useEffect(() => {
    if (lojaSlug) {
      fetchDashboard();
    }
  }, [lojaSlug, dataInicio, dataFim]);

  const fetchDashboard = async () => {
    try {
      const params = {};
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;
      const response = await axios.get(`${API}/loja/${lojaSlug}/dashboard`, { params });
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

  const handlePeriodoAtual = () => {
    const range = getMesAtualRange();
    setDataInicio(range.inicio);
    setDataFim(range.fim);
  };

  const limparPeriodo = () => {
    setDataInicio("");
    setDataFim("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Dashboard</h1>
          <p className="text-gray-400 mt-1">Visão geral da sua loja</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="bg-transparent text-gray-300 text-sm outline-none" data-testid="periodo-inicio" />
            <span className="text-gray-500 text-xs">até</span>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-transparent text-gray-300 text-sm outline-none" data-testid="periodo-fim" />
          </div>
          <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5" onClick={handlePeriodoAtual} data-testid="btn-periodo-atual">Mês Atual</Button>
          <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 px-3" onClick={fetchDashboard} data-testid="btn-atualizar-dashboard">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5" onClick={limparPeriodo} data-testid="btn-limpar-periodo">Limpar</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-[#141414] border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Modelos</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.total_modelos || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Em Estoque</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.total_produtos || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Clientes</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.total_clientes || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Vendas</p>
                <p className="text-2xl font-bold text-white mt-2">{formatCurrency(stats?.valor_total_vendas)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border border-white/5 hover:border-green-500/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Lucro Est. Período</p>
                <p className="text-2xl font-bold text-green-500 mt-2">{formatCurrency(stats?.lucro_estimado_periodo)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modelos sem Estoque */}
        <Card className="bg-[#141414] border border-white/5">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <CardTitle className="text-lg font-semibold text-white">Modelos sem Estoque</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {stats?.modelos_sem_estoque?.length > 0 ? (
              <ul className="space-y-3">
                {stats.modelos_sem_estoque.map((modelo) => (
                  <li key={modelo.id} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg border border-white/5">
                    <span className="text-gray-300">{modelo.nome}</span>
                    <Link to={`/${lojaSlug}/modelos/${modelo.id}`}>
                      <Button size="sm" variant="ghost" className="text-[#D4AF37] hover:bg-[#D4AF37]/10">
                        Adicionar <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-6">Todos os modelos possuem estoque</p>
            )}
          </CardContent>
        </Card>

        {/* Modelos Mais Vendidos */}
        <Card className="bg-[#141414] border border-white/5">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <CardTitle className="text-lg font-semibold text-white">Mais Vendidos</CardTitle>
              </div>
              <span className="text-xs text-gray-500">Considera o período selecionado acima</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {stats?.top_modelos?.length > 0 ? (
              <ul className="space-y-3">
                {stats.top_modelos.slice(0, 5).map((modelo, index) => (
                  <li key={modelo.modelo_id} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{modelo.nome}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{modelo.quantidade} vendas</p>
                      <p className="text-xs text-gray-500">{formatCurrency(modelo.valor)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-6">Nenhuma venda registrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modelos com Estoque */}
      <Card className="bg-[#141414] border border-white/5">
        <CardHeader className="border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-green-500" />
            </div>
            <CardTitle className="text-lg font-semibold text-white">Modelos com Estoque</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {stats?.modelos_com_estoque?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stats.modelos_com_estoque.map((modelo) => (
                <Link key={modelo.id} to={`/${lojaSlug}/modelos/${modelo.id}`}>
                  <div className="p-4 bg-[#1A1A1A] rounded-lg border border-white/5 hover:border-[#D4AF37]/30 transition-all group">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-300 font-medium group-hover:text-[#D4AF37] transition-colors">{modelo.nome}</p>
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-semibold rounded">
                        {modelo.quantidade_produtos}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">Nenhum modelo com estoque</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
