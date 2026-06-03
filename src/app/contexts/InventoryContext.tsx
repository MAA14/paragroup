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
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [stocks, setStocks] = useState<Stocks>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    const [prodRes, matRes, recRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('raw_materials').select('*'),
      supabase.from('recipe_ingredients').select('*')
    ]);

    if (prodRes.data) setProducts(prodRes.data as Product[]);

    if (matRes.data) {
      const stocksObj: Stocks = {};
      matRes.data.forEach((mat: any) => {
        stocksObj[mat.id] = { id: mat.id, name: mat.name, current_stock: mat.current_stock, min_stock: mat.min_stock };
      });
      setStocks(stocksObj);
    }

    if (recRes.data) {
      const recObj: Record<string, Record<string, number>> = {};
      recRes.data.forEach((row: any) => {
        if (!recObj[row.product_id]) recObj[row.product_id] = {};
        recObj[row.product_id][row.material_id] = row.quantity_needed;
      });
      setRecipes(recObj);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStock = async (id: string, delta: number) => {
    const current = stocks[id]?.current_stock || 0;
    const newStock = Math.max(0, current + delta);
    
    // Optimistic update
    setStocks(prev => ({
      ...prev,
      [id]: { ...prev[id], current_stock: newStock }
    }));

    await supabase.from('raw_materials')
      .update({ current_stock: newStock, last_updated: new Date().toISOString() })
      .eq('id', id);
  };

  const checkout = async (items: any[], transactionData: any) => {
    const matDeductions: Record<string, number> = {};
    const prodDeductions: Record<string, number> = {};

    items.forEach(item => {
      const prodRecipe = recipes[item.id];
      if (prodRecipe) {
        Object.entries(prodRecipe).forEach(([matId, qty]) => {
          matDeductions[matId] = (matDeductions[matId] || 0) + (qty * item.quantity);
        });
      } else {
        prodDeductions[item.id] = (prodDeductions[item.id] || 0) + item.quantity;
      }
    });

    await supabase.from('transactions').insert([{
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
    }]);

    const txItems = items.map(item => ({
      transaction_id: transactionData.id,
      product_id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity
    }));
    await supabase.from('transaction_items').insert(txItems);

    for (const [matId, deductQty] of Object.entries(matDeductions)) {
      const current = stocks[matId]?.current_stock || 0;
      await supabase.from('raw_materials').update({ current_stock: Math.max(0, current - deductQty) }).eq('id', matId);
    }
    
    for (const [prodId, deductQty] of Object.entries(prodDeductions)) {
      const product = products.find(p => p.id === prodId);
      if (product) {
        await supabase.from('products').update({ stock: Math.max(0, product.stock - deductQty) }).eq('id', prodId);
      }
    }

    fetchData();
  };

  const isProductAvailable = (productId: string): boolean => {
    const prodRecipe = recipes[productId];
    if (!prodRecipe) {
        const product = products.find(p => p.id === productId);
        return product ? product.stock > 0 : false;
    }

    for (const [matId, needed] of Object.entries(prodRecipe)) {
      const available = stocks[matId]?.current_stock || 0;
      if (available < needed) return false;
    }
    return true;
  };

  return (
    <InventoryContext.Provider value={{ stocks, products, updateStock, checkout, isProductAvailable, loading }}>
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
