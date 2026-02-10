import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Plus, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Clientes = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const lojaSlug = slug || user?.loja_slug;
  
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { if (lojaSlug) fetchClientes(); }, [lojaSlug]);

  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${API}/loja/${lojaSlug}/clientes`);
      setClientes(response.data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/loja/${lojaSlug}/clientes/${deleteId}`);
      toast.success("Cliente excluído");
      fetchClientes();
    } catch (error) {
      toast.error("Erro ao excluir");
    } finally {
      setDeleteId(null);
    }
  };

  const formatCPF = (cpf) => {
    const c = cpf.replace(/\D/g, '');
    return c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;
  };

  const formatPhone = (phone) => {
    const c = phone.replace(/\D/g, '');
    if (c.length === 11) return c.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (c.length === 10) return c.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return phone;
  };

  const filteredClientes = clientes.filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()) || c.cpf.includes(search) || c.whatsapp.includes(search));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#D4AF37]">Carregando...</div></div>;

  return (
    <div className="space-y-6" data-testid="clientes-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-green-500" /></div>
          <div><h1 className="text-2xl font-bold text-white font-['Outfit']">Clientes</h1><p className="text-sm text-gray-400">Gerencie seus clientes</p></div>
        </div>
        <Link to={`/${lojaSlug}/clientes/novo`}><Button className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]" data-testid="btn-novo-cliente"><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button></Link>
      </div>

      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-[#0A0A0A] border-white/10 text-white" data-testid="search-cliente" /></div>
        </CardContent>
      </Card>

      <Card className="bg-[#141414] border border-white/5">
        <CardContent className="p-0">
          {filteredClientes.length > 0 ? (
            <Table>
              <TableHeader><TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 uppercase text-xs">Nome</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">CPF</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">WhatsApp</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs">Email</TableHead>
                <TableHead className="text-gray-400 uppercase text-xs text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-gray-300 font-medium">{cliente.nome}</TableCell>
                    <TableCell className="text-gray-400 font-mono text-sm">{formatCPF(cliente.cpf)}</TableCell>
                    <TableCell className="text-gray-400">{formatPhone(cliente.whatsapp)}</TableCell>
                    <TableCell className="text-gray-400">{cliente.email || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/${lojaSlug}/clientes/editar/${cliente.id}`}><Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"><Edit className="w-4 h-4" /></Button></Link>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400 hover:bg-red-400/10" onClick={() => setDeleteId(cliente.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center"><Users className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-500">Nenhum cliente encontrado</p></div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#141414] border border-white/10">
          <AlertDialogHeader><AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle><AlertDialogDescription className="text-gray-400">Tem certeza?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="bg-white/5 border-white/10 text-gray-300">Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clientes;
