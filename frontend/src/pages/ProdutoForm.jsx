import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const ProdutoForm = () => {
  const navigate = useNavigate();
  const { slug, id } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;
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
    if (lojaSlug) {
      fetchModelos();
      if (isEditing) fetchProduto();
      else setFetching(false);
    }
  }, [lojaSlug, id]);

  const fetchModelos = async () => {
    try {
      const response = await axios.get(`${API}/loja/${lojaSlug}/modelos`);
      setModelos(response.data);
    } catch (error) {
      toast.error("Erro ao carregar modelos");
    }
  };

  const fetchProduto = async () => {
    try {
      const response = await axios.get(`${API}/loja/${lojaSlug}/produtos/${id}`);
      const p = response.data;
      setModeloId(p.modelo_id);
      setCor(p.cor);
      setMemoria(p.memoria);
      setBateria(p.bateria?.toString() || "");
      setImei(p.imei || "");
      setPreco(p.preco?.toString().replace(".", ",") || "");
    } catch (error) {
      toast.error("Erro ao carregar produto");
      navigate(`/${lojaSlug}/produtos`);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cor.trim() || !memoria.trim()) { toast.error("Cor e memória são obrigatórios"); return; }
    const precoNum = parseFloat(preco.replace(",", "."));
    if (isNaN(precoNum) || precoNum <= 0) { toast.error("Preço inválido"); return; }
    if (!isEditing && !modeloId) { toast.error("Selecione um modelo"); return; }

    setLoading(true);
    try {
      const data = { cor: cor.trim(), memoria: memoria.trim(), bateria: bateria ? parseInt(bateria) : null, imei: imei.trim() || null, preco: precoNum };
      if (isEditing) {
        await axios.put(`${API}/loja/${lojaSlug}/produtos/${id}`, data);
        toast.success("Produto atualizado!");
      } else {
        await axios.post(`${API}/loja/${lojaSlug}/produtos`, { ...data, modelo_id: modeloId });
        toast.success("Produto criado!");
      }
      navigate(`/${lojaSlug}/produtos`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37]">Carregando...</div></div>;

  return (
    <div className="space-y-6" data-testid="produto-form-page">
      <div className="flex items-center gap-4">
        <Link to={`/${lojaSlug}/produtos`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Package className="w-5 h-5 text-blue-500" /></div>
          <div><h1 className="text-2xl font-bold text-white font-['Outfit']">{isEditing ? "Editar Produto" : "Novo Produto"}</h1><p className="text-sm text-gray-400">{isEditing ? "Atualize as informações" : "Cadastre um novo produto"}</p></div>
        </div>
      </div>

      <Card className="bg-[#141414] border border-white/5 max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isEditing && (
              <div className="space-y-2"><Label className="text-gray-300">Modelo *</Label>
                <Select value={modeloId} onValueChange={setModeloId}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white" data-testid="select-modelo"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-[#141414] border-white/10">{modelos.map((m) => (<SelectItem key={m.id} value={m.id} className="text-gray-300">{m.nome}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-300">Cor *</Label><Input placeholder="Ex: Preto" value={cor} onChange={(e) => setCor(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-cor" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Memória *</Label><Input placeholder="Ex: 128GB" value={memoria} onChange={(e) => setMemoria(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-memoria" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-300">Bateria (%)</Label><Input type="number" placeholder="Ex: 100" value={bateria} onChange={(e) => setBateria(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-bateria" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Preço *</Label><Input placeholder="Ex: 5999" value={preco} onChange={(e) => setPreco(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-preco" /></div>
            </div>
            <div className="space-y-2"><Label className="text-gray-300">IMEI</Label><Input placeholder="Ex: 123456789" value={imei} onChange={(e) => setImei(e.target.value)} className="bg-[#0A0A0A] border-white/10 text-white" data-testid="input-imei" /></div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" data-testid="btn-salvar-produto"><Save className="w-4 h-4 mr-2" />{loading ? "Salvando..." : "Salvar"}</Button>
              <Link to={`/${lojaSlug}/produtos`}><Button type="button" variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5">Cancelar</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProdutoForm;
