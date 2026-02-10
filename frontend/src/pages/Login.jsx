import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { login, token, user } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (token && user) {
    if (user.role === "super_admin") {
      navigate("/admin");
    } else if (user.loja_slug) {
      navigate(`/${user.loja_slug}`);
    }
    return null;
  }

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
      
      login(newToken, { user_id, user_email, user_nome, role, loja_id, loja_slug });
      toast.success("Login realizado com sucesso!");
      
      if (role === "super_admin") {
        navigate("/admin");
      } else if (loja_slug) {
        navigate(`/${loja_slug}`);
      } else {
        toast.error("Usuário não vinculado a nenhuma loja");
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
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <Store className="w-8 h-8 text-black" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white font-['Outfit']">
                CellControl
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                Acesse sua loja
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

            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-gray-500">
                Isaac Imports: admin@isaacimports.com / 123456
              </p>
              <a href="/admin/login" className="text-xs text-purple-400 hover:text-purple-300">
                Acesso Super Admin →
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 text-xs mt-6">
          CellControl © {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default Login;
