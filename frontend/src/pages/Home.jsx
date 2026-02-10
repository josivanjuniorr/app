import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, ArrowRight, Shield } from "lucide-react";
import { toast } from "sonner";

const Home = () => {
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!slug.trim()) {
      toast.error("Informe o domínio da loja");
      return;
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!cleanSlug) {
      toast.error("Domínio inválido");
      return;
    }

    setLoading(true);
    try {
      // Verify if store exists
      const response = await axios.get(`${API}/loja/${cleanSlug}/verify`);
      if (response.data.exists) {
        navigate(`/${cleanSlug}/login`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("Loja não encontrada. Verifique o domínio informado.");
      } else {
        toast.error("Erro ao verificar loja");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4"
      data-testid="home-page"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-purple-900/5" />
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B5952F] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.3)]">
              <Store className="w-10 h-10 text-black" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-white font-['Outfit']">
                CellControl
              </CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                Sistema de Controle de Celulares
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="slug" className="text-gray-300 text-sm">
                  Domínio da Loja
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">/</span>
                  <Input
                    id="slug"
                    type="text"
                    placeholder="nomedalojaaqui"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="pl-7 bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] h-12 text-lg"
                    data-testid="input-slug"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Exemplo: isaacimports, lojacentral, cellphone123
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#D4AF37] text-black font-bold text-lg hover:bg-[#B5952F] shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 hover:scale-[1.02]"
                data-testid="btn-acessar-loja"
              >
                {loading ? "Verificando..." : (
                  <>
                    Acessar Loja
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-black/40 text-gray-500">ou</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/admin/login")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-600/10 transition-colors"
              data-testid="btn-admin-access"
            >
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Acesso Super Admin</span>
            </button>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-600">
            Não tem uma loja? Entre em contato com o administrador.
          </p>
          <p className="text-xs text-gray-700">
            CellControl © {new Date().getFullYear()} - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
