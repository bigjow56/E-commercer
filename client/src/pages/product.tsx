import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { Link } from "wouter";
import { 
  ChevronLeft, 
  Star, 
  StarHalf, 
  Plus, 
  Minus, 
  Heart,
  Share2,
  Truck,
  Shield,
  Clock
} from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductPageParams {
  id: string;
}

export default function ProductPage() {
  const { id } = useParams<ProductPageParams>();
  const [, navigate] = useLocation();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/products", id],
    queryFn: () => fetch(`/api/products/${id}`).then(res => {
      if (!res.ok) throw new Error('Produto não encontrado');
      return res.json();
    }),
    enabled: !!id,
  });

  const [breadcrumb, setBreadcrumb] = useState("Produtos");

  useEffect(() => {
    if (product) {
      // Get category name for breadcrumb
      fetch(`/api/categories/${product.categoryId}`)
        .then(res => res.json())
        .then(category => setBreadcrumb(category.name))
        .catch(() => setBreadcrumb("Produtos"));
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Produto não encontrado</h1>
          <Link href="/">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar à loja
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercent = hasDiscount 
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;
  const savings = hasDiscount 
    ? parseFloat(product.originalPrice!) - parseFloat(product.price)
    : 0;

  // Simulate rating (4.5-5.0 stars)
  const rating = 4.5 + Math.random() * 0.5;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const totalReviews = Math.floor(Math.random() * 50) + 10;

  // Mock product images (for now, we'll use the same image multiple times)
  const productImages = [
    product.imageUrl,
    product.imageUrl,
    product.imageUrl,
    product.imageUrl
  ];

  // Mock product options
  const productOptions = [
    {
      name: "Tamanho",
      values: ["Pequeno", "Médio", "Grande"],
      type: "size"
    },
    {
      name: "Extras",
      values: ["Queijo extra", "Bacon", "Molho especial"],
      type: "addon"
    }
  ];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    // Show success message or redirect to cart
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <nav className="text-sm text-gray-500">
              <Link href="/" className="hover:text-orange-500">Início</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700">{breadcrumb}</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{product.name}</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Product Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden group cursor-zoom-in">
                <img
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              
              {/* Thumbnails */}
              <div className="flex gap-3 justify-center">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-orange-500 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center">
                    {[...Array(fullStars)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                    {hasHalfStar && <StarHalf className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
                  </div>
                  <span className="text-sm text-gray-600">
                    {rating.toFixed(1)} ({totalReviews} avaliações)
                  </span>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold text-red-600">
                      R$ {parseFloat(product.price).toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xl text-gray-500 line-through">
                        R$ {parseFloat(product.originalPrice!).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        -{discountPercent}% OFF
                      </Badge>
                      <span className="text-green-600 font-semibold">
                        Economize R$ {savings.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-lg leading-relaxed mt-4">
                  {product.description}
                </p>
              </div>

              {/* Features */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Destaques do produto</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-green-500">✓</span>
                    Ingredientes frescos e selecionados
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-green-500">✓</span>
                    Preparado na hora do pedido
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-green-500">✓</span>
                    Entrega rápida e segura
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-green-500">✓</span>
                    Satisfação garantida
                  </li>
                </ul>
              </div>

              {/* Product Options */}
              <div className="space-y-4">
                {productOptions.map((option) => (
                  <div key={option.name}>
                    <label className="block font-semibold text-gray-900 mb-2">
                      {option.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => (
                        <button
                          key={value}
                          onClick={() => setSelectedOptions(prev => ({
                            ...prev,
                            [option.name]: value
                          }))}
                          className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                            selectedOptions[option.name] === value
                              ? 'border-orange-500 bg-orange-500 text-white'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quantity and Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">Quantidade:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={decreaseQuantity}
                      className="p-3 hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-3 font-semibold min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQuantity}
                      className="p-3 hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 text-lg rounded-2xl transition-all transform hover:scale-105 hover:shadow-lg"
                    disabled={!product.isAvailable}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar ao Carrinho
                  </Button>
                  <Button
                    variant="outline"
                    className="p-4 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 rounded-2xl"
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="p-4 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-2xl"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Informações de entrega
                </h4>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Entrega em 30-45 minutos
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Frete grátis acima de R$ 30,00
                  </li>
                  <li className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Entrega disponível na sua região
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8">
          <Card className="rounded-3xl shadow-xl overflow-hidden">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-none">
                <TabsTrigger 
                  value="description" 
                  className="text-lg font-semibold py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Descrição
                </TabsTrigger>
                <TabsTrigger 
                  value="specifications" 
                  className="text-lg font-semibold py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Especificações
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="text-lg font-semibold py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Avaliações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="p-8">
                <div className="prose max-w-none">
                  <h3 className="text-2xl font-bold mb-4">Sobre este produto</h3>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {product.description}
                  </p>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Nossos produtos são preparados com os melhores ingredientes, seguindo rigorosos padrões de qualidade e higiene. 
                    Cada item é cuidadosamente elaborado para proporcionar uma experiência gastronômica única e saborosa.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="p-8">
                <h3 className="text-2xl font-bold mb-6">Especificações técnicas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-6 font-semibold text-gray-900 bg-gray-50 w-1/3">
                          Categoria
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {breadcrumb}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-6 font-semibold text-gray-900 bg-gray-50">
                          Preço
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          R$ {parseFloat(product.price).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-6 font-semibold text-gray-900 bg-gray-50">
                          Disponibilidade
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={product.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {product.isAvailable ? "Em estoque" : "Indisponível"}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-6 font-semibold text-gray-900 bg-gray-50">
                          Tempo de preparo
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          15-20 minutos
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="p-8">
                <h3 className="text-2xl font-bold mb-6">Avaliações dos clientes</h3>
                <div className="space-y-6">
                  {[
                    {
                      author: "João Silva",
                      rating: 5,
                      date: "2 dias atrás",
                      text: "Produto excelente! Sabor incrível e entrega rápida. Recomendo muito!"
                    },
                    {
                      author: "Maria Santos",
                      rating: 4,
                      date: "1 semana atrás", 
                      text: "Muito bom, mas poderia vir um pouco mais quente. No geral, satisfeita com a compra."
                    },
                    {
                      author: "Pedro Costa",
                      rating: 5,
                      date: "2 semanas atrás",
                      text: "Simplesmente perfeito! Já é a terceira vez que peço e sempre supera as expectativas."
                    }
                  ].map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{review.author}</h4>
                          <div className="flex">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}