import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Store, ArrowLeft, Save, Image, Upload, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

const AdminLojaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const fileInputRef = useRef(null);

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [useUrlInput, setUseUrlInput] = useState(false);

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
      const existingLogo = response.data.logo_url || "";
      setLogoUrl(existingLogo);
      setLogoPreview(existingLogo);
      // If logo is an external URL, show URL input mode
      if (existingLogo && !existingLogo.startsWith('/api/uploads')) {
        setUseUrlInput(true);
      }
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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use: PNG, JPG, GIF ou WebP");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 5MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLogoUrl(response.data.url);
      toast.success("Logo enviado com sucesso!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao enviar logo");
      setLogoPreview(logoUrl); // Revert preview
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    setLogoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setLogoUrl(url);
    setLogoPreview(url);
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
        await axios.put(`${API}/admin/lojas/${id}`, { 
          nome, 
          ativo,
          logo_url: logoUrl.trim() || null
        });
        toast.success("Loja atualizada com sucesso!");
      } else {
        await axios.post(`${API}/admin/lojas`, { 
          nome, 
          slug,
          logo_url: logoUrl.trim() || null
        });
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

            {/* Logo Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Logo da Loja
                </Label>
                <button
                  type="button"
                  onClick={() => setUseUrlInput(!useUrlInput)}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  {useUrlInput ? <Upload className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                  {useUrlInput ? "Fazer upload" : "Usar URL"}
                </button>
              </div>

              {useUrlInput ? (
                /* URL Input Mode */
                <div className="space-y-2">
                  <Input
                    type="url"
                    placeholder="https://exemplo.com/logo.png"
                    value={logoUrl}
                    onChange={handleUrlChange}
                    className="bg-[#0A0A0A] border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500"
                    data-testid="input-logo-url"
                  />
                  <p className="text-xs text-gray-500">
                    Cole a URL de uma imagem externa
                  </p>
                </div>
              ) : (
                /* Upload Mode */
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-logo-file"
                  />
                  
                  {!logoPreview ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full h-32 border-2 border-dashed border-purple-500/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-purple-400" />
                      <span className="text-sm text-gray-400">
                        {uploading ? "Enviando..." : "Clique para selecionar uma imagem"}
                      </span>
                      <span className="text-xs text-gray-500">
                        PNG, JPG, GIF ou WebP (máx. 5MB)
                      </span>
                    </button>
                  ) : (
                    <div className="relative">
                      <div className="p-4 bg-[#0A0A0A] rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-4">
                          <img
                            src={logoPreview.startsWith('/api') ? `${API.replace('/api', '')}${logoPreview}` : logoPreview}
                            alt="Logo preview"
                            className="w-20 h-20 rounded-lg object-cover border border-white/10"
                            onError={(e) => {
                              e.target.src = '';
                              e.target.className = 'w-20 h-20 rounded-lg bg-red-500/10 border border-red-500/30';
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">Logo carregado</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Esta imagem aparecerá na página de login e na barra lateral
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                {uploading ? "Enviando..." : "Trocar"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleRemoveLogo}
                                className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* URL Preview (when using URL mode) */}
              {useUrlInput && logoPreview && (
                <div className="p-4 bg-[#0A0A0A] rounded-lg border border-purple-500/20">
                  <p className="text-xs text-gray-500 mb-2">Pré-visualização:</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-lg object-cover border border-white/10"
                      onError={(e) => {
                        e.target.src = '';
                        e.target.alt = 'Erro';
                        e.target.className = 'w-16 h-16 rounded-lg bg-red-500/10 border border-red-500/30';
                      }}
                    />
                    <div className="text-xs text-gray-400">
                      <p>Esta imagem aparecerá:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Na página de login</li>
                        <li>Na barra lateral</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
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
                disabled={loading || uploading}
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
