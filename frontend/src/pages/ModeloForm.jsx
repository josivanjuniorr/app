import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const ModeloForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchModelo();
    }
  }, [id]);

  const fetchModelo = async () => {
    try {
      const response = await axios.get(`${API}/modelos/${id}`);
      setNome(response.data.nome);
    } catch (error) {
      toast.error("Erro ao carregar modelo");
      navigate("/modelos");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("O nome do modelo é obrigatório");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(`${API}/modelos/${id}`, { nome });
        toast.success("Modelo atualizado com sucesso!");
      } else {
        await axios.post(`${API}/modelos`, { nome });
        toast.success("Modelo criado com sucesso!");
      }
      navigate("/modelos");
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao salvar modelo";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="modelo-form-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/modelos">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">
              {isEditing ? "Editar Modelo" : "Novo Modelo"}
            </h1>
            <p className="text-sm text-gray-400">
              {isEditing ? "Atualize as informações do modelo" : "Cadastre um novo modelo de celular"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-[#141414] border border-white/5 max-w-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-300">
                Nome do Modelo
              </Label>
              <Input
                id="nome"
                placeholder="Ex: iPhone 15 Pro Max"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                data-testid="input-nome-modelo"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]"
                data-testid="btn-salvar-modelo"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Link to="/modelos">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 text-gray-300 hover:bg-white/5"
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

export default ModeloForm;
