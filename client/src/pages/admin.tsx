import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload, Edit3, Trash2, Plus, Save, X, ToggleLeft, ToggleRight, Image, MapPin, Settings, ShoppingBag, BarChart3, Calculator } from "lucide-react";
import { AdminDeliveryZones } from "@/components/admin-delivery-zones";
import type { Product, Category, DeliveryZone, StoreSettings, Order, OrderItem, BannerTheme } from "@shared/schema";

interface EditingProduct {
  id?: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isPromotion: boolean;
}


interface EditingDeliveryZone {
  id?: string;
  neighborhoodName: string;
  deliveryFee: string;
  isActive: boolean;
}


export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [editingDeliveryZone, setEditingDeliveryZone] = useState<EditingDeliveryZone | null>(null);
  const [showNewZoneForm, setShowNewZoneForm] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria removida!",
        description: "Categoria foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      const message = error.message?.includes("existing products") 
        ? "Não é possível deletar categoria que possui produtos cadastrados."
        : "Erro ao remover categoria. Tente novamente.";
      toast({
        title: "Erro ao remover categoria",
        description: message,
        variant: "destructive",
      });
    },
  });


  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", "admin"],
    queryFn: () => fetch("/api/products?admin=true").then(res => res.json()),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: deliveryZones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
  });



  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["/api/store/settings"],
  });

  const updateProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("PUT", `/api/products/${productData.id}`, productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      toast({
        title: "Produto atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const recalculateAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/products/recalculate-all-prices", {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Preços recalculados!",
        description: `${data.successful} produtos atualizados com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao recalcular preços",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleRecalculateAllPrices = () => {
    recalculateAllMutation.mutate();
  };

  const recalculateProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("POST", `/api/products/${productId}/recalculate-price`, {});
    },
    onSuccess: async (response, productId) => {
      const data = await response.json();
      console.log('📥 RESPONSE RECEBIDO NO FRONTEND:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      const product = products.find(p => p.id === productId);
      
      // Corrigido: usar campos corretos do response
      const newPrice = data.totalPrice || 0;
      const formattedPrice = data.formattedPrice || `R$ ${newPrice.toFixed(2)}`;
      
      console.log('💰 Preço calculado:', newPrice, '| Formatado:', formattedPrice);
      
      toast({
        title: "Preço recalculado!",
        description: `${product?.name}: ${formattedPrice}`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao recalcular preço",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleRecalculatePrice = (productId: string) => {
    recalculateProductMutation.mutate(productId);
  };

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("POST", "/api/products", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowNewProductForm(false);
      toast({
        title: "Produto criado!",
        description: "Novo produto adicionado ao cardápio.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto removido!",
        description: "Produto foi removido do cardápio.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = async (product: Product) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || "",
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable ?? true,
      isFeatured: product.isFeatured ?? false,
      isPromotion: product.isPromotion ?? false,
    });
  };

  const handleSave = () => {
    if (!editingProduct) return;

    const productData = {
      id: editingProduct.id,
      name: editingProduct.name,
      description: editingProduct.description,
      price: editingProduct.price,
      originalPrice: editingProduct.originalPrice || null,
      categoryId: editingProduct.categoryId,
      imageUrl: editingProduct.imageUrl,
      isAvailable: editingProduct.isAvailable,
      isFeatured: editingProduct.isFeatured,
      isPromotion: editingProduct.isPromotion,
    };

    updateProductMutation.mutate(productData);
  };

  const handleCreate = () => {
    if (!editingProduct) return;

    const productData = {
      name: editingProduct.name,
      description: editingProduct.description,
      price: editingProduct.price,
      originalPrice: editingProduct.originalPrice || null,
      categoryId: editingProduct.categoryId,
      imageUrl: editingProduct.imageUrl,
      isAvailable: editingProduct.isAvailable,
      isFeatured: editingProduct.isFeatured,
      isPromotion: editingProduct.isPromotion,
    };

    createProductMutation.mutate(productData);
  };

  const handleToggleAvailability = (product: Product) => {
    const productData = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      isAvailable: !product.isAvailable,
      isFeatured: product.isFeatured,
      isPromotion: product.isPromotion,
    };

    updateProductMutation.mutate(productData);
  };

  const handleDelete = (productId: string) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Categoria";
  };

  const startNewProduct = () => {
    setEditingProduct({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      categoryId: categories[0]?.id || "",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      isAvailable: true,
      isFeatured: false,
      isPromotion: false,
    });
    setShowNewProductForm(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1 sm:mb-2">
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/")}
                    className="mr-2 sm:mr-4 p-1 sm:p-2"
                    data-testid="button-back-home"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground truncate">🍔 Painel Administrativo</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gerencie seus produtos sem mexer no código</p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button 
                  onClick={() => setLocation("/admin/analytics")}
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 px-2 sm:px-4"
                  data-testid="button-analytics"
                >
                  <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">📊</span>
                </Button>
                <Button 
                  onClick={startNewProduct}
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-2 sm:px-4"
                  data-testid="button-new-product"
                >
                  <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Novo Produto</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="flex min-w-max gap-1 w-auto bg-transparent p-0">
              <TabsTrigger value="products" className="flex items-center whitespace-nowrap px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Edit3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Produtos</span>
                <span className="sm:hidden">Prod.</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center whitespace-nowrap px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ShoppingBag className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Pedidos</span>
                <span className="sm:hidden">Ped.</span>
              </TabsTrigger>
              <TabsTrigger value="banner" className="flex items-center whitespace-nowrap px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Image className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Banner</span>
                <span className="sm:hidden">Ban.</span>
              </TabsTrigger>
              <TabsTrigger value="store-info" className="flex items-center whitespace-nowrap px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Loja</span>
                <span className="sm:hidden">Loja</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center whitespace-nowrap px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MapPin className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Entrega</span>
                <span className="sm:hidden">Entr.</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="space-y-6">
            {/* New Product Form */}
            {showNewProductForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar Novo Produto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductForm
                    product={editingProduct}
                    setProduct={setEditingProduct}
                    categories={categories}
                    onSave={handleCreate}
                    onCancel={() => {
                      setShowNewProductForm(false);
                      setEditingProduct(null);
                    }}
                    isCreating={true}
                    isLoading={createProductMutation.isPending}
                  />
                </CardContent>
              </Card>
            )}

            {/* Products List */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Edit3 className="mr-2 h-5 w-5" />
                Gerenciar Produtos ({products.length})
              </span>
              <Button
                onClick={handleRecalculateAllPrices}
                disabled={recalculateAllMutation.isPending}
                size="sm"
                variant="outline"
                className="px-3 py-2 text-sm"
                data-testid="button-recalculate-all-prices"
              >
                <Calculator className="mr-1 h-3 w-3" />
                {recalculateAllMutation.isPending ? "Recalculando..." : "Recalcular Preços"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border border-border rounded-lg p-4">
                  {editingProduct?.id === product.id ? (
                    <ProductForm
                      product={editingProduct}
                      setProduct={setEditingProduct}
                      categories={categories}
                      onSave={handleSave}
                      onCancel={() => setEditingProduct(null)}
                      isCreating={false}
                      isLoading={updateProductMutation.isPending}
                    />
                  ) : (
                    <div className="space-y-3">
                      {/* Mobile Layout */}
                      <div className="flex items-start space-x-3">
                        {/* Product Image */}
                        <div className="relative group flex-shrink-0">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer rounded-lg flex items-center justify-center transition-opacity">
                            <Image className="text-white h-4 w-4" />
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base md:text-lg font-semibold truncate">{product.name}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                            </div>
                            
                            {/* Availability Toggle - Always visible */}
                            <div className="flex-shrink-0 ml-2">
                              <Button
                                onClick={() => handleToggleAvailability(product)}
                                variant={product.isAvailable ? "default" : "secondary"}
                                size="sm"
                                className="px-2 py-1 text-xs h-7"
                                data-testid={`button-toggle-${product.id}`}
                              >
                                {product.isAvailable ? (
                                  <>
                                    <ToggleRight className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">Disponível</span>
                                    <span className="sm:hidden">Disp</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">Indisponível</span>
                                    <span className="sm:hidden">Indisp</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Price and Category */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                                <span className="text-xs sm:text-sm text-muted-foreground line-through">
                                  R$ {parseFloat(product.originalPrice).toFixed(2)}
                                </span>
                              )}
                              <span className="text-sm sm:text-lg md:text-xl font-bold text-accent">
                                R$ {parseFloat(product.price).toFixed(2)}
                              </span>
                            </div>
                            
                            <Badge variant="outline" className="text-xs">
                              {getCategoryName(product.categoryId)}
                            </Badge>
                          </div>
                          
                          {/* Badges and Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {product.isFeatured && (
                                <Badge className="bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5">
                                  Destaque
                                </Badge>
                              )}
                              {product.isPromotion && (
                                <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                                  Promoção
                                </Badge>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center space-x-1">
                              <Button
                                onClick={() => handleRecalculatePrice(product.id)}
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                disabled={recalculateProductMutation.isPending}
                                title="Recalcular preço do produto"
                                data-testid={`button-recalculate-${product.id}`}
                              >
                                <Calculator className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => handleEdit(product)}
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                data-testid={`button-edit-${product.id}`}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(product.id)}
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                data-testid={`button-delete-${product.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </TabsContent>


          <TabsContent value="banner" className="space-y-6">
            <BannerManagement />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="store-info" className="space-y-6">
            <StoreInfoManagement />
          </TabsContent>

          <TabsContent value="delivery">
            <AdminDeliveryZones />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



interface ProductFormProps {
  product: EditingProduct | null;
  setProduct: (product: EditingProduct) => void;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
  isCreating: boolean;
  isLoading: boolean;
}

interface NewCategoryForm {
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
}

function ProductForm({ product, setProduct, categories, onSave, onCancel, isCreating, isLoading }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState<NewCategoryForm>({
    name: "",
    slug: "",
    icon: "🍔",
    displayOrder: categories.length + 1
  });


  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return await apiRequest("POST", "/api/categories", categoryData);
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      const newCat = await response.json();
      setProduct({ ...product!, categoryId: newCat.id });
      setShowNewCategoryForm(false);
      setNewCategory({ name: "", slug: "", icon: "🍔", displayOrder: categories.length + 1 });
      toast({
        title: "Categoria criada!",
        description: "Nova categoria adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar categoria",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da categoria.",
        variant: "destructive",
      });
      return;
    }

    if (!newCategory.slug.trim()) {
      setNewCategory(prev => ({
        ...prev,
        slug: prev.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }));
    }

    createCategoryMutation.mutate(newCategory);
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria removida!",
        description: "Categoria foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      const message = error.message?.includes("existing products") 
        ? "Não é possível deletar categoria que possui produtos cadastrados."
        : "Erro ao remover categoria. Tente novamente.";
      toast({
        title: "Erro ao remover categoria",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (confirm(`Tem certeza que deseja remover a categoria "${categoryName}"?`)) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  if (!product) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input
            id="name"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            placeholder="Ex: X-Bacon Deluxe"
            data-testid="input-product-name"
          />
        </div>
        <div>
          <Label htmlFor="category">Categoria *</Label>
          <div className="space-y-2">
            <Select
              value={product.categoryId}
              onValueChange={(value) => setProduct({ ...product, categoryId: value })}
            >
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                className="w-full"
                data-testid="button-new-category"
              >
                <Plus className="mr-2 h-4 w-4" />
                {showNewCategoryForm ? 'Cancelar' : 'Criar Nova Categoria'}
              </Button>
              
              {categories.length > 0 && (
                <div className="text-sm">
                  <Label className="text-xs text-muted-foreground">Categorias existentes:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center bg-muted rounded px-2 py-1 text-xs"
                      >
                        <span className="mr-1">{category.icon}</span>
                        <span className="mr-2">{category.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                          data-testid={`button-delete-category-${category.slug}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {showNewCategoryForm && (
              <Card className="p-4 bg-muted/30">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="newCategoryName">Nome *</Label>
                      <Input
                        id="newCategoryName"
                        value={newCategory.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setNewCategory(prev => ({
                            ...prev,
                            name,
                            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                          }));
                        }}
                        placeholder="Ex: Combos"
                        data-testid="input-new-category-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newCategoryIcon">Ícone *</Label>
                      <Input
                        id="newCategoryIcon"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="🍔"
                        data-testid="input-new-category-icon"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={createCategoryMutation.isPending}
                      size="sm"
                      data-testid="button-save-category"
                    >
                      {createCategoryMutation.isPending ? 'Criando...' : 'Criar Categoria'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewCategoryForm(false);
                        setNewCategory({ name: "", slug: "", icon: "🍔", displayOrder: categories.length + 1 });
                      }}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Preço *</Label>
          <Input
            id="price"
            type="text"
            inputMode="decimal"
            value={product.price}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, numbers and decimal point
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setProduct({ ...product, price: value });
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                setProduct({ ...product, price: parseFloat(value).toFixed(2) });
              } else {
                setProduct({ ...product, price: '0.00' });
              }
            }}
            placeholder="18.90"
            data-testid="input-product-price"
          />
        </div>
        <div>
          <Label htmlFor="originalPrice">Preço Original (opcional)</Label>
          <Input
            id="originalPrice"
            type="text"
            inputMode="decimal"
            value={product.originalPrice}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, numbers and decimal point
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setProduct({ ...product, originalPrice: value });
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                setProduct({ ...product, originalPrice: parseFloat(value).toFixed(2) });
              } else {
                setProduct({ ...product, originalPrice: '' });
              }
            }}
            placeholder="22.90"
            data-testid="input-original-price"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          value={product.description}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
          placeholder="Hambúrguer suculento com bacon crocante, queijo e molho especial"
          rows={3}
          data-testid="input-product-description"
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">URL da Imagem *</Label>
        <Input
          id="imageUrl"
          value={product.imageUrl}
          onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })}
          placeholder="https://images.unsplash.com/photo-..."
          data-testid="input-image-url"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Recomendado: 600x400px para melhor qualidade
        </p>
      </div>

      <div className="flex items-center space-x-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={product.isAvailable}
            onChange={(e) => setProduct({ ...product, isAvailable: e.target.checked })}
            className="rounded"
            data-testid="checkbox-available"
          />
          <span>Disponível</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={product.isFeatured}
            onChange={(e) => setProduct({ ...product, isFeatured: e.target.checked })}
            className="rounded"
            data-testid="checkbox-featured"
          />
          <span>Produto em Destaque</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={product.isPromotion}
            onChange={(e) => setProduct({ ...product, isPromotion: e.target.checked })}
            className="rounded"
            data-testid="checkbox-promotion"
          />
          <span>Em Promoção</span>
        </label>
      </div>


      <Separator />

      <div className="flex space-x-2">
        <Button
          onClick={onSave}
          disabled={isLoading || !product.name || !product.description || !product.price || !product.categoryId}
          className="bg-accent hover:bg-accent/90"
          data-testid="button-save-product"
        >
          <Save className="mr-1 h-4 w-4" />
          {isLoading ? "Salvando..." : (isCreating ? "Criar Produto" : "Salvar Alterações")}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          data-testid="button-cancel-edit"
        >
          <X className="mr-1 h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// Banner Management Component
function BannerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBanner, setEditingBanner] = useState<BannerTheme | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all banners
  const { data: banners = [] } = useQuery<BannerTheme[]>({
    queryKey: ["/api/banners"],
    queryFn: () => fetch("/api/banners").then(res => res.json()),
  });

  // Banner mutations
  const createBannerMutation = useMutation({
    mutationFn: async (bannerData: any) => {
      return await apiRequest("POST", "/api/banners", bannerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setIsModalOpen(false);
      setEditingBanner(null);
      toast({
        title: "Banner criado!",
        description: "Novo banner foi adicionado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar banner",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async (bannerData: any) => {
      return await apiRequest("PUT", `/api/banners/${bannerData.id}`, bannerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setIsModalOpen(false);
      setEditingBanner(null);
      toast({
        title: "Banner atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar banner",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const activateBannerMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      return await apiRequest("PUT", `/api/banners/${bannerId}/activate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({
        title: "Banner ativado!",
        description: "Banner está agora ativo no site.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao ativar banner",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      return await apiRequest("DELETE", `/api/banners/${bannerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({
        title: "Banner removido!",
        description: "Banner foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover banner",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    setEditingBanner({
      id: "",
      name: "",
      isCustomizable: true,
      htmlContent: "",
      title: "",
      description: "",
      price: "18.90",
      imageUrl: "",
      gradientColor1: "#ff6b35",
      gradientColor2: "#f7931e", 
      gradientColor3: "#ffd23f",
      gradientColor4: "#ff8c42",
      useBackgroundImage: false,
      isActive: false,
      createdAt: new Date()
    });
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleEdit = (banner: BannerTheme) => {
    setEditingBanner(banner);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleActivate = (bannerId: string) => {
    activateBannerMutation.mutate(bannerId);
  };

  const handleDelete = (bannerId: string, bannerName: string) => {
    if (confirm(`Tem certeza que deseja remover o banner "${bannerName}"?`)) {
      deleteBannerMutation.mutate(bannerId);
    }
  };

  const handleSave = () => {
    if (!editingBanner) return;

    const bannerData = {
      ...editingBanner,
      price: editingBanner.price?.toString() || "0.00",
    };

    if (isCreating) {
      createBannerMutation.mutate(bannerData);
    } else {
      updateBannerMutation.mutate(bannerData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with New Banner Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Image className="mr-2 h-5 w-5" />
                Gerenciar Banners ({banners.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure os banners temáticos do seu site
              </p>
            </div>
            <Button onClick={handleCreate} className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Banner
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Banners List */}
      <Card>
        <CardContent className="pt-6">
          {banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum banner encontrado</p>
              <p className="text-sm">Clique em "Novo Banner" para criar o primeiro</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{banner.name}</h3>
                        {banner.isActive && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Ativo
                          </Badge>
                        )}
                        <Badge variant={banner.isCustomizable ? "default" : "secondary"}>
                          {banner.isCustomizable ? "Customizável" : "HTML"}
                        </Badge>
                      </div>
                      {banner.isCustomizable && banner.title && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {banner.title} - {banner.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={banner.isActive ? "secondary" : "default"}
                        onClick={() => handleActivate(banner.id)}
                        disabled={banner.isActive || activateBannerMutation.isPending}
                      >
                        {banner.isActive ? "Ativo" : "Ativar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(banner)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(banner.id, banner.name)}
                        disabled={banner.isActive}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banner Modal */}
      <BannerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBanner(null);
        }}
        banner={editingBanner}
        setBanner={setEditingBanner}
        onSave={handleSave}
        isCreating={isCreating}
        isLoading={createBannerMutation.isPending || updateBannerMutation.isPending}
      />
    </div>
  );
}

// Banner Modal Component
interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner: BannerTheme | null;
  setBanner: (banner: BannerTheme | null) => void;
  onSave: () => void;
  isCreating: boolean;
  isLoading: boolean;
}

function BannerModal({ isOpen, onClose, banner, setBanner, onSave, isCreating, isLoading }: BannerModalProps) {
  if (!banner) return null;

  const handleFieldChange = (field: keyof BannerTheme, value: any) => {
    setBanner({ ...banner, [field]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Criar Novo Banner" : "Editar Banner"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Banner Name */}
          <div>
            <Label htmlFor="banner-name">Nome do Banner *</Label>
            <Input
              id="banner-name"
              value={banner.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Ex: Banner Verão 2024"
            />
          </div>

          {/* Is Customizable */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is-customizable"
              checked={banner.isCustomizable}
              onChange={(e) => handleFieldChange('isCustomizable', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is-customizable">Banner Customizável</Label>
            <p className="text-xs text-muted-foreground">
              (Se desmarcado, use apenas HTML)
            </p>
          </div>

          {/* Conditional Fields */}
          {banner.isCustomizable ? (
            // Customizable Banner Fields
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={banner.title || ""}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Ex: Hambúrguers Artesanais"
                  />
                </div>
                <div>
                  <Label>Preço</Label>
                  <Input
                    value={banner.price?.toString() || ""}
                    onChange={(e) => handleFieldChange('price', e.target.value)}
                    placeholder="18.90"
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={banner.description || ""}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Ex: Ingredientes frescos, sabor incomparável"
                  rows={2}
                />
              </div>

              <div>
                <Label>URL da Imagem</Label>
                <Input
                  value={banner.imageUrl || ""}
                  onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              {/* Colors */}
              <div>
                <Label>Cores do Gradiente</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <Label className="text-sm">Cor 1</Label>
                    <Input
                      type="color"
                      value={banner.gradientColor1 || "#ff6b35"}
                      onChange={(e) => handleFieldChange('gradientColor1', e.target.value)}
                      className="h-12 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Cor 2</Label>
                    <Input
                      type="color"
                      value={banner.gradientColor2 || "#f7931e"}
                      onChange={(e) => handleFieldChange('gradientColor2', e.target.value)}
                      className="h-12 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Cor 3</Label>
                    <Input
                      type="color"
                      value={banner.gradientColor3 || "#ffd23f"}
                      onChange={(e) => handleFieldChange('gradientColor3', e.target.value)}
                      className="h-12 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Cor 4</Label>
                    <Input
                      type="color"
                      value={banner.gradientColor4 || "#ff8c42"}
                      onChange={(e) => handleFieldChange('gradientColor4', e.target.value)}
                      className="h-12 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // HTML Content Field
            <div>
              <Label>Conteúdo HTML</Label>
              <Textarea
                value={banner.htmlContent || ""}
                onChange={(e) => handleFieldChange('htmlContent', e.target.value)}
                placeholder="Cole aqui o código HTML completo do banner..."
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                HTML será inserido diretamente no site. Certifique-se de que o código está correto.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              disabled={isLoading || !banner.name}
            >
              {isLoading ? "Salvando..." : (isCreating ? "Criar Banner" : "Salvar Alterações")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Store Info Management Component
function StoreInfoManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<StoreSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["/api/store/settings"],
  });

  // Inicializar formData quando os dados chegarem
  useEffect(() => {
    if (storeSettings && !hasChanges) {
      setFormData({
        siteName: storeSettings.siteName,
        storeTitle: storeSettings.storeTitle,
        storeImageUrl: storeSettings.storeImageUrl,
        storeAddress: storeSettings.storeAddress,
        storeNeighborhood: storeSettings.storeNeighborhood,
        storeHours: storeSettings.storeHours,
        deliveryTime: storeSettings.deliveryTime,
        deliveryFeeRange: storeSettings.deliveryFeeRange,
        paymentMethods: storeSettings.paymentMethods,
      });
    }
  }, [storeSettings, hasChanges]);

  const updateStoreSettingsMutation = useMutation({
    mutationFn: async (data: Partial<StoreSettings>) => {
      return await apiRequest("PUT", "/api/store/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/settings"] });
      setHasChanges(false);
      toast({
        title: "Informações atualizadas!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar informações",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof StoreSettings, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveInfo = () => {
    updateStoreSettingsMutation.mutate(formData);
  };

  if (!storeSettings) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Informações da Loja
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure as informações que aparecem na seção "Nossa Loja"
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nome do Site e Título da Loja */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Identidade da Marca</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="site-name">Nome do Site (Cabeçalho)</Label>
              <Input
                id="site-name"
                value={formData.siteName || ""}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                placeholder="Ex: Burger House"
                data-testid="input-site-name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nome que aparece no cabeçalho do site (🍔 Nome)
              </p>
            </div>
            <div>
              <Label htmlFor="store-title">Título da Seção Nossa Loja</Label>
              <Input
                id="store-title"
                value={formData.storeTitle || ""}
                onChange={(e) => handleInputChange('storeTitle', e.target.value)}
                placeholder="Ex: Nossa Loja"
                data-testid="input-store-title"
              />
            </div>
            <div>
              <Label htmlFor="store-image">URL da Imagem da Loja</Label>
              <Input
                id="store-image"
                value={formData.storeImageUrl || ""}
                onChange={(e) => handleInputChange('storeImageUrl', e.target.value)}
                placeholder="https://exemplo.com/imagem-loja.jpg"
                data-testid="input-store-image"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Foto do interior/exterior da hamburgueria (recomendado: 800x600px)
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Informações de Localização */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Localização</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store-address">Endereço</Label>
              <Input
                id="store-address"
                value={formData.storeAddress || ""}
                onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                placeholder="Ex: Rua das Delícias, 123"
                data-testid="input-store-address"
              />
            </div>
            <div>
              <Label htmlFor="store-neighborhood">Bairro/Cidade</Label>
              <Input
                id="store-neighborhood"
                value={formData.storeNeighborhood || ""}
                onChange={(e) => handleInputChange('storeNeighborhood', e.target.value)}
                placeholder="Ex: Centro, São Paulo - SP"
                data-testid="input-store-neighborhood"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Horários e Funcionamento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Funcionamento</h3>
          <div>
            <Label htmlFor="store-hours">Horário de Funcionamento</Label>
            <Textarea
              id="store-hours"
              value={formData.storeHours || ""}
              onChange={(e) => handleInputChange('storeHours', e.target.value)}
              placeholder="Segunda a Sexta: 18h - 23h
Sábado e Domingo: 18h - 00h"
              rows={3}
              data-testid="textarea-store-hours"
            />
          </div>
        </div>

        <Separator />

        {/* Entrega e Pagamento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Entrega e Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery-time">Tempo de Entrega</Label>
              <Input
                id="delivery-time"
                value={formData.deliveryTime || ""}
                onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                placeholder="Ex: Tempo médio: 30-45 minutos"
                data-testid="input-delivery-time"
              />
            </div>
            <div>
              <Label htmlFor="delivery-fee-range">Faixa de Taxa de Entrega</Label>
              <Input
                id="delivery-fee-range"
                value={formData.deliveryFeeRange || ""}
                onChange={(e) => handleInputChange('deliveryFeeRange', e.target.value)}
                placeholder="Ex: Taxa: R$ 3,90 - R$ 8,90"
                data-testid="input-delivery-fee-range"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="payment-methods">Métodos de Pagamento</Label>
            <Textarea
              id="payment-methods"
              value={formData.paymentMethods || ""}
              onChange={(e) => handleInputChange('paymentMethods', e.target.value)}
              placeholder="Dinheiro, Cartão, PIX
Mercado Pago integrado"
              rows={3}
              data-testid="textarea-payment-methods"
            />
          </div>
        </div>

        {/* Preview da Imagem da Loja */}
        {formData.storeImageUrl && (
          <>
            <Separator />
            <div>
              <Label>Preview da Imagem da Loja</Label>
              <div className="border rounded-lg p-4 bg-muted">
                <img
                  src={formData.storeImageUrl}
                  alt="Preview loja"
                  className="max-w-full h-48 object-cover rounded-lg mx-auto"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                storeTitle: storeSettings?.storeTitle,
                storeImageUrl: storeSettings?.storeImageUrl,
                storeAddress: storeSettings?.storeAddress,
                storeNeighborhood: storeSettings?.storeNeighborhood,
                storeHours: storeSettings?.storeHours,
                deliveryTime: storeSettings?.deliveryTime,
                deliveryFeeRange: storeSettings?.deliveryFeeRange,
                paymentMethods: storeSettings?.paymentMethods,
              });
              setHasChanges(false);
            }}
            disabled={!hasChanges}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveInfo}
            disabled={updateStoreSettingsMutation.isPending || !hasChanges}
          >
            {updateStoreSettingsMutation.isPending ? "Salvando..." : "Salvar Informações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Order Management Component
function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("todos");

  // Fetch orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status atualizado!",
        description: "O status do pedido foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateOrderPaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) => {
      return await apiRequest("PUT", `/api/orders/${orderId}/payment-status`, { paymentStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status de pagamento atualizado!",
        description: "O status de pagamento foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Pedido excluído!",
        description: "O pedido foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir pedido",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handlePaymentStatusUpdate = (orderId: string, paymentStatus: string) => {
    updateOrderPaymentStatusMutation.mutate({ orderId, paymentStatus });
  };

  const handleDeleteOrder = (orderId: string, orderNumber: string) => {
    if (confirm(`Tem certeza que deseja excluir o pedido #${orderNumber}? Esta ação não pode ser desfeita.`)) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleWhatsApp = (phone: string, orderNumber: string) => {
    const message = `Olá! Seu pedido #${orderNumber} foi atualizado. Entre em contato para mais informações.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Filter orders based on status
  const filteredOrders = orders.filter((order: Order) => 
    statusFilter === "todos" || order.orderStatus === statusFilter
  );

  // Calculate statistics
  const todayOrders = orders.filter((order: Order) => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const preparingOrders = orders.filter((order: Order) => order.orderStatus === "preparando");
  // Only count revenue from paid orders
  const paidTodayOrders = todayOrders.filter((order: Order) => order.paymentStatus === "paid");
  const totalRevenue = paidTodayOrders.reduce((sum: number, order: Order) => sum + parseFloat(order.total), 0);

  const statusColors: Record<string, string> = {
    pendente: "bg-red-500",
    preparando: "bg-yellow-500", 
    entregando: "bg-blue-500",
    entregue: "bg-green-500"
  };

  const statusLabels: Record<string, string> = {
    pendente: "🔴 Pendente",
    preparando: "🟡 Preparando",
    entregando: "🔵 Saindo",
    entregue: "🟢 Entregue"
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">{todayOrders.length}</div>
            <div className="text-sm opacity-90">Pedidos Hoje</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">{preparingOrders.length}</div>
            <div className="text-sm opacity-90">Em Preparo</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <div className="text-sm opacity-90">Faturamento</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">45min</div>
            <div className="text-sm opacity-90">Tempo Médio</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "todos", label: "Todos" },
              { key: "pendente", label: "Pendentes" },
              { key: "preparando", label: "Em Preparo" },
              { key: "entregando", label: "Saindo" },
              { key: "entregue", label: "Entregues" }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={statusFilter === filter.key ? "default" : "outline"}
                onClick={() => setStatusFilter(filter.key)}
                className="rounded-full"
                data-testid={`filter-${filter.key}`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {statusFilter === "todos" ? "Nenhum pedido encontrado." : `Nenhum pedido ${statusFilter} encontrado.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order: Order) => (
            <Card key={order.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">#{order.orderNumber} - {order.customerName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="text-xl font-bold text-orange-600">
                    R$ {order.total}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span className="text-sm">{order.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="text-sm">{order.streetName}, {order.houseNumber} - {order.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💳</span>
                    <span className="text-sm">{order.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span className="text-sm">
                      {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60))} min atrás
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                {order.orderItems && order.orderItems.length > 0 && (
                  <div className="mb-4 p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Itens do Pedido:</h4>
                    <div className="space-y-1">
                      {order.orderItems.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x Produto</span>
                          <span>R$ {item.totalPrice}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>R$ {order.total}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status and Actions */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <Button
                        key={status}
                        variant={order.orderStatus === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, status)}
                        className={`rounded-full ${order.orderStatus === status ? statusColors[status] + ' text-white' : ''}`}
                        disabled={updateOrderStatusMutation.isPending}
                        data-testid={`status-${status}-${order.orderNumber}`}
                      >
                        {label}
                      </Button>
                    ))}
                    
                    {/* Payment Status Button */}
                    <Button
                      variant={order.paymentStatus === "paid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePaymentStatusUpdate(order.id, order.paymentStatus === "paid" ? "pending" : "paid")}
                      className={`rounded-full ${order.paymentStatus === "paid" ? 'bg-green-600 text-white' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
                      disabled={updateOrderPaymentStatusMutation.isPending}
                      data-testid={`payment-${order.orderNumber}`}
                    >
                      {order.paymentStatus === "paid" ? "✅ Pago" : "💰 Marcar Pago"}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWhatsApp(order.customerPhone, order.orderNumber)}
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      data-testid={`whatsapp-${order.orderNumber}`}
                    >
                      💬 WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                      className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      disabled={deleteOrderMutation.isPending}
                      data-testid={`delete-${order.orderNumber}`}
                    >
                      🗑️ Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

