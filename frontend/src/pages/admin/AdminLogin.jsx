import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, token, user } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as super admin
  if (token && user && user.role === "super_admin") {
    navigate("/admin");
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
      
      if (role !== "super_admin") {
        toast.error("Acesso negado. Esta área é restrita ao Super Admin.");
        return;
      }
      
      login(newToken, { user_id, user_email, user_nome, role, loja_id, loja_slug });
      toast.success("Login realizado com sucesso!");
      navigate("/admin");
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao fazer login";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-900/20 via-[#0A0A0A] to-[#0A0A0A] flex items-center justify-center p-4"
      data-testid="admin-login-page"
    >
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-black/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.3)]">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white font-['Outfit']">
                CellControl
              </CardTitle>
              <CardDescription className="text-purple-400 mt-1">
                Painel Super Admin
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
                  placeholder="superadmin@cellcontrol.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11"
                  data-testid="admin-login-email-input"
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
                    className="bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11 pr-10"
                    data-testid="admin-login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-[0_0_20px_rgba(147,51,234,0.2)] transition-all duration-300 hover:scale-[1.02]"
                data-testid="admin-login-submit-button"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a href="/" className="text-xs text-[#D4AF37] hover:text-[#B5952F]">
                ← Voltar para login da loja
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 text-xs mt-6">
          CellControl © {new Date().getFullYear()} - Super Admin Panel
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
