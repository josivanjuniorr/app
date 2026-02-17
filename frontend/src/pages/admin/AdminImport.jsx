import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileSpreadsheet, 
  Store, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  Smartphone,
  Users,
  Package,
  ArrowLeft,
  Receipt
} from "lucide-react";
import { toast } from "sonner";

const AdminImport = () => {
  const fileInputRef = useRef(null);
  const [lojas, setLojas] = useState([]);
  const [selectedLoja, setSelectedLoja] = useState("");
  const [dataType, setDataType] = useState("auto");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchLojas();
  }, []);

  const fetchLojas = async () => {
    try {
      const response = await axios.get(`${API}/admin/lojas`);
      setLojas(response.data);
    } catch (error) {
      toast.error("Erro ao carregar lojas");
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validExtensions = ['.csv', '.json'];
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(ext)) {
      toast.error("Formato não suportado. Use CSV ou JSON.");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleImport = async () => {
    if (!selectedLoja) {
      toast.error("Selecione uma loja");
      return;
    }

    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API}/admin/import/${selectedLoja}?data_type=${dataType}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setResult(response.data);
      
      if (response.data.success) {
        toast.success(`${response.data.imported} registros importados com sucesso!`);
      } else {
        toast.warning(`Importação concluída com ${response.data.errors.length} erros`);
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao importar dados";
      toast.error(message);
      setResult({
        success: false,
        total_records: 0,
        imported: 0,
        errors: [message],
        details: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (type) => {
    let content, filename;
    
    if (type === 'modelos') {
      content = 'nome,marca\niPhone 15,Apple\nGalaxy S24,Samsung\nMoto G84,Motorola';
      filename = 'template_modelos.csv';
    } else if (type === 'clientes') {
      content = 'nome,cpf,whatsapp,email,endereco\nJoão Silva,123.456.789-00,(11) 99999-8888,joao@email.com,Rua Exemplo 123';
      filename = 'template_clientes.csv';
    } else if (type === 'produtos') {
      content = 'modelo,cor,memoria,bateria,imei,preco\niPhone 15,Preto,128GB,95%,123456789012345,4500.00';
      filename = 'template_produtos.csv';
    }
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="admin-import-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Importar Dados</h1>
            <p className="text-sm text-gray-400">Importe modelos, produtos ou clientes de um arquivo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Import Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#141414] border border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                Configurar Importação
              </CardTitle>
              <CardDescription className="text-gray-400">
                Selecione a loja e o tipo de dados para importar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Store Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300">Loja de Destino</Label>
                <Select value={selectedLoja} onValueChange={setSelectedLoja}>
                  <SelectTrigger className="bg-[#0A0A0A] border-purple-500/20 text-white">
                    <SelectValue placeholder="Selecione uma loja" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-purple-500/20">
                    {lojas.map((loja) => (
                      <SelectItem key={loja.id} value={loja.id}>
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-purple-400" />
                          {loja.nome} <span className="text-gray-500">/{loja.slug}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data Type */}
              <div className="space-y-2">
                <Label className="text-gray-300">Tipo de Dados</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger className="bg-[#0A0A0A] border-purple-500/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-purple-500/20">
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        Detectar automaticamente
                      </div>
                    </SelectItem>
                    <SelectItem value="modelos">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-blue-400" />
                        Modelos de Celular
                      </div>
                    </SelectItem>
                    <SelectItem value="produtos">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-green-400" />
                        Produtos (Estoque)
                      </div>
                    </SelectItem>
                    <SelectItem value="clientes">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        Clientes
                      </div>
                    </SelectItem>
                    <SelectItem value="vendas">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-yellow-400" />
                        Vendas Concluídas
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-gray-300">Arquivo (CSV ou JSON)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-import-file"
                />
                
                {!file ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-purple-500/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors"
                    data-testid="btn-select-file"
                  >
                    <Upload className="w-8 h-8 text-purple-400" />
                    <span className="text-sm text-gray-400">Clique para selecionar um arquivo</span>
                    <span className="text-xs text-gray-500">CSV ou JSON</span>
                  </button>
                ) : (
                  <div className="p-4 bg-[#0A0A0A] rounded-lg border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setResult(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={loading || !selectedLoja || !file}
                className="w-full bg-green-600 text-white font-bold hover:bg-green-700"
                data-testid="btn-import"
              >
                <Upload className="w-4 h-4 mr-2" />
                {loading ? "Importando..." : "Importar Dados"}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card className={`border ${result.success ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${result.success ? 'text-green-400' : 'text-yellow-400'}`}>
                  {result.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  Resultado da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-black/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">{result.total_records}</p>
                    <p className="text-xs text-gray-400">Total no arquivo</p>
                  </div>
                  <div className="p-3 bg-black/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">{result.imported}</p>
                    <p className="text-xs text-gray-400">Importados</p>
                  </div>
                  <div className="p-3 bg-black/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-400">{result.details?.skipped_count || 0}</p>
                    <p className="text-xs text-gray-400">Ignorados (duplicados)</p>
                  </div>
                </div>

                {result.details?.sample_created?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Exemplos importados:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.details.sample_created.map((item, i) => (
                        <span key={i} className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.errors?.length > 0 && (
                  <div>
                    <p className="text-sm text-red-400 mb-2">Erros encontrados:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.errors.map((error, i) => (
                        <p key={i} className="text-xs text-red-300 bg-red-500/10 p-2 rounded">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Templates */}
        <div className="space-y-6">
          <Card className="bg-[#141414] border border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Templates de Exemplo</CardTitle>
              <CardDescription className="text-gray-400">
                Baixe um template para usar como base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                onClick={() => downloadTemplate('modelos')}
                data-testid="btn-template-modelos"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Template Modelos
                <Download className="w-4 h-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-green-500/20 text-green-400 hover:bg-green-500/10"
                onClick={() => downloadTemplate('produtos')}
                data-testid="btn-template-produtos"
              >
                <Package className="w-4 h-4 mr-2" />
                Template Produtos
                <Download className="w-4 h-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-purple-500/20 text-purple-400 hover:bg-purple-500/10"
                onClick={() => downloadTemplate('clientes')}
                data-testid="btn-template-clientes"
              >
                <Users className="w-4 h-4 mr-2" />
                Template Clientes
                <Download className="w-4 h-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Formato dos Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-blue-400 font-medium mb-1">Modelos:</p>
                <p className="text-gray-400">nome, marca</p>
              </div>
              <div>
                <p className="text-green-400 font-medium mb-1">Produtos:</p>
                <p className="text-gray-400">modelo, cor, memoria, bateria, imei, preco</p>
              </div>
              <div>
                <p className="text-purple-400 font-medium mb-1">Clientes:</p>
                <p className="text-gray-400">nome, cpf, whatsapp, email, endereco</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminImport;
