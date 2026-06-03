import { useState, useEffect } from "react";
import Header from "../components/Header";
import { Package, Plus, Edit, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  description: string;
}

interface RawMaterial {
  id: string;
  name: string;
  brand: string;
  unit: string;
  current_stock: number;
  min_stock: number;
}

interface RecipeIngredient {
  id: string;
  product_id: string;
  material_id: string;
  quantity_needed: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<RecipeIngredient[]>([]);
  const [recipeItems, setRecipeItems] = useState<{ material_id: string; quantity_needed: number }[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const [prodRes, matRes, recRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("raw_materials").select("*"),
        supabase.from("recipe_ingredients").select("*")
      ]);

      if (prodRes.error) throw prodRes.error;
      if (matRes.error) throw matRes.error;
      if (recRes.error) throw recRes.error;

      const rawMats = (matRes.data || []) as RawMaterial[];
      const recIngs = (recRes.data || []) as RecipeIngredient[];

      setRawMaterials(rawMats);
      setRecipes(recIngs);

      const prods = (prodRes.data || []) as Product[];
      const computedProducts = prods.map(product => {
        const prodRecipes = recIngs.filter(r => r.product_id === product.id);
        if (prodRecipes.length === 0) {
          return { ...product, stock: 0 };
        }
        const stocks = prodRecipes.map(r => {
          const mat = rawMats.find(m => m.id === r.material_id);
          if (!mat) return 0;
          return Math.floor(mat.current_stock / r.quantity_needed);
        });
        return { ...product, stock: Math.min(...stocks) };
      });

      setProducts(computedProducts);
    } catch (error: any) {
      toast.error("Gagal memuat data dari database");
      console.error("fetchProducts error:", error);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    brand: "Paradose",
    category: "coffee",
    price: 0,
    min_stock: 0,
    description: "",
  });

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      brand: "Paradose",
      category: "coffee",
      price: 0,
      min_stock: 0,
      description: "",
    });
    setRecipeItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      min_stock: product.min_stock,
      description: product.description,
    });

    // Load recipe items for this product
    const prodRecipes = recipes.filter(r => r.product_id === product.id);
    setRecipeItems(prodRecipes.map(r => ({
      material_id: r.material_id,
      quantity_needed: r.quantity_needed
    })));
    setIsModalOpen(true);
  };

  const handleBrandChange = (newBrand: string) => {
    setFormData((prev) => ({ ...prev, brand: newBrand }));
    // Filter out recipe items that are not of the selected brand or Shared
    setRecipeItems((prev) =>
      prev.filter((item) => {
        const mat = rawMaterials.find((m) => m.id === item.material_id);
        return !mat || mat.brand === newBrand || mat.brand === "Shared";
      }),
    );
  };

  const handleAddRecipeItem = () => {
    setRecipeItems(prev => [...prev, { material_id: "", quantity_needed: 0 }]);
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipeItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecipeItemChange = (index: number, field: 'material_id' | 'quantity_needed', value: any) => {
    setRecipeItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Nama produk tidak boleh kosong!");
      return;
    }

    if (
      formData.price === null ||
      formData.price === undefined ||
      formData.price < 0
    ) {
      toast.error("Harga harus berupa angka positif!");
      return;
    }

    if (
      formData.min_stock === null ||
      formData.min_stock === undefined ||
      formData.min_stock < 0
    ) {
      toast.error("Min stok harus berupa angka positif!");
      return;
    }

    // Check duplicate recipe items
    const selectedMaterials = recipeItems.map(item => item.material_id).filter(Boolean);
    const hasDuplicates = new Set(selectedMaterials).size !== selectedMaterials.length;
    if (hasDuplicates) {
      toast.error("Bahan baku tidak boleh duplikat dalam resep!");
      return;
    }

    // Calculate max stock based on selected recipe items and raw materials
    let calculatedStock = 0;
    if (recipeItems.length > 0) {
      const stocks = recipeItems.map(item => {
        if (!item.material_id) return 0;
        const mat = rawMaterials.find(m => m.id === item.material_id);
        return mat ? Math.floor(mat.current_stock / item.quantity_needed) : 0;
      });
      calculatedStock = Math.min(...stocks);
    }

    const productData = {
      name: formData.name,
      brand: formData.brand,
      category: formData.category,
      price: formData.price,
      stock: calculatedStock,
      min_stock: formData.min_stock,
      description: formData.description,
    };

    try {
      if (editingProduct) {
        // Update product
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        if (error) throw error;

        // Delete old recipe ingredients
        const { error: deleteError } = await supabase
          .from("recipe_ingredients")
          .delete()
          .eq("product_id", editingProduct.id);
        if (deleteError) throw deleteError;

        // Insert new recipe ingredients
        const validRecipeItems = recipeItems.filter(item => item.material_id && item.quantity_needed > 0);
        if (validRecipeItems.length > 0) {
          const inserts = validRecipeItems.map(item => ({
            product_id: editingProduct.id,
            material_id: item.material_id,
            quantity_needed: item.quantity_needed
          }));
          const { error: insertError } = await supabase
            .from("recipe_ingredients")
            .insert(inserts);
          if (insertError) throw insertError;
        }

        toast.success("Produk berhasil diperbarui!");
        setIsModalOpen(false);
        fetchProducts();
      } else {
        const newProductId = `p${Date.now()}`;
        const newProduct = {
          id: newProductId,
          ...productData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from("products").insert([newProduct]);
        if (error) throw error;

        const validRecipeItems = recipeItems.filter(item => item.material_id && item.quantity_needed > 0);
        if (validRecipeItems.length > 0) {
          const inserts = validRecipeItems.map(item => ({
            product_id: newProductId,
            material_id: item.material_id,
            quantity_needed: item.quantity_needed
          }));
          const { error: insertError } = await supabase
            .from("recipe_ingredients")
            .insert(inserts);
          if (insertError) throw insertError;
        }

        toast.success("Produk berhasil ditambahkan!");
        setIsModalOpen(false);
        fetchProducts();
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error("Gagal menyimpan produk: " + (error.message || error));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        toast.error("Gagal menghapus produk");
      } else {
        toast.success("Produk berhasil dihapus!");
        fetchProducts();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-8 h-8 text-purple-700" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">
                  Data Produk
                </h1>
                <p className="text-gray-600">
                  Kelola produk seperti tambah, edit, hapus, dan lihat
                </p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tambah Produk
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk berdasarkan nama atau brand..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Maks/Min Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${product.brand === "Paradose"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-orange-100 text-orange-800"
                          }`}
                      >
                        {product.brand}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      Rp {product.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {product.stock} / {product.min_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.stock <= product.min_stock ? (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <select
                    required
                    value={formData.brand}
                    onChange={(e) =>
                      handleBrandChange(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Paradose">Paradose</option>
                    <option value="Parasoes">Parasoes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="coffee">Coffee</option>
                    <option value="pastry">Pastry</option>
                    <option value="beverage">Beverage</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min. Stok *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.min_stock || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Recipe Ingredients Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Resep Produk (Bahan Baku)</h3>
                  <button
                    type="button"
                    onClick={handleAddRecipeItem}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Materials
                  </button>
                </div>

                {recipeItems.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Belum ada bahan baku yang ditambahkan ke resep.</p>
                ) : (
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                    {recipeItems.map((item, index) => {
                      const selectedMaterial = rawMaterials.find(m => m.id === item.material_id);
                      const filteredMaterials = rawMaterials.filter(
                        m => m.brand === formData.brand || m.brand === 'Shared'
                      );

                      return (
                        <div key={index} className="flex items-end gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 animate-fadeIn">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Bahan Baku *</label>
                            <select
                              required
                              value={item.material_id}
                              onChange={(e) => handleRecipeItemChange(index, 'material_id', e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                              <option value="">Pilih bahan baku...</option>
                              {filteredMaterials.map(mat => (
                                <option key={mat.id} value={mat.id}>{mat.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="w-28">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah *</label>
                            <input
                              type="number"
                              required
                              min="0.001"
                              step="any"
                              value={item.quantity_needed || ""}
                              onChange={(e) => handleRecipeItemChange(index, 'quantity_needed', parseFloat(e.target.value) || 0)}
                              placeholder="Jumlah"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div className="w-20">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Satuan</label>
                            <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 border border-gray-200 min-h-[38px] flex items-center justify-center font-medium">
                              {selectedMaterial?.unit || "-"}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-[2px]"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
