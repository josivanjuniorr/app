import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Smartphone, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { setupStoreManifest } from "@/lib/pwa";

const Configuracoes = () => {
  const { slug } = useParams();

  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [supportsInstallPrompt, setSupportsInstallPrompt] = useState(false);

  const storeDomain = useMemo(() => {
    if (typeof window === "undefined") return "";
    if (!slug) return window.location.origin;
    return `${window.location.origin}/${slug}`;
  }, [slug]);

  useEffect(() => {
    setupStoreManifest(slug);
  }, [slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent || "";
    const iosDevice = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = window.navigator.standalone === true;

    setIsIOS(iosDevice && webkit);
    setIsInstalled(standalone || iosStandalone);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setSupportsInstallPrompt(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      toast.success("App instalado com sucesso nesta loja.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (isInstalled) {
      toast.success("Este app ja esta instalado neste dispositivo.");
      return;
    }

    if (installPrompt) {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;

      if (choiceResult?.outcome === "accepted") {
        toast.success("Instalacao iniciada.");
      } else {
        toast.info("Instalacao cancelada.");
      }

      setInstallPrompt(null);
      return;
    }

    if (isIOS) {
      toast.info("No iPhone/iPad, use Compartilhar > Adicionar a Tela de Inicio.");
      return;
    }

    toast.info("Use o menu do navegador e escolha Instalar app para continuar.");
  };

  const canDirectInstall = !!installPrompt;

  return (
    <div className="space-y-8" data-testid="configuracoes-page">
      <div>
        <h1 className="text-3xl font-bold text-white font-['Outfit']">Configuracoes</h1>
        <p className="text-gray-400 mt-1">Gerencie as preferencias da sua loja</p>
      </div>

      <Card className="bg-[#141414] border border-white/5 max-w-3xl">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#D4AF37]" />
            Instalacao do App (PWA)
          </CardTitle>
          <CardDescription>
            Instale o CellControl para abrir em tela cheia e acessar mais rapido no dia a dia.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Dominio configurado</p>
            <p className="text-sm text-gray-200 mt-1 break-all" data-testid="store-domain">{storeDomain}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
              <p className={`text-sm mt-1 font-semibold ${isInstalled ? "text-green-400" : "text-yellow-400"}`}>
                {isInstalled ? "Instalado" : "Nao instalado"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Prompt nativo</p>
              <p className={`text-sm mt-1 font-semibold ${supportsInstallPrompt ? "text-green-400" : "text-gray-300"}`}>
                {supportsInstallPrompt ? "Disponivel" : "Aguardando navegador"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Dispositivo iOS</p>
              <p className={`text-sm mt-1 font-semibold ${isIOS ? "text-blue-400" : "text-gray-300"}`}>
                {isIOS ? "Sim" : "Nao"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={installApp}
              className="bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F]"
              data-testid="btn-instalar-app"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar app
            </Button>

            {isInstalled && (
              <span className="inline-flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                App instalado neste dispositivo
              </span>
            )}
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-gray-300">
            <p className="flex items-center gap-2 text-blue-300 font-medium mb-2">
              <Info className="w-4 h-4" />
              Dicas de instalacao
            </p>
            <p>Android/desktop: toque em Instalar app quando o prompt aparecer.</p>
            <p>iPhone/iPad: abra no Safari e use Compartilhar > Adicionar a Tela de Inicio.</p>
          </div>

          {canDirectInstall ? (
            <p className="text-xs text-green-400">Seu navegador ja liberou o prompt de instalacao.</p>
          ) : (
            <p className="text-xs text-gray-500">Se o prompt nao aparecer, navegue um pouco no app e tente novamente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;