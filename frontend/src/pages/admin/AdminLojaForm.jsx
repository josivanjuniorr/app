import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Store, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const AdminLojaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchLoja();
    }
  }, [id]);

  const fetchLoja = async () => {
    try {
      const response = await axios.get(`${API}/admin/lojas/${id}`);
      setNome(response.data.nome);
      setSlug(response.data.slug);
      setAtivo(response.data.ativo);
    } catch (error) {
      toast.error("Erro ao carregar loja");
      navigate("/admin/lojas");
    } finally {
      setFetching(false);
    }
  };

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '');
  };

  const handleNomeChange = (e) => {
    const value = e.target.value;
    setNome(value);
    if (!isEditing) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("O nome da loja é obrigatório");
      return;
    }

    if (!slug.trim()) {
      toast.error("O slug é obrigatório");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(`${API}/admin/lojas/${id}`, { nome, ativo });
        toast.success("Loja atualizada com sucesso!");
      } else {
        await axios.post(`${API}/admin/lojas`, { nome, slug });
        toast.success("Loja criada com sucesso!");
      }
      navigate("/admin/lojas");
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao salvar loja";
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
    <div className="space-y-6" data-testid="admin-loja-form-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/lojas">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">
              {isEditing ? "Editar Loja" : "Nova Loja"}
            </h1>
            <p className="text-sm text-gray-400">
              {isEditing ? "Atualize as informações da loja" : "Cadastre uma nova loja no sistema"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-[#141414] border border-purple-500/20 max-w-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-300">
                Nome da Loja
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Loja Central"
                value={nome}
                onChange={handleNomeChange}
                className="bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500"
                data-testid="input-nome-loja"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-gray-300">
                Slug (URL)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">/</span>
                <Input
                  id="slug"
                  placeholder="lojacentral"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  disabled={isEditing}
                  className="bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500 disabled:opacity-50"
                  data-testid="input-slug-loja"
                />
              </div>
              <p className="text-xs text-gray-500">
                URL de acesso: /{slug || "slug"}
              </p>
            </div>

            {isEditing && (
              <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-purple-500/20">
                <div>
                  <Label className="text-gray-300">Status da Loja</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Lojas inativas não podem ser acessadas
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
                data-testid="btn-salvar-loja"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Link to="/admin/lojas">
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

export default AdminLojaForm;
