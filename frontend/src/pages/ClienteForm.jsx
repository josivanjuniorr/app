import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const ClienteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchCliente();
    }
  }, [id]);

  const fetchCliente = async () => {
    try {
      const response = await axios.get(`${API}/clientes/${id}`);
      const cliente = response.data;
      setNome(cliente.nome);
      setCpf(cliente.cpf);
      setWhatsapp(cliente.whatsapp);
      setEmail(cliente.email || "");
      setTelefone(cliente.telefone || "");
      setEndereco(cliente.endereco || "");
    } catch (error) {
      toast.error("Erro ao carregar cliente");
      navigate("/clientes");
    } finally {
      setFetching(false);
    }
  };

  const formatCPF = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value.slice(0, 14);
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      if (cleaned.length <= 10) {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
    }
    return value.slice(0, 15);
  };

  const handleCPFChange = (e) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleWhatsAppChange = (e) => {
    setWhatsapp(formatPhone(e.target.value));
  };

  const handleTelefoneChange = (e) => {
    setTelefone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      toast.error("CPF inválido (deve ter 11 dígitos)");
      return;
    }

    const whatsappClean = whatsapp.replace(/\D/g, '');
    if (whatsappClean.length < 10 || whatsappClean.length > 11) {
      toast.error("WhatsApp inválido (deve ter 10 ou 11 dígitos)");
      return;
    }

    setLoading(true);
    try {
      const data = {
        nome: nome.trim(),
        cpf: cpfClean,
        whatsapp: whatsappClean,
        email: email.trim() || null,
        telefone: telefone.replace(/\D/g, '') || null,
        endereco: endereco.trim() || null
      };

      if (isEditing) {
        await axios.put(`${API}/clientes/${id}`, data);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await axios.post(`${API}/clientes`, data);
        toast.success("Cliente criado com sucesso!");
      }
      navigate("/clientes");
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao salvar cliente";
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
    <div className="space-y-6" data-testid="cliente-form-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/clientes">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">
              {isEditing ? "Editar Cliente" : "Novo Cliente"}
            </h1>
            <p className="text-sm text-gray-400">
              {isEditing ? "Atualize as informações do cliente" : "Cadastre um novo cliente"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-[#141414] border border-white/5 max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-300">Nome *</Label>
              <Input
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                data-testid="input-nome"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">CPF *</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCPFChange}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                  data-testid="input-cpf"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">WhatsApp *</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={handleWhatsAppChange}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                  data-testid="input-whatsapp"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">E-mail</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Telefone</Label>
                <Input
                  placeholder="(00) 0000-0000"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                  data-testid="input-telefone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Endereço</Label>
              <Textarea
                placeholder="Rua, número, bairro, cidade..."
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37] min-h-[80px]"
                data-testid="input-endereco"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]"
                data-testid="btn-salvar-cliente"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Link to="/clientes">
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

export default ClienteForm;
