import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon,
  DollarSign,
  Target,
  Tag,
  Zap,
  BarChart3,
  Search,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isPromotion: boolean;
  category?: Category;
  createdAt: string;
  // Add related data
  attributes?: ProductAttribute[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface ProductAttribute {
  id: string;
  productId: string;
  attributeName: string;
  attributeValue: string;
  priceModifier: string;
  isActive: boolean;
}

interface ProductImage {
  id?: string;
  productId?: string;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isMain: boolean;
  isNew?: boolean; // Para rastrear imagens recém adicionadas
}

interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  imageUrl: string; // Mantém para compatibilidade
  images: ProductImage[]; // Múltiplas imagens
  isAvailable: boolean;
  isFeatured: boolean;
  isPromotion: boolean;
  // Technical specifications (will be saved as productAttributes)
  specifications: Array<{ 
    id?: string;
    attributeName: string; 
    attributeValue: string; 
    priceModifier?: string 
  }>;
}

export function AdminProducts() {
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const queryClient = useQueryClient();

  // Queries
  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products', 'admin'],
    queryFn: async () => {
      const response = await apiRequest('/api/products?admin=true');
      return await response.json();
    },
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('/api/categories');
      return await response.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest(`/api/products/${productId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setProductToDelete(null);
      toast({
        title: "Produto removido!",
        description: "O produto foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover produto",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Statistics
  const totalProducts = products.length;
  const availableProducts = products.filter(p => p.isAvailable).length;
  const totalValue = products.reduce((sum, p) => sum + parseFloat(p.price || '0'), 0);
  const featuredProducts = products.filter(p => p.isFeatured).length;

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
    const matchesAvailability = !showOnlyAvailable || product.isAvailable;
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsCreateMode(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsCreateMode(true);
  };

  const handleCloseForm = () => {
    setIsCreateMode(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with Statistics */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-lg mb-6 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Package className="h-7 w-7" />
              Gerenciar Produtos
            </h1>
            <p className="text-blue-100 mt-1">Controle total do seu catálogo</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="font-bold text-lg">{totalProducts}</div>
              <div className="text-blue-100">Produtos</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="font-bold text-lg">R$ {totalValue.toFixed(2)}</div>
              <div className="text-blue-100">Valor Total</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="font-bold text-lg">{availableProducts}</div>
              <div className="text-blue-100">Disponíveis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                checked={showOnlyAvailable}
                onCheckedChange={setShowOnlyAvailable}
                id="available-filter"
              />
              <Label htmlFor="available-filter" className="text-sm">
                Apenas disponíveis
              </Label>
            </div>
          </div>

          <Button 
            onClick={handleCreateProduct}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <div className="relative">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {product.isFeatured && (
                    <Badge className="bg-yellow-500 text-white">
                      Destaque
                    </Badge>
                  )}
                  {product.isPromotion && (
                    <Badge className="bg-red-500 text-white">
                      Promoção
                    </Badge>
                  )}
                  {!product.isAvailable && (
                    <Badge variant="secondary" className="bg-gray-500 text-white">
                      Indisponível
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg truncate" title={product.name}>
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-green-600">
                      R$ {product.price}
                    </div>
                    {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                      <div className="text-sm text-gray-500 line-through">
                        R$ {product.originalPrice}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {product.category?.name || 'Sem categoria'}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditProduct(product)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setProductToDelete(product)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && !loadingProducts && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || categoryFilter !== "all" ? 
                "Tente ajustar os filtros ou busca" : 
                "Comece adicionando seu primeiro produto"
              }
            </p>
            <Button onClick={handleCreateProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Form Dialog */}
      <Dialog open={isCreateMode} onOpenChange={setIsCreateMode}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do produto com todas as informações necessárias
            </DialogDescription>
          </DialogHeader>
          
          <ProductForm
            product={selectedProduct}
            categories={categories}
            onSave={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o produto "{productToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setProductToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Product Form Component
function ProductForm({ 
  product, 
  categories, 
  onSave, 
  onCancel 
}: { 
  product: Product | null;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    originalPrice: product?.originalPrice || '',
    categoryId: product?.categoryId || '',
    imageUrl: product?.imageUrl || '',
    images: [
      // Se há produto existente, adiciona a imagem principal
      ...(product?.imageUrl ? [{
        imageUrl: product.imageUrl,
        displayOrder: 0,
        isMain: true,
        altText: product.name || ''
      }] : [])
    ],
    isAvailable: product?.isAvailable ?? true,
    isFeatured: product?.isFeatured ?? false,
    isPromotion: product?.isPromotion ?? false,
    specifications: product?.attributes?.map(attr => ({
      id: attr.id,
      attributeName: attr.attributeName,
      attributeValue: attr.attributeValue,
      priceModifier: attr.priceModifier || '0'
    })) || [],
  });

  const [dragOver, setDragOver] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Carregar imagens existentes quando editando um produto
  useEffect(() => {
    const loadExistingImages = async () => {
      if (product?.id) {
        try {
          const response = await apiRequest(`/api/products/${product.id}/images`, { method: 'GET' });
          const existingImages = await response.json();
            
            // Adiciona as imagens existentes ao formData, mantendo a principal
            if (existingImages.length > 0) {
              const formattedImages = existingImages.map((img: any) => ({
                imageUrl: img.imageUrl,
                displayOrder: img.displayOrder || 0,
                isMain: img.isMain || false,
                altText: img.altText || '',
                id: img.id // Para identificar imagens existentes
              }));

              setFormData(prev => ({
                ...prev,
                images: formattedImages,
                // Atualiza imageUrl com a imagem principal se existir
                imageUrl: formattedImages.find(img => img.isMain)?.imageUrl || 
                         formattedImages[0]?.imageUrl || 
                         prev.imageUrl
              }));
            }
        } catch (error) {
          console.warn('Erro ao carregar imagens do produto:', error);
        }
      }
    };

    loadExistingImages();
  }, [product?.id]);

  // Funções para gerenciar múltiplas imagens
  const addImageFromUrl = () => {
    const url = imageUrlInput.trim();
    
    // Validação básica de URL
    if (!url) return;
    
    try {
      new URL(url);
    } catch {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida para a imagem.",
        variant: "destructive",
      });
      return;
    }

    // Verifica se a URL já foi adicionada
    if (formData.images.some(img => img.imageUrl === url)) {
      toast({
        title: "Imagem duplicada",
        description: "Esta imagem já foi adicionada.",
        variant: "destructive",
      });
      return;
    }
    
    const newImage: ProductImage = {
      imageUrl: url,
      displayOrder: formData.images.length,
      isMain: formData.images.length === 0, // Primeira imagem é principal
      isNew: true
    };
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, newImage],
      // Atualiza imageUrl principal se for a primeira imagem
      imageUrl: prev.images.length === 0 ? url : prev.imageUrl
    }));
    
    setImageUrlInput('');
    
    toast({
      title: "Imagem adicionada",
      description: "A imagem foi adicionada com sucesso à galeria.",
    });
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    
    // Reordena as imagens
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      displayOrder: i,
      isMain: i === 0 && newImages.length > 0 // Primeira imagem vira principal
    }));

    setFormData(prev => ({
      ...prev,
      images: reorderedImages,
      imageUrl: reorderedImages.length > 0 ? reorderedImages[0].imageUrl : ''
    }));
  };

  const setMainImage = (index: number) => {
    const newImages = formData.images.map((img, i) => ({
      ...img,
      isMain: i === index
    }));

    setFormData(prev => ({
      ...prev,
      images: newImages,
      imageUrl: newImages[index]?.imageUrl || ''
    }));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...formData.images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    // Reordena mantendo a lógica de main image mais inteligente
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      displayOrder: i,
      // Mantém a flag isMain inalterada na reordenação, 
      // a menos que seja explicitamente alterada pelo usuário
    }));

    // Atualiza imageUrl com a atual imagem principal
    const mainImage = reorderedImages.find(img => img.isMain);
    
    // Se não há imagem principal definida, usa a primeira
    const effectiveMainImage = mainImage || reorderedImages[0];

    setFormData(prev => ({
      ...prev,
      images: reorderedImages,
      imageUrl: effectiveMainImage?.imageUrl || ''
    }));
  };

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const newImage: ProductImage = {
            imageUrl,
            displayOrder: formData.images.length,
            isMain: formData.images.length === 0,
            isNew: true,
            altText: file.name
          };
          
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, newImage],
            imageUrl: prev.images.length === 0 ? imageUrl : prev.imageUrl
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Separate product data from specifications and images
      const { specifications, images, ...productData } = data;
      
      // First, save the product
      const endpoint = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';
      
      const response = await apiRequest(endpoint, { method, body: productData });
      const savedProduct = await response.json();
      
      // If this is a new product, we need the ID for attributes
      const productId = product?.id || savedProduct.id;
      
      // Handle specifications (product attributes)
      if (specifications && specifications.length > 0) {
        // Delete existing attributes if editing
        if (product) {
          await apiRequest(`/api/products/${productId}/attributes`, { method: 'DELETE' });
        }
        
        // Create new attributes
        for (const spec of specifications) {
          if (spec.attributeName && spec.attributeValue) {
            await apiRequest('/api/product-attributes', {
              method: 'POST',
              body: {
                productId,
                attributeName: spec.attributeName,
                attributeValue: spec.attributeValue,
                priceModifier: spec.priceModifier || '0.00',
                isActive: true
              }
            });
          }
        }
      }
      
      // Handle multiple images
      if (images && images.length > 0) {
        // Filter out base64 images and convert to URLs (for now just URL images)
        const urlImages = images.filter(img => !img.imageUrl.startsWith('data:'));
        
        if (urlImages.length > 0) {
          // Delete existing images if editing (delete each one individually)
          if (product) {
            try {
              const existingImages = await apiRequest(`/api/products/${productId}/images`, { method: 'GET' });
              const currentImages = await existingImages.json();
                
                // Delete each existing image
                for (const existingImg of currentImages) {
                  await apiRequest(`/api/product-images/${existingImg.id}`, { method: 'DELETE' });
                }
            } catch (error) {
              console.warn('Error deleting existing images:', error);
            }
          }
          
          // Create new images using the correct endpoint
          for (const img of urlImages) {
            await apiRequest(`/api/products/${productId}/images`, {
              method: 'POST',
              body: {
                imageUrl: img.imageUrl,
                altText: img.altText || '',
                displayOrder: img.displayOrder || 0,
                isMain: img.isMain || false
              }
            });
          }
          
          // Set the main image using the correct endpoint
          const mainImage = urlImages.find(img => img.isMain);
          if (mainImage) {
            // First get the newly created image to get its ID
            const newImages = await apiRequest(`/api/products/${productId}/images`, { method: 'GET' });
            const createdImages = await newImages.json();
              const mainImageRecord = createdImages.find((img: any) => img.imageUrl === mainImage.imageUrl);
              
              if (mainImageRecord) {
                await apiRequest(`/api/products/${productId}/main-image/${mainImageRecord.id}`, { method: 'PUT' });
              }
          }
        }
      }
      
      return savedProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: product ? "Produto atualizado!" : "Produto criado!",
        description: "As alterações foram salvas com sucesso.",
      });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header moderno */}
        <div className="mb-8 p-6 rounded-2xl shadow-2xl" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Package className="h-8 w-8" />
                {product ? 'Editar Produto' : 'Adicionar Novo Produto'}
              </h1>
              <p className="text-blue-100 mt-2">Preencha as informações do produto com todos os detalhes necessários</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal - Informações do Produto */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Informações Básicas */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-2xl border border-gray-200 shadow-lg">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <Package className="h-6 w-6 text-blue-600" />
                    Informações Básicas
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        Nome do Produto 
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: iPhone 15 Pro Max"
                        className="h-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        Categoria 
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                        <SelectTrigger className="h-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      Descrição do Produto 
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Descrição completa do produto com todas as especificações..."
                      rows={4}
                      className="border-2 border-gray-300 focus:border-blue-500 rounded-xl resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        Preço de Venda 
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 font-bold">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          placeholder="999.00"
                          className="h-12 pl-12 border-2 border-gray-300 focus:border-green-500 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2">
                        Preço Original
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                          placeholder="1299.00"
                          className="h-12 pl-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção de Múltiplas Imagens - Moderna */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <ImageIcon className="h-6 w-6 text-purple-600" />
                    Galeria de Imagens
                  </h2>
                  <p className="text-gray-600 mt-1">Adicione múltiplas imagens do produto</p>
                </div>

                {/* Upload Area com Drag & Drop */}
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 mb-6 ${
                    dragOver 
                      ? 'border-purple-500 bg-purple-50 transform scale-[1.02]' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-purple-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Arraste e solte suas imagens aqui
                    </h3>
                    <p className="text-gray-500 mb-4">
                      ou clique para selecionar arquivos
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      Escolher Arquivos
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* Adicionar por URL */}
                <div className="mb-6">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Ou adicione imagens por URL
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="flex-1 h-12 border-2 border-gray-300 focus:border-purple-500 rounded-xl"
                    />
                    <Button 
                      type="button" 
                      onClick={addImageFromUrl}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 px-6 rounded-xl"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Preview das Imagens */}
                {formData.images.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview das Imagens</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all">
                            <img 
                              src={image.imageUrl} 
                              alt={image.altText || `Imagem ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Overlay com ações */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                                {!image.isMain && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="bg-white text-gray-700 hover:bg-gray-100"
                                    onClick={() => setMainImage(index)}
                                  >
                                    Principal
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeImage(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Indicador de Imagem Principal */}
                            {image.isMain && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-yellow-500 text-white text-xs font-bold">
                                  Principal
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Especificações Técnicas */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 shadow-lg">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-green-600" />
                    Especificações Técnicas
                  </h2>
                </div>

                {formData.specifications.map((spec, index) => (
                  <div key={index} className="flex gap-4 mb-4 items-end">
                    <div className="flex-1">
                      <Label className="text-sm font-semibold text-gray-700">Nome da Especificação</Label>
                      <Input
                        value={spec.attributeName}
                        onChange={(e) => {
                          const newSpecs = [...formData.specifications];
                          newSpecs[index].attributeName = e.target.value;
                          setFormData({...formData, specifications: newSpecs});
                        }}
                        placeholder="Ex: Memória, Processador"
                        className="h-12 border-2 border-green-300 focus:border-green-500 rounded-xl"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm font-semibold text-gray-700">Valor</Label>
                      <Input
                        value={spec.attributeValue}
                        onChange={(e) => {
                          const newSpecs = [...formData.specifications];
                          newSpecs[index].attributeValue = e.target.value;
                          setFormData({...formData, specifications: newSpecs});
                        }}
                        placeholder="Ex: 8GB, Intel i7"
                        className="h-12 border-2 border-green-300 focus:border-green-500 rounded-xl"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-12 px-4 rounded-xl"
                      onClick={() => {
                        const newSpecs = formData.specifications.filter((_, i) => i !== index);
                        setFormData({...formData, specifications: newSpecs});
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="border-green-300 text-green-600 hover:bg-green-50 h-12 rounded-xl"
                  onClick={() => {
                    setFormData({
                      ...formData, 
                      specifications: [...formData.specifications, { attributeName: '', attributeValue: '' }]
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Especificação
                </Button>
              </div>
            </div>

            {/* Sidebar - Configurações Adicionais */}
            <div className="space-y-6">
              
              {/* Status do Produto */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Status do Produto
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                    <div>
                      <Label className="font-semibold text-gray-700">Disponível</Label>
                      <p className="text-sm text-gray-500">Produto visível na loja</p>
                    </div>
                    <Switch 
                      checked={formData.isAvailable} 
                      onCheckedChange={(checked) => setFormData({...formData, isAvailable: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                    <div>
                      <Label className="font-semibold text-gray-700">Destaque</Label>
                      <p className="text-sm text-gray-500">Aparece em destaques</p>
                    </div>
                    <Switch 
                      checked={formData.isFeatured} 
                      onCheckedChange={(checked) => setFormData({...formData, isFeatured: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                    <div>
                      <Label className="font-semibold text-gray-700">Promoção</Label>
                      <p className="text-sm text-gray-500">Produto em oferta</p>
                    </div>
                    <Switch 
                      checked={formData.isPromotion} 
                      onCheckedChange={(checked) => setFormData({...formData, isPromotion: checked})}
                    />
                  </div>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 rounded-2xl border border-purple-200 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Ações Rápidas
                </h3>
                
                <div className="space-y-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50 h-12 rounded-xl"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Definir como Destaque
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50 h-12 rounded-xl"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Aplicar Desconto
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50 h-12 rounded-xl"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Analytics
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-6 mt-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-8 py-3 h-12 text-gray-600 border-2 border-gray-300 hover:bg-gray-50 rounded-xl"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-8 py-3 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all"
            >
              {saveMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {product ? 'Atualizar Produto' : 'Criar Produto'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
