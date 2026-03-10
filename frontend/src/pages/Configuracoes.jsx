import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { setupStoreManifest } from "@/lib/pwa";

const Configuracoes = () => {
  const { slug } = useParams();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const storeDomain = useMemo(() => {
    if (!slug) return window.location.origin;
    return `${window.location.origin}/${slug}`;
  }, [slug]);

  useEffect(() => {
    setupStoreManifest(slug);
  }, [slug]);

  useEffect(() => {
    const checkInstallState = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      const iosStandalone = window.navigator.standalone === true;
      setIsInstalled(standalone || iosStandalone);
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      toast.success("App instalado com sucesso nesta loja.");
    };

    checkInstallState();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (isInstalled) {
      toast.success("Este app já está instalado neste dispositivo.");
      return;
    }

    if (!installPrompt) {
      toast.info("Use o menu do navegador e escolha 'Instalar app' para continuar.");
      return;
    }

    installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;

    if (choiceResult?.outcome === "accepted") {
      toast.success("Instalação iniciada.");
    }

    setInstallPrompt(null);
  };

  return (
    <div className="space-y-8" data-testid="configuracoes-page">
      <div>
        <h1 className="text-3xl font-bold text-white font-['Outfit']">Configurações</h1>
        <p className="text-gray-400 mt-1">Gerencie as preferências da sua loja</p>
      </div>

      <Card className="bg-[#141414] border border-white/5 max-w-2xl">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#D4AF37]" />
            Instalar App
          </CardTitle>
          <CardDescription>
            Instale o CellControl como aplicativo para abrir diretamente no domínio da sua loja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Domínio configurado</p>
            <p className="text-sm text-gray-200 mt-1 break-all" data-testid="store-domain">{storeDomain}</p>
          </div>

          <Button
            onClick={installApp}
            className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]"
            data-testid="btn-instalar-app"
          >
            <Download className="w-4 h-4 mr-2" />
            Instalar app
          </Button>

          <p className="text-xs text-gray-500">
            Dica: se o botão não abrir o prompt, use o menu do navegador e selecione “Instalar app”.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;