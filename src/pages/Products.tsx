import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, FolderPlus, Star, Settings2, Gift, Factory } from "lucide-react"; // Importar Factory
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase as sb } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
const supabase: any = sb;

interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
  image_url?: string;
  category_id?: string;
  stock_quantity: number;
  earns_loyalty_points: boolean;
  loyalty_points_value: number;
  has_variations: boolean;
  can_be_redeemed_with_points: boolean;
  redemption_points_cost: number;
  cost_price: number;
  is_perishable: boolean;
  is_packaging: boolean;
  supplier_product_id?: string | null; // NOVO: Adicionado supplier_product_id
}

interface PackagingLink {
  id?: string;
  packaging_id: string;
  product_id: string;
  quantity: number;
  store_id?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Variation {
  id: string;
  product_id: string;
  name: string;
  price_adjustment: number;
  stock_quantity: number;
  is_composite: boolean;
  raw_material_product_id?: string | null;
  raw_material_variation_id?: string | null;
  yield_quantity: number;
}

interface Supplier {
  id: string;
  corporate_name: string;
}

interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  cost_price: number | null;
  products?: { // Nested product info from join
    name: string;
  };
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // State for adding new product
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductImageUrl, setNewProductImageUrl] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [newProductLoyaltyPointsValue, setNewProductLoyaltyPointsValue] = useState("0.0");
  const [newProductHasVariations, setNewProductHasVariations] = useState(false);
  const [newProductStockQuantity, setNewProductStockQuantity] = useState("0");
  const [newProductCanBeRedeemed, setNewProductCanBeRedeemed] = useState(false);
  const [newProductRedemptionCost, setNewProductRedemptionCost] = useState("0");
  const [newProductCostPrice, setNewProductCostPrice] = useState("0.00");
  const [newProductIsPerishable, setNewProductIsPerishable] = useState(false);
  const [newProductIsPackaging, setNewProductIsPackaging] = useState(false);
  const [newProductPackagingLinks, setNewProductPackagingLinks] = useState<Array<{productId: string, quantity: number}>>([]);
  
  // State for category management dialog
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // State for product editing dialog
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductPrice, setEditProductPrice] = useState("");
  const [editProductImageUrl, setEditProductImageUrl] = useState("");
  const [editProductCategoryId, setEditProductCategoryId] = useState("");
  const [editProductLoyaltyPointsValue, setEditProductLoyaltyPointsValue] = useState("0.0");
  const [editProductHasVariations, setEditProductHasVariations] = useState(false);
  const [editProductStockQuantity, setEditProductStockQuantity] = useState("");
  const [editProductCanBeRedeemed, setEditProductCanBeRedeemed] = useState(false);
  const [editProductRedemptionCost, setEditProductRedemptionCost] = useState("0");
  const [editProductCostPrice, setEditProductCostPrice] = useState("0.00");
  const [editProductIsPerishable, setEditProductIsPerishable] = useState(false);
  const [editProductIsPackaging, setEditProductIsPackaging] = useState(false);
  const [editProductPackagingLinks, setEditProductPackagingLinks] = useState<Array<{productId: string, quantity: number}>>([]);
  // NOVO: Estados para vincular a produtos de fornecedor
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierIdForProduct, setSelectedSupplierIdForProduct] = useState<string | null>(null);
  const [availableSupplierProducts, setAvailableSupplierProducts] = useState<SupplierProduct[]>([]);
  const [selectedSupplierProductId, setSelectedSupplierProductId] = useState<string | null>(null);
  
  // State for variation management dialog
  const [showVariationsDialog, setShowVariationsDialog] = useState(false);
  const [currentProductForVariations, setCurrentProductForVariations] = useState<Product | null>(null);
  const [productVariations, setProductVariations] = useState<Variation[]>([]);
  const [allVariationsForComposite, setAllVariationsForComposite] = useState<(Variation & { product_name: string })[]>([]);
  const [newVariationName, setNewVariationName] = useState("");
  const [newVariationPriceAdjustment, setNewVariationPriceAdjustment] = useState("0.0");
  const [newVariationStockQuantity, setNewVariationStockQuantity] = useState("0");
  const [newVariationIsComposite, setNewVariationIsComposite] = useState(false);
  const [newVariationRawMaterialId, setNewVariationRawMaterialId] = useState("");
  const [newVariationRawMaterialType, setNewVariationRawMaterialType] = useState<'product' | 'variation'>('product');
  const [newVariationYieldQuantity, setNewVariationYieldQuantity] = useState("1");
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.store_id) {
      loadProducts();
      loadCategories();
      loadSuppliers(); // NOVO: Carregar fornecedores
    }
  }, [profile]);

  // NOVO: Efeito para carregar produtos do fornecedor quando o fornecedor selecionado muda
  useEffect(() => {
    if (selectedSupplierIdForProduct) {
      loadSupplierProducts(selectedSupplierIdForProduct);
    } else {
      setAvailableSupplierProducts([]);
      setSelectedSupplierProductId(null);
    }
  }, [selectedSupplierIdForProduct]);

  // NOVO: Efeito para preencher o preço de custo quando o produto do fornecedor selecionado muda
  useEffect(() => {
    if (selectedSupplierProductId) {
      const selected = availableSupplierProducts.find(sp => sp.id === selectedSupplierProductId);
      if (selected?.cost_price !== null && selected?.cost_price !== undefined) {
        setEditProductCostPrice(selected.cost_price.toFixed(2));
      }
    }
  }, [selectedSupplierProductId, availableSupplierProducts]);

  const loadCategories = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", profile.store_id)
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar categorias",
        description: error.message,
      });
    } else {
      setCategories(data || []);
    }
  };

  const loadProducts = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("products")
      .select("*, supplier_product_id") // NOVO: Selecionar supplier_product_id
      .eq("store_id", profile.store_id)
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: error.message,
      });
    } else {
      setProducts(data || []);
    }
  };

  const loadVariationsForProduct = async (productId: string) => {
    const { data, error } = await supabase
      .from("product_variations")
      .select("*")
      .eq("product_id", productId)
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar variações",
        description: error.message,
      });
      return [];
    }
    setProductVariations(data || []);
    return data || [];
  };

  const loadAllVariationsForComposite = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("product_variations")
      .select("*, products!inner(name, store_id)")
      .eq("products.store_id", profile.store_id);

    if (error) {
      console.error("Erro ao carregar variações:", error);
      return;
    }

    const variationsWithProductName = (data || []).map((v: any) => ({
      ...v,
      product_name: v.products.name,
    }));

    // Ordenar manualmente pelo nome do produto
    variationsWithProductName.sort((a, b) => 
      a.product_name.localeCompare(b.product_name)
    );

    setAllVariationsForComposite(variationsWithProductName);
  };

  // NOVO: Função para carregar fornecedores
  const loadSuppliers = async () => {
    if (!profile?.store_id) return;
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, corporate_name")
      .eq("store_id", profile.store_id)
      .order("corporate_name");

    if (error) {
      console.error("Erro ao carregar fornecedores:", error.message);
    } else {
      setAvailableSuppliers(data || []);
    }
  };

  // NOVO: Função para carregar produtos de um fornecedor específico
  const loadSupplierProducts = async (supplierId: string) => {
    const { data, error } = await supabase
      .from("supplier_products")
      .select(`
        id,
        supplier_id,
        product_id,
        cost_price,
        products (name)
      `)
      .eq("supplier_id", supplierId);

    if (error) {
      console.error("Erro ao carregar produtos do fornecedor:", error.message);
    } else {
      setAvailableSupplierProducts(data || []);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.store_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar vinculado a uma loja",
      });
      return;
    }

    const loyaltyValue = parseFloat(newProductLoyaltyPointsValue);
    const earnsLoyalty = loyaltyValue > 0;
    const redemptionCost = parseFloat(newProductRedemptionCost);

    const { data: productData, error } = await supabase.from("products").insert({
      store_id: profile.store_id,
      name: newProductName,
      price: newProductHasVariations ? 0 : parseFloat(newProductPrice), // Preço 0 se tiver variações
      image_url: newProductImageUrl || null,
      category_id: newProductCategoryId && newProductCategoryId !== "none" ? newProductCategoryId : null,
      stock_quantity: newProductHasVariations ? 0 : parseInt(newProductStockQuantity || "0"), // Estoque 0 se tiver variações
      earns_loyalty_points: earnsLoyalty,
      loyalty_points_value: loyaltyValue,
      has_variations: newProductHasVariations, // Salvar has_variations
      can_be_redeemed_with_points: newProductCanBeRedeemed,
      redemption_points_cost: newProductCanBeRedeemed ? redemptionCost : 0,
      cost_price: parseFloat(newProductCostPrice),
      is_perishable: newProductIsPerishable,
      is_packaging: newProductIsPackaging,
    }).select().single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar produto",
        description: error.message,
      });
      return;
    }

    // Se for embalagem, salvar os vínculos
    if (newProductIsPackaging && newProductPackagingLinks.length > 0 && productData) {
      const linksToInsert = newProductPackagingLinks
        .filter(link => link.productId && link.quantity > 0)
        .map(link => ({
          packaging_id: productData.id,
          product_id: link.productId,
          quantity: link.quantity,
          store_id: profile.store_id,
        }));

      if (linksToInsert.length > 0) {
        const { error: linkError } = await supabase
          .from("product_packaging_links")
          .insert(linksToInsert);

        if (linkError) {
          toast({
            variant: "destructive",
            title: "Erro ao vincular embalagens",
            description: linkError.message,
          });
          return;
        }
      }
    }

    toast({
      title: "Produto adicionado com sucesso!",
    });
    setNewProductName("");
    setNewProductPrice("");
    setNewProductImageUrl("");
    setNewProductCategoryId("");
    setNewProductLoyaltyPointsValue("0.0");
    setNewProductHasVariations(false);
    setNewProductStockQuantity("0");
    setNewProductCanBeRedeemed(false);
    setNewProductRedemptionCost("0");
    setNewProductCostPrice("0.00");
    setNewProductIsPerishable(false);
    setNewProductIsPackaging(false);
    setNewProductPackagingLinks([]);
    loadProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto? Todos os itens de pedido e variações associadas a ele também serão excluídos.")) return;

    try {
      // 1. Excluir variações do produto (se houver)
      const { error: deleteVariationsError } = await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", id);

      if (deleteVariationsError) {
        throw new Error(`Erro ao excluir variações: ${deleteVariationsError.message}`);
      }

      // 2. Excluir itens de pedido que referenciam este produto
      const { error: deleteOrderItemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("product_id", id);

      if (deleteOrderItemsError) {
        throw new Error(`Erro ao excluir itens de pedido: ${deleteOrderItemsError.message}`);
      }

      // 3. Excluir o produto
      const { error: deleteProductError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (deleteProductError) {
        throw new Error(`Erro ao excluir produto: ${deleteProductError.message}`);
      }

      toast({
        title: "Produto excluído com sucesso!",
        description: "Itens de pedido e variações associadas também foram removidos.",
      });
      loadProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir produto",
        description: error.message,
      });
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.store_id) return;

    if (editingCategory) {
      // Update existing category
      const { error } = await supabase
        .from("categories")
        .update({ name: categoryName })
        .eq("id", editingCategory.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao renomear categoria",
          description: error.message,
        });
      } else {
        toast({
          title: "Categoria renomeada com sucesso!",
        });
        setShowCategoryDialog(false);
        setCategoryName("");
        setEditingCategory(null);
        loadCategories();
      }
    } else {
      // Create new category
      const { error } = await supabase
        .from("categories")
        .insert({
          store_id: profile.store_id,
          name: categoryName,
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao criar categoria",
          description: error.message,
        });
      } else {
        toast({
          title: "Categoria criada com sucesso!",
        });
        setShowCategoryDialog(false);
        setCategoryName("");
        loadCategories();
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza? Os produtos desta categoria ficarão sem categoria.")) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir categoria",
        description: error.message,
      });
    } else {
      toast({
        title: "Categoria excluída com sucesso!",
      });
      loadCategories();
    }
  };

  const openEditProductDialog = (product: Product) => {
    setEditingProduct(product);
    setEditProductName(product.name);
    setEditProductPrice(product.price.toString());
    setEditProductImageUrl(product.image_url || "");
    setEditProductCategoryId(product.category_id || "none");
    setEditProductLoyaltyPointsValue(product.loyalty_points_value.toString());
    setEditProductHasVariations(product.has_variations);
    setEditProductStockQuantity(product.stock_quantity.toString());
    setEditProductCanBeRedeemed(product.can_be_redeemed_with_points);
    setEditProductRedemptionCost(product.redemption_points_cost.toString());
    setEditProductCostPrice(product.cost_price.toString());
    setEditProductIsPerishable(product.is_perishable);
    
    // NOVO: Carregar e preencher dados do fornecedor
    if (product.supplier_product_id) {
      // Find the supplier product to get its supplier_id
      supabase.from("supplier_products")
        .select("id, supplier_id, cost_price")
        .eq("id", product.supplier_product_id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching supplier product for editing:", error.message);
            setSelectedSupplierIdForProduct(null);
            setSelectedSupplierProductId(null);
          } else if (data) {
            setSelectedSupplierIdForProduct(data.supplier_id);
            setSelectedSupplierProductId(data.id);
            setEditProductCostPrice(data.cost_price?.toFixed(2) || "0.00");
          }
        });
    } else {
      setSelectedSupplierIdForProduct(null);
      setSelectedSupplierProductId(null);
    }

    setShowEditProductDialog(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const loyaltyValue = parseFloat(editProductLoyaltyPointsValue);
    const earnsLoyalty = loyaltyValue > 0;
    const redemptionCost = parseFloat(editProductRedemptionCost);

    const { error } = await supabase
      .from("products")
      .update({
        name: editProductName,
        price: editProductHasVariations ? 0 : parseFloat(editProductPrice),
        image_url: editProductImageUrl || null,
        category_id: editProductCategoryId && editProductCategoryId !== "none" ? editProductCategoryId : null,
        earns_loyalty_points: earnsLoyalty,
        loyalty_points_value: loyaltyValue,
        has_variations: editProductHasVariations,
        stock_quantity: editProductHasVariations ? 0 : parseInt(editProductStockQuantity || "0"),
        can_be_redeemed_with_points: editProductCanBeRedeemed,
        redemption_points_cost: editProductCanBeRedeemed ? redemptionCost : 0,
        cost_price: parseFloat(editProductCostPrice),
        is_perishable: editProductIsPerishable,
        supplier_product_id: selectedSupplierProductId, // NOVO: Salvar o vínculo com o produto do fornecedor
      })
      .eq("id", editingProduct.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar produto",
        description: error.message,
      });
    } else {
      toast({
        title: "Produto atualizado com sucesso!",
      });
      setShowEditProductDialog(false);
      setEditingProduct(null);
      loadProducts();
    }
  };

  const openVariationsDialog = async (product: Product) => {
    setCurrentProductForVariations(product);
    await loadVariationsForProduct(product.id);
    await loadAllVariationsForComposite(); // Carregar todas as variações para o dropdown
    setShowVariationsDialog(true);
  };

  const handleAddVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProductForVariations) return;

    // Validação para item composto
    if (newVariationIsComposite && !newVariationRawMaterialId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione a matéria-prima para o item composto",
      });
      return;
    }

    const variationData = {
      product_id: currentProductForVariations.id,
      name: newVariationName,
      price_adjustment: parseFloat(newVariationPriceAdjustment),
      stock_quantity: parseInt(newVariationStockQuantity),
      is_composite: newVariationIsComposite,
      raw_material_product_id: newVariationIsComposite && newVariationRawMaterialType === 'product' ? newVariationRawMaterialId : null,
      raw_material_variation_id: newVariationIsComposite && newVariationRawMaterialType === 'variation' ? newVariationRawMaterialId : null,
      yield_quantity: newVariationIsComposite ? parseInt(newVariationYieldQuantity) : 1,
    };

    const { error } = await supabase.from("product_variations").insert(variationData);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar variação",
        description: error.message,
      });
    } else {
      toast({
        title: "Variação adicionada!",
      });
      setNewVariationName("");
      setNewVariationPriceAdjustment("0.0");
      setNewVariationStockQuantity("0");
      setNewVariationIsComposite(false);
      setNewVariationRawMaterialId("");
      setNewVariationRawMaterialType('product');
      setNewVariationYieldQuantity("1");
      loadVariationsForProduct(currentProductForVariations.id);
    }
  };

  const handleUpdateVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariation) return;

    // Validação para item composto
    if (newVariationIsComposite && !newVariationRawMaterialId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione a matéria-prima para o item composto",
      });
      return;
    }

    const variationData = {
      name: newVariationName,
      price_adjustment: parseFloat(newVariationPriceAdjustment),
      stock_quantity: parseInt(newVariationStockQuantity),
      is_composite: newVariationIsComposite,
      raw_material_product_id: newVariationIsComposite && newVariationRawMaterialType === 'product' ? newVariationRawMaterialId : null,
      raw_material_variation_id: newVariationIsComposite && newVariationRawMaterialType === 'variation' ? newVariationRawMaterialId : null,
      yield_quantity: newVariationIsComposite ? parseInt(newVariationYieldQuantity) : 1,
    };

    const { error } = await supabase
      .from("product_variations")
      .update(variationData)
      .eq("id", editingVariation.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar variação",
        description: error.message,
      });
    } else {
      toast({
        title: "Variação atualizada!",
      });
      setNewVariationName("");
      setNewVariationPriceAdjustment("0.0");
      setNewVariationStockQuantity("0");
      setNewVariationIsComposite(false);
      setNewVariationRawMaterialId("");
      setNewVariationRawMaterialType('product');
      setNewVariationYieldQuantity("1");
      setEditingVariation(null);
      loadVariationsForProduct(currentProductForVariations!.id);
    }
  };

  const handleDeleteVariation = async (variationId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta variação?")) return;

    const { error } = await supabase
      .from("product_variations")
      .delete()
      .eq("id", variationId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir variação",
        description: error.message,
      });
    } else {
      toast({
        title: "Variação excluída!",
      });
      loadVariationsForProduct(currentProductForVariations!.id);
    }
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Sem Categoria";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Sem Categoria";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
        <p className="text-muted-foreground">Gerencie os produtos da loja</p>
      </div>

      {/* Gerenciamento de Categorias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorias</CardTitle>
          <Dialog open={showCategoryDialog} onOpenChange={(open) => {
            setShowCategoryDialog(open);
            if (!open) {
              setEditingCategory(null);
              setCategoryName("");
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Renomear Categoria" : "Nova Categoria"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Nome da Categoria</Label>
                  <Input
                    id="categoryName"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Ex: Bebidas"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingCategory ? "Salvar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma categoria criada</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 bg-accent px-3 py-2 rounded-md"
                >
                  <span className="text-sm font-medium">{category.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setEditingCategory(category);
                      setCategoryName(category.name);
                      setShowCategoryDialog(true);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newProductName">Nome do Produto</Label>
                <Input
                  id="newProductName"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Ex: Frango com Recheio"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newProductPrice">Preço (R$)</Label>
                <Input
                  id="newProductPrice"
                  type="number"
                  step="0.01"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="25.90"
                  required
                  disabled={newProductHasVariations} // Desabilitar se tiver variações
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newProductCostPrice">Preço de Custo (R$)</Label>
                <Input
                  id="newProductCostPrice"
                  type="number"
                  step="0.01"
                  value={newProductCostPrice}
                  onChange={(e) => setNewProductCostPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newProductImage">URL da Imagem (opcional)</Label>
                <Input
                  id="newProductImage"
                  type="url"
                  value={newProductImageUrl}
                  onChange={(e) => setNewProductImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newProductCategory">Categoria</Label>
                <Select value={newProductCategoryId} onValueChange={setNewProductCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newProductLoyaltyPoints">Pontos de Fidelidade (Ganhos)</Label>
                <Input
                  id="newProductLoyaltyPoints"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProductLoyaltyPointsValue}
                  onChange={(e) => setNewProductLoyaltyPointsValue(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Valor em pontos que este produto concede ao cliente ao ser comprado.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newProductStockQuantity">Estoque Inicial</Label>
                <Input
                  id="newProductStockQuantity"
                  type="number"
                  min="0"
                  value={newProductStockQuantity}
                  onChange={(e) => setNewProductStockQuantity(e.target.value)}
                  placeholder="0"
                  required
                  disabled={newProductHasVariations} // Desabilitar se tiver variações
                />
                <p className="text-xs text-muted-foreground">
                  {newProductHasVariations ? "Estoque gerenciado por variações." : "Estoque do produto principal."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="newProductHasVariations"
                  checked={newProductHasVariations}
                  onCheckedChange={setNewProductHasVariations}
                />
                <Label htmlFor="newProductHasVariations">Possui Variações?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="newProductCanBeRedeemed"
                  checked={newProductCanBeRedeemed}
                  onCheckedChange={setNewProductCanBeRedeemed}
                />
                <Label htmlFor="newProductCanBeRedeemed">Pode ser resgatado com pontos?</Label>
              </div>
            </div>
            {newProductCanBeRedeemed && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="newProductRedemptionCost">Custo em Pontos para Resgate</Label>
                <Input
                  id="newProductRedemptionCost"
                  type="number"
                  step="1"
                  min="0"
                  value={newProductRedemptionCost}
                  onChange={(e) => setNewProductRedemptionCost(e.target.value)}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Quantos pontos o cliente precisa para resgatar este produto.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="newProductIsPerishable"
                  checked={newProductIsPerishable}
                  onCheckedChange={setNewProductIsPerishable}
                />
                <Label htmlFor="newProductIsPerishable">Produto Perecível?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="newProductIsPackaging"
                  checked={newProductIsPackaging}
                  onCheckedChange={setNewProductIsPackaging}
                />
                <Label htmlFor="newProductIsPackaging">É uma Embalagem?</Label>
              </div>
            </div>
            
            {newProductIsPackaging && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Produtos que usam esta embalagem</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setNewProductPackagingLinks([...newProductPackagingLinks, { productId: "", quantity: 1 }])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>
                
                {newProductPackagingLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum produto vinculado. Clique em "Adicionar Produto" para vincular.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {newProductPackagingLinks.map((link, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Produto</Label>
                          <Select
                            value={link.productId}
                            onValueChange={(value) => {
                              const updated = [...newProductPackagingLinks];
                              updated[index].productId = value;
                              setNewProductPackagingLinks(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.filter(p => !p.has_variations).map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-32 space-y-2">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={link.quantity}
                            onChange={(e) => {
                              const updated = [...newProductPackagingLinks];
                              updated[index].quantity = parseInt(e.target.value) || 1;
                              setNewProductPackagingLinks(updated);
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const updated = newProductPackagingLinks.filter((_, i) => i !== index);
                            setNewProductPackagingLinks(updated);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Configure quais produtos utilizam esta embalagem e quantas unidades são usadas por venda.
                </p>
              </div>
            )}
            
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum produto cadastrado
              </p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.has_variations ? "Com Variações" : `R$ ${product.price.toFixed(2)}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {getCategoryName(product.category_id)}
                        </p>
                        {product.earns_loyalty_points && (
                          <span className="flex items-center text-xs text-primary font-medium">
                            <Star className="h-3 w-3 mr-1" /> {product.loyalty_points_value.toFixed(2)} pts
                          </span>
                        )}
                        {product.can_be_redeemed_with_points && (
                          <span className="flex items-center text-xs text-purple-600 font-medium">
                            <Gift className="h-3 w-3 mr-1" /> {product.redemption_points_cost.toFixed(0)} pts (resgate)
                          </span>
                        )}
                        {product.is_perishable && (
                          <span className="flex items-center text-xs text-red-600 font-medium">
                            ⚠️ Perecível
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {product.has_variations && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openVariationsDialog(product)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditProductDialog(product)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProductDialog} onOpenChange={(open) => {
        setShowEditProductDialog(open);
        if (!open) {
          setEditingProduct(null);
          setSelectedSupplierIdForProduct(null); // Resetar estados do fornecedor
          setSelectedSupplierProductId(null);
        }
      }}>
        <DialogContent className="max-h-[99vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editProductName">Nome do Produto</Label>
                <Input
                  id="editProductName"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  placeholder="Ex: Frango com Recheio"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProductPrice">Preço (R$)</Label>
                <Input
                  id="editProductPrice"
                  type="number"
                  step="0.01"
                  value={editProductPrice}
                  onChange={(e) => setEditProductPrice(e.target.value)}
                  placeholder="25.90"
                  required
                  disabled={editProductHasVariations}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProductCostPrice">Preço de Custo (R$)</Label>
                <Input
                  id="editProductCostPrice"
                  type="number"
                  step="0.01"
                  value={editProductCostPrice}
                  onChange={(e) => setEditProductCostPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              {/* NOVO: Seletores de Fornecedor e Produto de Fornecedor */}
              <div className="space-y-2">
                <Label htmlFor="selectSupplier">Vincular a Fornecedor (Opcional)</Label>
                <Select
                  value={selectedSupplierIdForProduct || "none"}
                  onValueChange={(value) => setSelectedSupplierIdForProduct(value === "none" ? null : value)}
                >
                  <SelectTrigger id="selectSupplier">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum Fornecedor</SelectItem>
                    {availableSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.corporate_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedSupplierIdForProduct && (
                <div className="space-y-2">
                  <Label htmlFor="selectSupplierProduct">Produto do Fornecedor</Label>
                  <Select
                    value={selectedSupplierProductId || "none"}
                    onValueChange={(value) => setSelectedSupplierProductId(value === "none" ? null : value)}
                    disabled={!availableSupplierProducts.length}
                  >
                    <SelectTrigger id="selectSupplierProduct">
                      <SelectValue placeholder="Selecione um produto do fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum Produto</SelectItem>
                      {availableSupplierProducts.map(sp => (
                        <SelectItem key={sp.id} value={sp.id}>
                          {sp.products?.name} {sp.cost_price !== null ? `(Custo: R$ ${sp.cost_price.toFixed(2)})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!availableSupplierProducts.length && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum produto cadastrado para este fornecedor.
                    </p>
                  )}
                </div>
              )}
              {/* FIM NOVO */}
              <div className="space-y-2">
                <Label htmlFor="editProductImageUrl">URL da Imagem (opcional)</Label>
                <Input
                  id="editProductImageUrl"
                  type="url"
                  value={editProductImageUrl}
                  onChange={(e) => setEditProductImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProductCategory">Categoria</Label>
                <Select value={editProductCategoryId} onValueChange={setEditProductCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProductLoyaltyPoints">Pontos de Fidelidade (Ganhos)</Label>
                <Input
                  id="editProductLoyaltyPoints"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editProductLoyaltyPointsValue}
                  onChange={(e) => setEditProductLoyaltyPointsValue(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Valor em pontos que este produto concede ao cliente ao ser comprado.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editProductHasVariations"
                  checked={editProductHasVariations}
                  onCheckedChange={setEditProductHasVariations}
                />
                <Label htmlFor="editProductHasVariations">Possui Variações?</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProductStockQuantity">Estoque</Label>
                <Input
                  id="editProductStockQuantity"
                  type="number"
                  min="0"
                  value={editProductStockQuantity}
                  onChange={(e) => setEditProductStockQuantity(e.target.value)}
                  placeholder="0"
                  required
                  disabled={editProductHasVariations}
                />
                <p className="text-xs text-muted-foreground">
                  {editProductHasVariations ? "Estoque gerenciado por variações." : "Estoque do produto principal."}
                </p>
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editProductCanBeRedeemed"
                    checked={editProductCanBeRedeemed}
                    onCheckedChange={setEditProductCanBeRedeemed}
                  />
                  <Label htmlFor="editProductCanBeRedeemed">Pode ser resgatado com pontos?</Label>
                </div>
                {editProductCanBeRedeemed && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="editProductRedemptionCost">Custo em Pontos para Resgate</Label>
                    <Input
                      id="editProductRedemptionCost"
                      type="number"
                      step="1"
                      min="0"
                      value={editProductRedemptionCost}
                      onChange={(e) => setEditProductRedemptionCost(e.target.value)}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantos pontos o cliente precisa para resgatar este produto.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editProductIsPerishable"
                  checked={editProductIsPerishable}
                  onCheckedChange={setEditProductIsPerishable}
                />
                <Label htmlFor="editProductIsPerishable">Produto Perecível?</Label>
              </div>
              <Button type="submit" className="w-full">
                Salvar Alterações
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Variation Management Dialog */}
      <Dialog open={showVariationsDialog} onOpenChange={(open) => {
        setShowVariationsDialog(open);
        if (!open) {
          setCurrentProductForVariations(null);
          setEditingVariation(null);
          setNewVariationName("");
          setNewVariationPriceAdjustment("0.0");
          setNewVariationStockQuantity("0");
        }
      }}>
        <DialogContent className="max-h-[99vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Variações para "{currentProductForVariations?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-semibold">Variações Atuais</h3>
            {productVariations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma variação cadastrada.</p>
            ) : (
              <div className="space-y-2">
                {productVariations.map((variation) => (
                  <div key={variation.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{variation.name}</p>
                        {variation.is_composite && (
                          <Badge variant="secondary" className="text-xs">
                            Item Composto
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ajuste de Preço: R$ {variation.price_adjustment.toFixed(2)} | Estoque: {variation.stock_quantity}
                      </p>
                      {variation.is_composite && variation.raw_material_product_id && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          🔗 Matéria-prima: {products.find(p => p.id === variation.raw_material_product_id)?.name} 
                          {" "}→ Rende {variation.yield_quantity} unidades
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setEditingVariation(variation);
                          setNewVariationName(variation.name);
                          setNewVariationPriceAdjustment(variation.price_adjustment.toString());
                          setNewVariationStockQuantity(variation.stock_quantity.toString());
                          setNewVariationIsComposite(variation.is_composite || false);
                          
                          // Determinar tipo e ID da matéria-prima
                          if (variation.raw_material_variation_id) {
                            setNewVariationRawMaterialType('variation');
                            setNewVariationRawMaterialId(`var_${variation.raw_material_variation_id}`);
                          } else if (variation.raw_material_product_id) {
                            setNewVariationRawMaterialType('product');
                            setNewVariationRawMaterialId(variation.raw_material_product_id);
                          } else {
                            setNewVariationRawMaterialType('product');
                            setNewVariationRawMaterialId("");
                          }
                          
                          setNewVariationYieldQuantity((variation.yield_quantity || 1).toString());
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => handleDeleteVariation(variation.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-lg font-semibold mt-6">
              {editingVariation ? "Editar Variação" : "Adicionar Nova Variação"}
            </h3>
            <form onSubmit={editingVariation ? handleUpdateVariation : handleAddVariation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="variationName">Nome da Variação</Label>
                <Input
                  id="variationName"
                  value={newVariationName}
                  onChange={(e) => setNewVariationName(e.target.value)}
                  placeholder="Ex: Tamanho P, Sabor Chocolate"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variationPriceAdjustment">Ajuste de Preço (R$)</Label>
                <Input
                  id="variationPriceAdjustment"
                  type="number"
                  step="0.01"
                  value={newVariationPriceAdjustment}
                  onChange={(e) => setNewVariationPriceAdjustment(e.target.value)}
                  placeholder="0.00 (ex: -2.00 para desconto, 5.00 para acréscimo)"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Este valor será adicionado ao preço base do produto.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variationStockQuantity">Estoque da Variação</Label>
                <Input
                  id="variationStockQuantity"
                  type="number"
                  min="0"
                  value={newVariationStockQuantity}
                  onChange={(e) => setNewVariationStockQuantity(e.target.value)}
                  placeholder="0"
                  required
                  disabled={newVariationIsComposite}
                />
                {newVariationIsComposite && (
                  <p className="text-xs text-muted-foreground">
                    Itens compostos não precisam de estoque inicial.
                  </p>
                )}
              </div>

              {/* NOVO: Seção Item Composto */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="variationIsComposite"
                    checked={newVariationIsComposite}
                    onCheckedChange={setNewVariationIsComposite}
                  />
                  <Label htmlFor="variationIsComposite" className="cursor-pointer">
                    Este é um Item Composto?
                  </Label>
                </div>
                
                {newVariationIsComposite && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                        💡 O que é um Item Composto?
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        Um item derivado de outro produto. Exemplo: 1 Frango Assado Recheado gera 2 Meios Frangos Recheados.
                        Quando vendido, o sistema reduz automaticamente o estoque da matéria-prima.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="variationRawMaterial">
                        Matéria-Prima (Produto ou Variação) *
                      </Label>
                      <Select
                        value={newVariationRawMaterialId}
                        onValueChange={(value) => {
                          setNewVariationRawMaterialId(value);
                          // Determinar se é produto ou variação pelo prefixo
                          if (value.startsWith('var_')) {
                            setNewVariationRawMaterialType('variation');
                            setNewVariationRawMaterialId(value.replace('var_', ''));
                          } else {
                            setNewVariationRawMaterialType('product');
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a matéria-prima" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {/* Produtos sem variação */}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Produtos</div>
                          {products.filter(p => !p.has_variations && p.id !== currentProductForVariations?.id).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              📦 {product.name} (Estoque: {product.stock_quantity})
                            </SelectItem>
                          ))}
                          
                          {/* Variações de produtos */}
                          {allVariationsForComposite.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">Variações</div>
                              {allVariationsForComposite
                                .filter(v => v.id !== editingVariation?.id) // Não permitir selecionar a própria variação
                                .map((variation) => (
                                <SelectItem key={variation.id} value={`var_${variation.id}`}>
                                  🔸 {variation.product_name} - {variation.name} (Estoque: {variation.stock_quantity})
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Selecione qual produto ou variação será consumido ao vender esta variação.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="variationYieldQuantity">
                        Rendimento (Quantos itens gera?) *
                      </Label>
                      <Input
                        id="variationYieldQuantity"
                        type="number"
                        min="1"
                        value={newVariationYieldQuantity}
                        onChange={(e) => setNewVariationYieldQuantity(e.target.value)}
                        placeholder="2"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Quantas unidades desta variação são geradas a partir de 1 unidade da matéria-prima?
                      </p>
                    </div>

                    {newVariationRawMaterialId && newVariationYieldQuantity && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                          ✅ Exemplo de funcionamento:
                        </p>
                        <p className="text-xs text-green-800 dark:text-green-200">
                          Ao vender 1 unidade de "{newVariationName || 'esta variação'}", o sistema irá:
                        </p>
                        <ul className="text-xs text-green-800 dark:text-green-200 mt-2 space-y-1 list-disc list-inside">
                          <li>Reduzir 1 unidade de "{products.find(p => p.id === newVariationRawMaterialId)?.name}"</li>
                          <li>Gerar {newVariationYieldQuantity} unidades de "{newVariationName || 'esta variação'}"</li>
                          <li>Em caso de cancelamento, restaurar o estoque original</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* FIM: Seção Item Composto */}

              <div className="flex justify-end gap-2">
                {editingVariation && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingVariation(null);
                      setNewVariationName("");
                      setNewVariationPriceAdjustment("0.0");
                      setNewVariationStockQuantity("0");
                      setNewVariationIsComposite(false);
                      setNewVariationRawMaterialId("");
                      setNewVariationRawMaterialType('product');
                      setNewVariationYieldQuantity("1");
                    }}
                  >
                    Cancelar Edição
                  </Button>
                )}
                <Button type="submit">
                  {editingVariation ? "Salvar Variação" : "Adicionar Variação"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}