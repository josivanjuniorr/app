import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const AdminUsuarioForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [lojas, setLojas] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState("loja_admin");
  const [lojaId, setLojaId] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchLojas();
    if (isEditing) {
      fetchUsuario();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchLojas = async () => {
    try {
      const response = await axios.get(`${API}/admin/lojas`);
      setLojas(response.data);
    } catch (error) {
      toast.error("Erro ao carregar lojas");
    }
  };

  const fetchUsuario = async () => {
    try {
      const response = await axios.get(`${API}/admin/usuarios`);
      const usuario = response.data.find(u => u.id === id);
      if (usuario) {
        setNome(usuario.nome);
        setEmail(usuario.email);
        setRole(usuario.role);
        setLojaId(usuario.loja_id || "");
        setAtivo(usuario.ativo);
      } else {
        toast.error("Usuário não encontrado");
        navigate("/admin/usuarios");
      }
    } catch (error) {
      toast.error("Erro ao carregar usuário");
      navigate("/admin/usuarios");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    if (!isEditing && !senha) {
      toast.error("A senha é obrigatória para novos usuários");
      return;
    }

    if (role === "loja_admin" && !lojaId) {
      toast.error("Selecione uma loja para o admin de loja");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const data = { nome, ativo };
        if (senha) data.senha = senha;
        await axios.put(`${API}/admin/usuarios/${id}`, data);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        await axios.post(`${API}/admin/usuarios`, {
          nome,
          email,
          senha,
          role,
          loja_id: role === "loja_admin" ? lojaId : null
        });
        toast.success("Usuário criado com sucesso!");
      }
      navigate("/admin/usuarios");
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao salvar usuário";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-usuario-form-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/usuarios">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">
              {isEditing ? "Editar Usuário" : "Novo Usuário"}
            </h1>
            <p className="text-sm text-gray-400">
              {isEditing ? "Atualize as informações do usuário" : "Cadastre um novo usuário no sistema"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-[#141414] border border-purple-500/20 max-w-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-300">Nome</Label>
              <Input
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500"
                data-testid="input-nome-usuario"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">E-mail</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEditing}
                className="bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500 disabled:opacity-50"
                data-testid="input-email-usuario"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">
                Senha {isEditing && "(deixe em branco para manter)"}
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500"
                data-testid="input-senha-usuario"
              />
            </div>

            {!isEditing && (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-300">Tipo de Usuário</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="bg-[#0A0A0A] border-purple-500/20 text-white focus:ring-purple-500" data-testid="select-role">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-purple-500/20">
                      <SelectItem value="super_admin" className="text-gray-300 focus:bg-purple-600/10 focus:text-purple-400">
                        Super Admin
                      </SelectItem>
                      <SelectItem value="loja_admin" className="text-gray-300 focus:bg-purple-600/10 focus:text-purple-400">
                        Admin de Loja
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === "loja_admin" && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Loja</Label>
                    <Select value={lojaId} onValueChange={setLojaId}>
                      <SelectTrigger className="bg-[#0A0A0A] border-purple-500/20 text-white focus:ring-purple-500" data-testid="select-loja">
                        <SelectValue placeholder="Selecione a loja" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141414] border-purple-500/20">
                        {lojas.map((loja) => (
                          <SelectItem 
                            key={loja.id} 
                            value={loja.id}
                            className="text-gray-300 focus:bg-purple-600/10 focus:text-purple-400"
                          >
                            {loja.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {isEditing && (
              <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-purple-500/20">
                <div>
                  <Label className="text-gray-300">Status do Usuário</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Usuários inativos não podem fazer login
                  </p>
                </div>
                <Switch
                  checked={ativo}
                  onCheckedChange={setAtivo}
                  data-testid="switch-ativo"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-purple-600 text-white font-bold hover:bg-purple-700"
                data-testid="btn-salvar-usuario"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Link to="/admin/usuarios">
                <Button
                  type="button"
                  variant="outline"
                  className="border-purple-500/30 text-gray-300 hover:bg-purple-600/10"
                >
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsuarioForm;
