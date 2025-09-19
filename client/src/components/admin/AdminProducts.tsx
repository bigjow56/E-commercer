import { useState, useEffect } from "react";
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

interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  imageUrl: string;
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

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Separate product data from specifications
      const { specifications, ...productData } = data;
      
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: iPhone 15 Pro 128GB"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    placeholder="IP15P-128-BLK"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição completa do produto..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => setFormData({...formData, categoryId: value})}
                >
                  <SelectTrigger>
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
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Preços e Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço de Venda *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="999.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Preço Original</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                    placeholder="1299.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Estoque Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 5})}
                    placeholder="5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Imagens do Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL da Imagem Principal *</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://exemplo.com/imagem.jpg"
                    required
                  />
                </div>
                {formData.imageUrl && (
                  <div className="border rounded-lg p-4">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="max-h-48 w-auto mx-auto rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Especificações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Nome da Especificação</Label>
                      <Input
                        value={spec.attributeName}
                        onChange={(e) => {
                          const newSpecs = [...formData.specifications];
                          newSpecs[index].attributeName = e.target.value;
                          setFormData({...formData, specifications: newSpecs});
                        }}
                        placeholder="Ex: Tela, Processador, RAM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input
                        value={spec.attributeValue}
                        onChange={(e) => {
                          const newSpecs = [...formData.specifications];
                          newSpecs[index].attributeValue = e.target.value;
                          setFormData({...formData, specifications: newSpecs});
                        }}
                        placeholder="Ex: 6.1 polegadas, A17 Pro, 8GB"
                      />
                    </div>
                    <div className="space-y-2 flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newSpecs = formData.specifications.filter((_, i) => i !== index);
                          setFormData({...formData, specifications: newSpecs});
                        }}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newSpecs = [...formData.specifications, {
                      attributeName: '',
                      attributeValue: '',
                      priceModifier: '0'
                    }];
                    setFormData({...formData, specifications: newSpecs});
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Especificação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Status do Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="available">Disponível</Label>
                <Switch
                  id="available"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData({...formData, isAvailable: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Produto em Destaque</Label>
                <Switch
                  id="featured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({...formData, isFeatured: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="promotion">Em Promoção</Label>
                <Switch
                  id="promotion"
                  checked={formData.isPromotion}
                  onCheckedChange={(checked) => setFormData({...formData, isPromotion: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                disabled={saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Salvando...' : (product ? 'Atualizar Produto' : 'Criar Produto')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}