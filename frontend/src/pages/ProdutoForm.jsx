import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const ProdutoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [modelos, setModelos] = useState([]);
  const [modeloId, setModeloId] = useState("");
  const [cor, setCor] = useState("");
  const [memoria, setMemoria] = useState("");
  const [bateria, setBateria] = useState("");
  const [imei, setImei] = useState("");
  const [preco, setPreco] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchModelos();
    if (isEditing) {
      fetchProduto();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchModelos = async () => {
    try {
      const response = await axios.get(`${API}/modelos`);
      setModelos(response.data);
    } catch (error) {
      toast.error("Erro ao carregar modelos");
    }
  };

  const fetchProduto = async () => {
    try {
      const response = await axios.get(`${API}/produtos/${id}`);
      const produto = response.data;
      setModeloId(produto.modelo_id);
      setCor(produto.cor);
      setMemoria(produto.memoria);
      setBateria(produto.bateria?.toString() || "");
      setImei(produto.imei || "");
      setPreco(produto.preco?.toString().replace(".", ",") || "");
    } catch (error) {
      toast.error("Erro ao carregar produto");
      navigate("/produtos");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cor.trim() || !memoria.trim()) {
      toast.error("Cor e memória são obrigatórios");
      return;
    }

    const precoNum = parseFloat(preco.replace(",", "."));
    if (isNaN(precoNum) || precoNum <= 0) {
      toast.error("Preço inválido");
      return;
    }

    if (!isEditing && !modeloId) {
      toast.error("Selecione um modelo");
      return;
    }

    setLoading(true);
    try {
      const data = {
        cor: cor.trim(),
        memoria: memoria.trim(),
        bateria: bateria ? parseInt(bateria) : null,
        imei: imei.trim() || null,
        preco: precoNum
      };

      if (isEditing) {
        await axios.put(`${API}/produtos/${id}`, data);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await axios.post(`${API}/produtos`, { ...data, modelo_id: modeloId });
        toast.success("Produto criado com sucesso!");
      }
      navigate("/produtos");
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao salvar produto";
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
    <div className="space-y-6" data-testid="produto-form-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/produtos">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">
              {isEditing ? "Editar Produto" : "Novo Produto"}
            </h1>
            <p className="text-sm text-gray-400">
              {isEditing ? "Atualize as informações do produto" : "Cadastre um novo produto"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-[#141414] border border-white/5 max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isEditing && (
              <div className="space-y-2">
                <Label className="text-gray-300">Modelo *</Label>
                <Select value={modeloId} onValueChange={setModeloId}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white focus:ring-[#D4AF37]" data-testid="select-modelo">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border-white/10">
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Cor *</Label>
                <Input
                  placeholder="Ex: Preto, Dourado"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                  data-testid="input-cor"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Memória *</Label>
                <Input
                  placeholder="Ex: 128GB, 256GB"
                  value={memoria}
                  onChange={(e) => setMemoria(e.target.value)}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                  data-testid="input-memoria"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Bateria (%)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 100"
                  value={bateria}
                  onChange={(e) => setBateria(e.target.value)}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                  data-testid="input-bateria"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Preço *</Label>
                <Input
                  placeholder="Ex: 5.999,00"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                  data-testid="input-preco"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">IMEI</Label>
              <Input
                placeholder="Ex: 123456789012345"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                data-testid="input-imei"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]"
                data-testid="btn-salvar-produto"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Link to="/produtos">
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

export default ProdutoForm;
