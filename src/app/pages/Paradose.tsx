import { useState, useEffect } from "react";
import Header from "../components/Header";
import svgPaths from "../../imports/MainContent/svg-n0e2pi4v59";
import { AlertCircle, Plus, X, Save, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

interface RawMaterial {
  id: string;
  name: string;
  brand: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  last_updated: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface RecipeIngredient {
  id: string;
  product_id: string;
  material_id: string;
  quantity_needed: number;
}

export default function Paradose() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<RecipeIngredient[]>([]);
  const [editRecipeItems, setEditRecipeItems] = useState<{ material_id: string; quantity_needed: number }[]>([]);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemType, setEditingItemType] = useState<
    "product" | "material"
  >("material");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingItemName, setDeletingItemName] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    unit: "",
    current_stock: 0,
    min_stock: 0,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    unit: "",
    current_stock: 0,
    min_stock: 0,
  });

  // Track local changes for batch saving
  const [changedMaterialIds, setChangedMaterialIds] = useState<Set<string>>(
    new Set(),
  );
  const [changedProductIds, setChangedProductIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      // Load raw materials for Paradose brand
      const { data: materialsData, error: materialsError } = await supabase
        .from("raw_materials")
        .select("*")
        .eq("brand", "Paradose");
      if (materialsError) throw materialsError;
      if (materialsData) setRawMaterials(materialsData);

      // Load products for Paradose brand
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("brand", "Paradose");
      if (productsError) throw productsError;
      if (productsData) setProducts(productsData);

      // Load recipe ingredients
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipe_ingredients")
        .select("*");
      if (recipesError) throw recipesError;
      if (recipesData) setRecipes(recipesData);
    } catch (error) {
      console.error("Error loading stocks:", error);
    }
  };

  const getProductStock = (product: Product) => {
    const prodRecipes = recipes.filter(r => r.product_id === product.id);
    if (prodRecipes.length === 0) return product.stock;
    const stocks = prodRecipes.map(r => {
      const mat = rawMaterials.find(m => m.id === r.material_id);
      if (!mat) return 0;
      return Math.floor(mat.current_stock / r.quantity_needed);
    });
    return Math.min(...stocks);
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      // Save changed raw materials
      for (const material of rawMaterials) {
        if (changedMaterialIds.has(material.id)) {
          const { error } = await supabase
            .from("raw_materials")
            .update({
              name: material.name,
              unit: material.unit,
              current_stock: material.current_stock,
              min_stock: material.min_stock,
              last_updated: new Date().toISOString(),
            })
            .eq("id", material.id);
          if (error) throw error;
        }
      }

      // Save changed products
      for (const product of products) {
        if (changedProductIds.has(product.id)) {
          const { error } = await supabase
            .from("products")
            .update({
              stock: getProductStock(product),
              min_stock: product.min_stock,
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id);
          if (error) throw error;

          // Delete old recipe ingredients
          const { error: deleteError } = await supabase
            .from("recipe_ingredients")
            .delete()
            .eq("product_id", product.id);
          if (deleteError) throw deleteError;

          // Insert new recipe ingredients
          const prodRecipes = recipes.filter(r => r.product_id === product.id && r.material_id && r.quantity_needed > 0);
          if (prodRecipes.length > 0) {
            const inserts = prodRecipes.map(r => ({
              product_id: r.product_id,
              material_id: r.material_id,
              quantity_needed: r.quantity_needed
            }));
            const { error: insertError } = await supabase
              .from("recipe_ingredients")
              .insert(inserts);
            if (insertError) throw insertError;
          }
        }
      }

      toast.success("Perubahan berhasil disimpan!");
      setHasChanges(false);
      setChangedMaterialIds(new Set());
      setChangedProductIds(new Set());
    } catch (error) {
      toast.error("Gagal menyimpan perubahan");
      console.error("Error saving stocks:", error);
    } finally {
      setIsSaving(false);
    }
  };



  const updateMaterialStock = (id: string, delta: number) => {
    setRawMaterials((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
            ...m,
            current_stock: Math.max(0, m.current_stock + delta),
            last_updated: new Date().toISOString().split("T")[0],
          }
          : m,
      ),
    );
    setChangedMaterialIds((prev) => new Set(prev).add(id));
    setHasChanges(true);
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !newMaterial.unit) {
      toast.error("Mohon isi nama bahan dan satuan!");
      return;
    }

    const id =
      newMaterial.name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();

    try {
      const { data, error } = await supabase
        .from("raw_materials")
        .insert({
          id,
          name: newMaterial.name,
          brand: "Paradose",
          unit: newMaterial.unit,
          current_stock: newMaterial.current_stock,
          min_stock: newMaterial.min_stock,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setRawMaterials((prev) => [...prev, data]);
      toast.success("Bahan baru berhasil ditambahkan!");
      setIsAddMaterialModalOpen(false);
      setNewMaterial({ name: "", unit: "", current_stock: 0, min_stock: 0 });
    } catch (error) {
      toast.error("Gagal menambahkan bahan baru");
      console.error("Error adding material:", error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingItemId(product.id);
    setEditingItemType("product");
    setEditForm({
      name: product.name,
      unit: getProductUnit(product.category),
      current_stock: product.stock,
      min_stock: product.min_stock,
    });
    // Load recipe items for this product
    const prodRecipes = recipes.filter(r => r.product_id === product.id);
    setEditRecipeItems(prodRecipes.map(r => ({
      material_id: r.material_id,
      quantity_needed: r.quantity_needed
    })));
    setIsEditModalOpen(true);
  };

  const handleEditMaterial = (material: RawMaterial) => {
    setEditingItemId(material.id);
    setEditingItemType("material");
    setEditForm({
      name: material.name,
      unit: material.unit,
      current_stock: material.current_stock,
      min_stock: material.min_stock,
    });
    setEditRecipeItems([]);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;

    if (editingItemType === "product") {
      // Check duplicate recipe items
      const selectedMaterials = editRecipeItems.map(item => item.material_id).filter(Boolean);
      const hasDuplicates = new Set(selectedMaterials).size !== selectedMaterials.length;
      if (hasDuplicates) {
        toast.error("Bahan baku tidak boleh duplikat dalam resep!");
        return;
      }

      // Update recipes state locally
      const otherRecipes = recipes.filter(r => r.product_id !== editingItemId);
      const newRecipes = editRecipeItems
        .filter(item => item.material_id && item.quantity_needed > 0)
        .map((item, index) => ({
          id: `temp_${index}_${Date.now()}`,
          product_id: editingItemId,
          material_id: item.material_id,
          quantity_needed: item.quantity_needed
        }));
      setRecipes([...otherRecipes, ...newRecipes]);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingItemId
            ? {
              ...p,
              min_stock: editForm.min_stock,
            }
            : p,
        ),
      );
      setChangedProductIds((prev) => new Set(prev).add(editingItemId));
    } else {
      if (!editForm.name || !editForm.unit) {
        toast.error("Mohon isi nama bahan dan satuan!");
        return;
      }
      setRawMaterials((prev) =>
        prev.map((m) =>
          m.id === editingItemId
            ? {
              ...m,
              name: editForm.name,
              unit: editForm.unit,
              current_stock: editForm.current_stock,
              min_stock: editForm.min_stock,
              last_updated: new Date().toISOString().split("T")[0],
            }
            : m,
        ),
      );
      setChangedMaterialIds((prev) => new Set(prev).add(editingItemId));
    }

    setHasChanges(true);
    toast.success("Stok berhasil diupdate!");
    setIsEditModalOpen(false);
    setEditingItemId(null);
  };

  const confirmDeleteMaterial = (id: string, name: string) => {
    setDeletingItemId(id);
    setDeletingItemName(name);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from("raw_materials")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setRawMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success("Bahan berhasil dihapus!");
      setIsDeleteModalOpen(false);
      setDeletingItemId(null);
      setDeletingItemName("");
    } catch (error) {
      toast.error("Gagal menghapus bahan");
      console.error("Error deleting material:", error);
    }
  };

  const getProgressColor = (current: number, min: number) => {
    if (current <= min) return "#fb2c36";
    return "#00c950";
  };

  const getProgressPercentage = (current: number, min: number) => {
    const total = min * 2;
    return Math.min((current / total) * 100, 100);
  };

  const getProductUnit = (category: string) => {
    switch (category) {
      case "coffee":
        return "cups";
      default:
        return "pcs";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().split("T")[0];
    } catch {
      return dateStr;
    }
  };

  const totalProducts = products.reduce((sum, p) => sum + getProductStock(p), 0);
  const totalRawMaterials = rawMaterials.reduce(
    (sum, m) => sum + m.current_stock,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Logo Header */}
        <div className="flex gap-3 items-center mb-8">
          <div className="bg-[#fef3c6] rounded-[10px] p-2 w-[137px] h-[56px] flex items-center justify-center">
            <svg
              className="w-[89px] h-[33px]"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 89 33"
            >
              <g>
                <path d={svgPaths.pa2f8380} fill="#E53935" />
                <path d={svgPaths.padd6d00} fill="#E53935" />
                <path d={svgPaths.p83b6d30} fill="#E53935" />
                <path d={svgPaths.p27f44500} fill="#E53935" />
                <path d={svgPaths.p3f838840} fill="#E53935" />
                <path d={svgPaths.p750a400} fill="#E53935" />
                <path d={svgPaths.p11084b80} fill="#E53935" />
                <path d={svgPaths.p12811980} fill="#E53935" />
                <path d={svgPaths.p32429500} fill="#E53935" />
                <path d={svgPaths.p2ff42880} fill="#E53935" />
              </g>
            </svg>
          </div>
          <div>
            <h1
              className="text-[30px] font-semibold leading-[36px] text-[#101828]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Paradose Coffee
            </h1>
            <p
              className="text-[16px] leading-[24px] text-[#4a5565]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Your Daily Dose Of Paradise
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Total Produk */}
          <div
            className="border-[#fee685] border-[1.6px] rounded-[10px] p-6"
            style={{
              backgroundImage:
                "linear-gradient(154.957deg, rgb(255, 251, 235) 0%, rgb(254, 243, 198) 100%)",
            }}
          >
            <h3
              className="text-[18px] font-semibold leading-[27px] text-[#101828] mb-3"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Total Produk
            </h3>
            <p
              className="text-[36px] font-semibold leading-[40px] text-[#101828] mb-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {totalProducts}
            </p>
            <p
              className="text-[16px] leading-[24px] text-[#4a5565]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Siap Untuk Dijual
            </p>
          </div>

          {/* Stok Bahan */}
          <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-6">
            <h3
              className="text-[18px] font-semibold leading-[27px] text-[#101828] mb-3"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Stok Bahan
            </h3>
            <p
              className="text-[36px] font-semibold leading-[40px] text-[#101828] mb-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {totalRawMaterials}
            </p>
            <p
              className="text-[16px] leading-[24px] text-[#4a5565]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Stok Bahan Tersedia
            </p>
          </div>

          {/* Perkiraan Keuntungan */}
          <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-6">
            <h3
              className="text-[18px] font-semibold leading-[27px] text-[#101828] mb-3"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Perkiraan Keuntungan
            </h3>
            <p
              className="text-[36px] font-semibold leading-[40px] text-[#101828] mb-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              420K
            </p>
            <p
              className="text-[16px] leading-[24px] text-[#4a5565]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Rupiah
            </p>
          </div>
        </div>

        {/* Stok Produk */}
        <div className="mb-8">
          <h2
            className="text-[20px] font-semibold leading-[28px] text-[#101828] mb-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Stok Produk
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {products.map((product) => {
              const unit = getProductUnit(product.category);
              const computedStock = getProductStock(product);
              return (
                <div
                  key={product.id}
                  className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5 relative"
                >
                  {/* Edit Button */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-[8px] transition"
                      title="Edit produk"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3
                        className="text-[18px] font-medium leading-[27px] text-[#101828]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {product.name}
                      </h3>
                      <p
                        className="text-[14px] leading-[20px] text-[#6a7282]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Updated: {formatDate(product.updated_at)}
                      </p>
                    </div>
                    {computedStock <= product.min_stock && (
                      <div className="bg-[#fef2f2] rounded-[4px] px-2 py-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-[#e7000b]" />
                        <span
                          className="text-[12px] font-medium leading-[16px] text-[#e7000b]"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Hampir Habis
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <p
                      className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {computedStock}{" "}
                      <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                        {unit}
                      </span>
                    </p>
                    <p
                      className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Min: {product.min_stock} {unit}
                    </p>
                  </div>
                  <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                    <div
                      className="h-[8px] rounded-full"
                      style={{
                        width: `${getProgressPercentage(computedStock, product.min_stock)}%`,
                        backgroundColor: getProgressColor(
                          computedStock,
                          product.min_stock,
                        ),
                      }}
                    />
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Stok Bahan */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-[20px] font-semibold leading-[28px] text-[#101828]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Stok Bahan
            </h2>
            <div className="flex gap-3">
              <button
                onClick={saveChanges}
                disabled={isSaving || !hasChanges}
                className="bg-[#22c55e] hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-[10px] flex items-center gap-2 text-[14px] font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>

              <button
                onClick={() => setIsAddMaterialModalOpen(true)}
                className="bg-[#e17100] hover:bg-[#f54900] text-white px-4 py-2 rounded-[10px] flex items-center gap-2 text-[14px] font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Plus className="w-4 h-4" />
                Tambah Bahan Baru
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {rawMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5 relative"
              >
                {/* Edit and Delete Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleEditMaterial(material)}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-[8px] transition"
                    title="Edit bahan"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmDeleteMaterial(material.id, material.name)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-[8px] transition"
                    title="Hapus bahan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-3 pr-24">
                  <h3
                    className="text-[18px] font-medium leading-[27px] text-[#101828]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {material.name}
                  </h3>
                  <p
                    className="text-[14px] leading-[20px] text-[#6a7282]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Updated: {formatDate(material.last_updated)}
                  </p>
                </div>
                <div className="mb-3">
                  <p
                    className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {material.current_stock}{" "}
                    <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                      {material.unit}
                    </span>
                  </p>
                  <p
                    className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Min: {material.min_stock} {material.unit}
                  </p>
                </div>
                <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                  <div
                    className="h-[8px] rounded-full"
                    style={{
                      width: `${getProgressPercentage(material.current_stock, material.min_stock)}%`,
                      backgroundColor: getProgressColor(
                        material.current_stock,
                        material.min_stock,
                      ),
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMaterialStock(material.id, -1)}
                    className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    - Use
                  </button>
                  <button
                    onClick={() => updateMaterialStock(material.id, 1)}
                    className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    + Restock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[10px] max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
              <h2
                className="text-[20px] font-semibold text-[#101828]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {editingItemType === "product" ? "Edit Produk" : "Edit Bahan"}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label
                  className="block text-[14px] font-medium text-[#364153] mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Nama {editingItemType === "product" ? "Produk" : "Bahan"}
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Contoh: Sirup Vanilla"
                  className="w-full px-4 py-2 border border-[#d1d5dc] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  disabled={editingItemType === "product"}
                />
              </div>

              {editingItemType === "material" && (
                <div>
                  <label
                    className="block text-[14px] font-medium text-[#364153] mb-2"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Satuan
                  </label>
                  <select
                    value={editForm.unit}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        unit: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-[#d1d5dc] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#101828]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <option value="">Pilih satuan...</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="botol">botol</option>
                    <option value="bungkus">bungkus</option>
                    <option value="pcs">pcs</option>
                    <option value="gram">gram</option>
                    <option value="ml">ml</option>
                    <option value="Karton">Karton</option>
                    <option value="bottles">bottles</option>
                  </select>
                </div>
              )}

              {editingItemType === "material" && (
                <div>
                  <label
                    className="block text-[14px] font-medium text-[#364153] mb-2"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Stok Saat Ini
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      editForm.current_stock === 0 ? "" : editForm.current_stock
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        current_stock:
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 border border-[#d1d5dc] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#101828]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </div>
              )}

              <div>
                <label
                  className="block text-[14px] font-medium text-[#364153] mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Stok Minimum
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.min_stock === 0 ? "" : editForm.min_stock}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      min_stock:
                        e.target.value === ""
                          ? 0
                          : parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full px-4 py-2 border border-[#d1d5dc] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>

              {editingItemType === "product" && (
                <div className="border-t border-[#e5e7eb] pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[16px] font-semibold text-[#101828]" style={{ fontFamily: "Inter, sans-serif" }}>
                      Resep Produk (Bahan Baku)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditRecipeItems(prev => [...prev, { material_id: "", quantity_needed: 0 }])}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold flex items-center gap-1 transition"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Materials
                    </button>
                  </div>
                  
                  {editRecipeItems.length === 0 ? (
                    <p className="text-[13px] text-gray-500 italic" style={{ fontFamily: "Inter, sans-serif" }}>
                      Belum ada bahan baku yang ditambahkan ke resep.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                      {editRecipeItems.map((item, index) => {
                        const selectedMaterial = rawMaterials.find(m => m.id === item.material_id);
                        const filteredMaterials = rawMaterials.filter(
                          m => m.brand === "Paradose" || m.brand === "Shared"
                        );
                        
                        return (
                          <div key={index} className="flex items-end gap-3 bg-gray-50 p-3 rounded-[8px] border border-gray-200">
                            <div className="flex-1">
                              <label className="block text-[11px] font-medium text-gray-500 mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                Bahan Baku *
                              </label>
                              <select
                                required
                                value={item.material_id}
                                onChange={(e) => setEditRecipeItems(prev => prev.map((it, i) => i === index ? { ...it, material_id: e.target.value } : it))}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                <option value="">Pilih bahan...</option>
                                {filteredMaterials.map(mat => (
                                  <option key={mat.id} value={mat.id}>{mat.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="w-24">
                              <label className="block text-[11px] font-medium text-gray-500 mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                Jumlah *
                              </label>
                              <input
                                type="number"
                                required
                                min="0.001"
                                step="any"
                                value={item.quantity_needed || ""}
                                onChange={(e) => setEditRecipeItems(prev => prev.map((it, i) => i === index ? { ...it, quantity_needed: parseFloat(e.target.value) || 0 } : it))}
                                placeholder="Jumlah"
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              />
                            </div>
                            
                            <div className="w-16">
                              <label className="block text-[11px] font-medium text-gray-500 mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                Satuan
                              </label>
                              <div className="px-2 py-1.5 bg-gray-100 rounded-[8px] text-[12px] text-gray-700 border border-gray-200 min-h-[38px] flex items-center justify-center font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                                {selectedMaterial?.unit || "-"}
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setEditRecipeItems(prev => prev.filter((_, i) => i !== index))}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-[8px] transition-colors mb-[2px]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-[#e5e7eb]">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2 border border-[#d1d5dc] text-[#101828] rounded-[10px] font-medium hover:bg-gray-50"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-[#101828] text-white rounded-[10px] font-medium hover:bg-gray-900"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[10px] max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
              <h2
                className="text-[20px] font-semibold text-[#101828]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Tambah Bahan Baru
              </h2>
              <button
                onClick={() => setIsAddMaterialModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label
                  className="block text-[14px] font-medium text-[#364153] mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Nama Bahan
                </label>
                <input
                  type="text"
                  value={newMaterial.name}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, name: e.target.value })
                  }
                  placeholder="Contoh: Sirup Vanilla"
                  className="w-full px-4 py-2 border border-[#d1d5dc] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>

              <div>
                <label
                  className="block text-[14px] font-medium text-[#364153] mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Satuan
                </label>
                <select
                  value={newMaterial.unit}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, unit: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#d1d5dc] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <option value="">Pilih satuan...</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                  <option value="botol">botol</option>
                  <option value="bungkus">bungkus</option>
                  <option value="pcs">pcs</option>
                  <option value="gram">gram</option>
                  <option value="ml">ml</option>
                  <option value="Karton">Karton</option>
                  <option value="bottles">bottles</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-[14px] font-medium text-[#364153] mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Stok Saat Ini
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    newMaterial.current_stock === 0
                      ? ""
                      : newMaterial.current_stock
                  }
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      current_stock:
                        e.target.value === ""
                          ? 0
                          : parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full px-4 py-2 border border-[#d1d5dc] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>

              <div>
                <label
                  className="block text-[14px] font-medium text-[#364153] mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Stok Minimum
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    newMaterial.min_stock === 0 ? "" : newMaterial.min_stock
                  }
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      min_stock:
                        e.target.value === ""
                          ? 0
                          : parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full px-4 py-2 border border-[#d1d5dc] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-[#d1d5dc] text-gray-700 rounded-[10px] hover:bg-gray-50"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Batal
                </button>
                <button
                  onClick={handleAddMaterial}
                  className="flex-1 px-4 py-2 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Tambah Bahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[10px] max-w-md w-full p-6">
            <h2
              className="text-[20px] font-semibold text-[#101828] mb-4"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Konfirmasi Hapus
            </h2>
            <p
              className="text-[16px] text-gray-600 mb-6"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Are you sure want delete {deletingItemName}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingItemId(null);
                  setDeletingItemName("");
                }}
                className="flex-1 px-4 py-2 border border-[#d1d5dc] text-gray-700 rounded-[10px] hover:bg-gray-50 font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Batal
              </button>
              <button
                onClick={() => deletingItemId && handleDeleteMaterial(deletingItemId)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[10px] font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
