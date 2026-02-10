import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { login, token, user } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lojaInfo, setLojaInfo] = useState({ nome: "", logo_url: null });

  // Fetch store info on mount
  useEffect(() => {
    if (slug) {
      axios.get(`${API}/loja/${slug}/verify`)
        .then(res => setLojaInfo({
          nome: res.data.nome,
          logo_url: res.data.logo_url
        }))
        .catch(() => navigate("/"));
    }
  }, [slug, navigate]);

  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      if (user.role === "super_admin") {
        navigate("/admin");
      } else if (user.loja_slug) {
        navigate(`/${user.loja_slug}`);
      }
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !senha) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, { email, senha });
      const { token: newToken, user_id, user_email, user_nome, role, loja_id, loja_slug } = response.data;
      
      // Verify user belongs to this store
      if (role !== "super_admin" && loja_slug !== slug) {
        toast.error("Este usuário não pertence a esta loja");
        return;
      }
      
      login(newToken, { user_id, user_email, user_nome, role, loja_id, loja_slug });
      toast.success("Login realizado com sucesso!");
      
      if (role === "super_admin") {
        navigate("/admin");
      } else {
        navigate(`/${loja_slug}`);
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao fazer login";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen login-bg flex items-center justify-center p-4"
      data-testid="login-page"
    >
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <button
              onClick={() => navigate("/")}
              className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
              data-testid="btn-voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Logo da Loja */}
            {lojaInfo.logo_url ? (
              <img 
                src={lojaInfo.logo_url} 
                alt={lojaInfo.nome || "Logo"} 
                className="mx-auto w-20 h-20 rounded-2xl object-cover shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`mx-auto w-16 h-16 rounded-2xl bg-[#D4AF37] items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)] ${lojaInfo.logo_url ? 'hidden' : 'flex'}`}
            >
              <Store className="w-8 h-8 text-black" />
            </div>
            
            <div>
              <CardTitle className="text-2xl font-bold text-white font-['Outfit']">
                {lojaInfo.nome || slug}
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                <span className="text-[#D4AF37]">/{slug}</span> • Faça login para continuar
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] h-11"
                  data-testid="login-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-gray-300 text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] h-11 pr-10"
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    data-testid="login-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F] shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 hover:scale-[1.02]"
                data-testid="login-submit-button"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 text-xs mt-6">
          CellControl © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Login;
