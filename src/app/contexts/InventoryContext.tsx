import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  stock: number;
}

export interface StockItem {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
}

export type Stocks = Record<string, StockItem>;

interface InventoryContextType {
  stocks: Stocks;
  products: Product[];
  updateStock: (id: string, delta: number) => Promise<void>;
  checkout: (items: any[], transactionData: any) => Promise<void>;
  isProductAvailable: (productId: string) => boolean;
  loading: boolean;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [stocks, setStocks] = useState<Stocks>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  // Fetch initial data from Supabase
  const fetchData = async () => {
    const [{ data: mats }, { data: prods }, { data: recs }] = await Promise.all([
      supabase.from('raw_materials').select('*'),
      supabase.from('products').select('*'),
      supabase.from('product_recipes').select('*'),
    ]);

    // Build stocks object
    const stocksObj: Stocks = {};
    mats?.forEach((mat: any) => {
      stocksObj[mat.id] = {
        id: mat.id,
        name: mat.name,
        current_stock: mat.current_stock,
        min_stock: mat.min_stock,
      };
    });
    setStocks(stocksObj);

    // Build recipes map: product_id -> { material_id: quantity_needed }
    const recObj: Record<string, Record<string, number>> = {};
    recs?.forEach((row: any) => {
      if (!recObj[row.product_id]) recObj[row.product_id] = {};
      recObj[row.product_id][row.material_id] = row.quantity_needed;
    });
    setRecipes(recObj);

    // Compute dynamic stock for each product based on recipes
    const computedProducts = prods?.map((product: any) => {
      const prodRecipe = recObj[product.id];
      if (!prodRecipe || Object.keys(prodRecipe).length === 0) {
        // If product corresponds to a raw material, use its current_stock
        const rawMaterialStock = stocksObj[product.id]?.current_stock;
        return { ...product, stock: rawMaterialStock !== undefined ? rawMaterialStock : product.stock } as Product;
      }
      const matStocks = Object.entries(prodRecipe).map(([matId, needed]) => {
        const available = stocksObj[matId]?.current_stock || 0;
        return Math.floor(available / needed);
      });
      return { ...product, stock: Math.min(...matStocks) } as Product;
    }) ?? [];
    setProducts(computedProducts);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update raw material stock and recompute product stocks
  const updateStock = async (id: string, delta: number) => {
    const current = stocks[id]?.current_stock || 0;
    const newStock = Math.max(0, current + delta);
    // Optimistic UI update
    setStocks(prev => ({
      ...prev,
      [id]: { ...prev[id], current_stock: newStock },
    }));
    await supabase
      .from('raw_materials')
      .update({ current_stock: newStock, last_updated: new Date().toISOString() })
      .eq('id', id);
    // Recompute product stocks after raw material change
    recomputeProducts();
  };

  // Helper to recompute product stocks based on current raw material stocks
  const recomputeProducts = () => {
    const computed = products.map(product => {
      const prodRecipe = recipes[product.id];
      if (!prodRecipe || Object.keys(prodRecipe).length === 0) {
        // Sync stock with raw material if applicable
        const rawMaterialStock = stocks[product.id]?.current_stock;
        return rawMaterialStock !== undefined ? { ...product, stock: rawMaterialStock } as Product : product;
      }
      const matStocks = Object.entries(prodRecipe).map(([matId, needed]) => {
        const available = stocks[matId]?.current_stock || 0;
        return Math.floor(available / needed);
      });
      return { ...product, stock: Math.min(...matStocks) } as Product;
    });
    setProducts(computed);
  };

  // Checkout handling – validates stock, records transaction, updates raw materials and product stocks
  const checkout = async (items: any[], transactionData: any) => {
    // Validate stock availability
    for (const item of items) {
      const prod = products.find(p => p.id === item.id);
      if (prod && item.quantity > (prod.stock ?? 0)) {
        alert(`Produk ${prod.name} tidak cukup stok. Transaksi dibatalkan.`);
        return;
      }
    }

    // Calculate deductions
    const matDeductions: Record<string, number> = {};
    const prodDeductions: Record<string, number> = {};
    items.forEach(item => {
      const prodRecipe = recipes[item.id];
      if (prodRecipe) {
        Object.entries(prodRecipe).forEach(([matId, qty]) => {
          matDeductions[matId] = (matDeductions[matId] || 0) + qty * item.quantity;
        });
      } else {
        prodDeductions[item.id] = (prodDeductions[item.id] || 0) + item.quantity;
      }
    });

    // Record transaction header
    await supabase.from('transactions').insert([
      {
        id: transactionData.id,
        customer_name: transactionData.customerName,
        subtotal: transactionData.subtotal,
        tax: transactionData.tax,
        total: transactionData.total,
        commission: transactionData.commission,
        net_total: transactionData.netTotal,
        payment_method: transactionData.paymentMethod,
        payment_method_label: transactionData.paymentMethodLabel,
        purchase_method: transactionData.purchaseMethod,
        purchase_method_label: transactionData.purchaseMethodLabel,
        online_platform: transactionData.onlinePlatform,
        offline_type: transactionData.offlineType,
        created_at: transactionData.date,
      },
    ]);

    // Record transaction items
    const txItems = items.map(item => ({
      transaction_id: transactionData.id,
      product_id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity,
    }));
    await supabase.from('transaction_items').insert(txItems);

    // Apply raw material deductions
    for (const [matId, deductQty] of Object.entries(matDeductions)) {
      const current = stocks[matId]?.current_stock || 0;
      const newStock = Math.max(0, current - deductQty);
      await supabase
        .from('raw_materials')
        .update({ current_stock: newStock })
        .eq('id', matId);
    }

    // Apply product deductions for items without recipes
    for (const [prodId, deductQty] of Object.entries(prodDeductions)) {
      const product = products.find(p => p.id === prodId);
      if (product) {
        const newStock = Math.max(0, (product.stock ?? 0) - deductQty);
        await supabase.from('products').update({ stock: newStock }).eq('id', prodId);
      }
    }

    // Recalculate dynamic product stocks after raw material updates
    for (const product of products) {
      const prodRecipe = recipes[product.id];
      if (prodRecipe) {
        const matStocks = Object.entries(prodRecipe).map(([matId, needed]) => {
          const available = Math.max(0, (stocks[matId]?.current_stock || 0) - (matDeductions[matId] || 0));
          return Math.floor(available / needed);
        });
        const newStock = Math.min(...matStocks);
        await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
      }
    }

    // Refresh data to reflect latest stocks and product availability
    await fetchData();
  };

  const isProductAvailable = (productId: string): boolean => {
    const prodRecipe = recipes[productId];
    if (!prodRecipe) {
      const product = products.find(p => p.id === productId);
      return product ? (product.stock ?? 0) > 0 : false;
    }
    // Ensure each required material has sufficient stock
    for (const [matId, needed] of Object.entries(prodRecipe)) {
      const available = stocks[matId]?.current_stock || 0;
      if (available < needed) return false;
    }
    return true;
  };

  const refreshInventory = async () => {
    await fetchData();
  };

  return (
    <InventoryContext.Provider
      value={{ stocks, products, updateStock, checkout, isProductAvailable, loading, refreshInventory }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
