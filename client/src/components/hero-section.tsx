import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { StoreSettings, BannerTheme } from "@shared/schema";

interface HeroSectionProps {
  storeSettings: StoreSettings | null;
  onScrollToMenu: () => void;
}

export default function HeroSection({ storeSettings, onScrollToMenu }: HeroSectionProps) {
  // Buscar banner ativo do novo sistema
  const { data: activeBanner } = useQuery<BannerTheme | null>({
    queryKey: ["/api/active-banner"],
    queryFn: () => fetch("/api/active-banner").then(res => res.json()),
  });

  const isOpen = storeSettings?.isOpen ?? true;
  const closingTime = storeSettings?.closingTime ?? "23:00";
  const minimumOrder = storeSettings?.minimumOrderAmount ?? "25.00";

  // Use banner ativo se existir, senão use configurações antigas
  const bannerTitle = activeBanner?.title || storeSettings?.bannerTitle || "Hambúrgueres";
  const bannerDescription = activeBanner?.description || storeSettings?.bannerDescription || "Os melhores hambúrgueres artesanais da cidade. Entrega rápida e ingredientes frescos!";
  const bannerPrice = activeBanner?.price || storeSettings?.bannerPrice || "24.90";
  const bannerImageUrl = activeBanner?.imageUrl || storeSettings?.bannerImageUrl || "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  
  // Configurações de aparência do banner - usar banner ativo se disponível
  const bannerColor1 = activeBanner?.gradientColor1 || storeSettings?.bannerColor1 || "#dc2626";
  const bannerColor2 = activeBanner?.gradientColor2 || storeSettings?.bannerColor2 || "#ea580c";
  const bannerColor3 = activeBanner?.gradientColor3 || storeSettings?.bannerColor3 || "#f59e0b";
  const bannerColor4 = activeBanner?.gradientColor4 || storeSettings?.bannerColor4 || "#eab308";
  const bannerBackgroundImage = storeSettings?.bannerBackgroundImage; // Mantém do sistema antigo por enquanto
  const useImageBackground = activeBanner?.useBackgroundImage || storeSettings?.bannerUseImageBackground || false;
  
  const openWhatsApp = () => {
    const message = "Olá! Gostaria de fazer um pedido de hambúrguer. Vocês fazem entrega?";
    const phone = "5511999999999"; // Replace with actual WhatsApp number
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Criar o estilo dinâmico do banner
  const bannerStyle = useImageBackground && bannerBackgroundImage 
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${bannerBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {
        background: `linear-gradient(135deg, ${bannerColor1} 0%, ${bannerColor2} 25%, ${bannerColor3} 75%, ${bannerColor4} 100%)`,
        boxShadow: `0 8px 32px ${bannerColor1}30`
      };

  // Se o banner ativo é HTML customizado, renderizar HTML
  if (activeBanner && !activeBanner.isCustomizable && activeBanner.htmlContent) {
    return (
      <section 
        className="relative overflow-hidden"
        dangerouslySetInnerHTML={{ __html: activeBanner.htmlContent }}
      />
    );
  }

  // Renderizar banner customizável padrão
  return (
    <section 
      className="relative overflow-hidden"
      style={bannerStyle}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-center lg:text-left">
            <Badge 
              className={`inline-flex items-center px-4 py-2 rounded-full font-semibold mb-4 ${
                isOpen 
                  ? 'status-open text-accent-foreground' 
                  : 'bg-destructive text-destructive-foreground'
              }`}
            >
              <div className={`w-3 h-3 rounded-full mr-2 ${isOpen ? 'bg-accent-foreground animate-pulse' : 'bg-destructive-foreground'}`}></div>
              {isOpen ? `ABERTO AGORA • Fecha às ${closingTime}` : 'FECHADO'}
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-4">
              A Melhor<br />
              <span className="text-secondary">{bannerTitle}</span><br />
              do Mercado
            </h1>
            
            <p className="text-xl text-primary-foreground/90 mb-6">
              {bannerDescription}<br />
              <span className="font-semibold">Compra mínima: R$ {minimumOrder}</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={onScrollToMenu}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-bold transition-transform hover:scale-105"
                data-testid="button-view-menu"
              >
                📱 VER PRODUTOS
              </Button>
              <Button
                onClick={openWhatsApp}
                variant="outline"
                className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground px-8 py-4 text-lg font-semibold border-primary-foreground/30"
                data-testid="button-whatsapp"
              >
                📱 CHAMAR NO WHATSAPP
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src={bannerImageUrl} 
              alt={`${bannerTitle} de alta qualidade`} 
              className="rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 w-full" 
            />
            
            <div className="absolute -bottom-4 -left-4 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl shadow-lg font-bold">
              <span className="text-2xl">R$ {bannerPrice}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 text-6xl opacity-10">🍔</div>
      <div className="absolute bottom-20 left-10 text-4xl opacity-10">🚚</div>
    </section>
  );
}
