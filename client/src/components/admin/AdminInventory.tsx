import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Edit, 
  Eye,
  Search
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
  isAvailable: boolean;
}

interface InventoryItem {
  id: string;
  productId: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  costPerUnit: string;
  supplier: string | null;
  location: string | null;
  lastRestocked: string | null;
  isActive: boolean;
  notes: string | null;
  product?: Product;
}

export function AdminInventory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  // Buscar dados reais de inventário da API
  const { data: inventoryItems = [], isLoading, refetch } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
    queryFn: () => fetch("/api/inventory").then((res) => res.json()),
  });

  // Buscar produtos para referência
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then((res) => res.json()),
  });

  // Mutations para operações CRUD
  const createInventoryMutation = useMutation({
    mutationFn: (data: Partial<InventoryItem>) => 
      fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      refetch();
      toast({ title: "Item criado com sucesso!" });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) =>
      fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      refetch();
      toast({ title: "Item atualizado com sucesso!" });
    },
  });

  // Filtrar itens baseado na busca e filtro de estoque
  const filteredItems = inventoryItems.filter(item => {
    const productName = item.product?.name || products.find(p => p.id === item.productId)?.name || '';
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = stockFilter === "all" || 
                         (stockFilter === "low" && item.currentStock <= item.minStock) ||
                         (stockFilter === "out" && item.currentStock === 0) ||
                         (stockFilter === "normal" && item.currentStock > item.minStock);
    
    return matchesSearch && matchesFilter;
  });

  // Estatísticas
  const totalItems = inventoryItems.length;
  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStock).length;
  const outOfStockItems = inventoryItems.filter(item => item.currentStock === 0).length;
  const totalValue = inventoryItems.reduce((sum, item) => 
    sum + (item.currentStock * parseFloat(item.costPerUnit)), 0
  );

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { status: "Sem estoque", color: "destructive" };
    if (item.currentStock <= item.minStock) return { status: "Estoque baixo", color: "secondary" };
    return { status: "Normal", color: "default" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque Inteligente</h1>
          <p className="text-muted-foreground">
            Gerencie o estoque dos seus produtos com alertas automáticos
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Item
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar produto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do produto ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filter">Filtrar por estoque</Label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger id="filter" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="normal">Estoque normal</SelectItem>
                  <SelectItem value="low">Estoque baixo</SelectItem>
                  <SelectItem value="out">Sem estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Estoque ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">Nenhum item encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || stockFilter !== "all" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Comece adicionando itens ao estoque"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const { status, color } = getStockStatus(item);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{item.product?.name || "Produto não encontrado"}</h3>
                        <Badge variant={color as any}>{status}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground space-y-1">
                        <p>Estoque atual: <strong>{item.currentStock}</strong> | Mínimo: {item.minStock} | Ponto de reposição: {item.reorderPoint}</p>
                        {item.supplier && <p>Fornecedor: {item.supplier}</p>}
                        {item.location && <p>Localização: {item.location}</p>}
                        <p>Custo unitário: R$ {parseFloat(item.costPerUnit).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="default" size="sm">
                        Movimentar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}