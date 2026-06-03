import { useState, useEffect } from "react";
import Header from "../components/Header";
import imgParasoesLogo from "../../imports/Group13/f6093fbbd983e79f9517960d323493d93d16f367.png";
import { Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

interface CustomMaterial {
  id: string;
  name: string;
  unit: string;
  current: number;
  min: number;
  lastUpdated: string;
}

export default function Parasoes() {
  const [stocks, setStocks] = useState({
    chocolateSoes: { current: 35, min: 25 },
    vanillaSoes: { current: 42, min: 25 },
    terigu: { current: 80, min: 40 },
    cream: { current: 55, min: 30 },
    bubukCoklat: { current: 45, min: 20 },
    vanillaExtract: { current: 38, min: 15 },
    telur: { current: 120, min: 50 },
    mentega: { current: 65, min: 30 },
  });

  const [customMaterials, setCustomMaterials] = useState<CustomMaterial[]>([]);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    unit: "",
    current: 0,
    min: 0,
  });

  // Load stocks from database on mount
  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      const { data, error } = await supabase
        .from("parasoes_stocks")
        .select("*");
      if (error) throw error;
      if (data && data.length > 0) {
        const dbStocks = data[0];
        setStocks({
          chocolateSoes: {
            current: dbStocks.chocolate_soes_current || 35,
            min: dbStocks.chocolate_soes_min || 25,
          },
          vanillaSoes: {
            current: dbStocks.vanilla_soes_current || 42,
            min: dbStocks.vanilla_soes_min || 25,
          },
          terigu: {
            current: dbStocks.terigu_current || 80,
            min: dbStocks.terigu_min || 40,
          },
          cream: {
            current: dbStocks.cream_current || 55,
            min: dbStocks.cream_min || 30,
          },
          bubukCoklat: {
            current: dbStocks.bubuk_coklat_current || 45,
            min: dbStocks.bubuk_coklat_min || 20,
          },
          vanillaExtract: {
            current: dbStocks.vanilla_extract_current || 38,
            min: dbStocks.vanilla_extract_min || 15,
          },
          telur: {
            current: dbStocks.telur_current || 120,
            min: dbStocks.telur_min || 50,
          },
          mentega: {
            current: dbStocks.mentega_current || 65,
            min: dbStocks.mentega_min || 30,
          },
        });
        if (dbStocks.custom_materials) {
          setCustomMaterials(dbStocks.custom_materials);
        }
      }
    } catch (error) {
      console.error("Error loading stocks:", error);
    }
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("parasoes_stocks").upsert({
        id: 1,
        chocolate_soes_current: stocks.chocolateSoes.current,
        chocolate_soes_min: stocks.chocolateSoes.min,
        vanilla_soes_current: stocks.vanillaSoes.current,
        vanilla_soes_min: stocks.vanillaSoes.min,
        terigu_current: stocks.terigu.current,
        terigu_min: stocks.terigu.min,
        cream_current: stocks.cream.current,
        cream_min: stocks.cream.min,
        bubuk_coklat_current: stocks.bubukCoklat.current,
        bubuk_coklat_min: stocks.bubukCoklat.min,
        vanilla_extract_current: stocks.vanillaExtract.current,
        vanilla_extract_min: stocks.vanillaExtract.min,
        telur_current: stocks.telur.current,
        telur_min: stocks.telur.min,
        mentega_current: stocks.mentega.current,
        mentega_min: stocks.mentega.min,
        custom_materials: customMaterials,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Perubahan berhasil disimpan!");
      setHasChanges(false);
    } catch (error) {
      toast.error("Gagal menyimpan perubahan");
      console.error("Error saving stocks:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStock = (key: keyof typeof stocks, delta: number) => {
    setStocks((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        current: Math.max(0, prev[key].current + delta),
      },
    }));
    setHasChanges(true);
  };

  const updateCustomMaterialStock = (id: string, delta: number) => {
    setCustomMaterials((prev) =>
      prev.map((material) =>
        material.id === id
          ? {
              ...material,
              current: Math.max(0, material.current + delta),
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : material,
      ),
    );
    setHasChanges(true);
  };

  const handleAddMaterial = () => {
    if (!newMaterial.name || !newMaterial.unit) {
      toast.error("Mohon isi nama bahan dan satuan!");
      return;
    }

    const material: CustomMaterial = {
      id: Date.now().toString(),
      name: newMaterial.name,
      unit: newMaterial.unit,
      current: newMaterial.current,
      min: newMaterial.min,
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    setCustomMaterials((prev) => [...prev, material]);
    toast.success("Bahan baru berhasil ditambahkan!");
    setIsAddMaterialModalOpen(false);
    setNewMaterial({ name: "", unit: "", current: 0, min: 0 });
  };

  const getProgressPercentage = (current: number, min: number) => {
    const total = min * 2;
    return Math.min((current / total) * 100, 100);
  };

  const totalProducts =
    stocks.chocolateSoes.current + stocks.vanillaSoes.current;
  const totalRawMaterials =
    stocks.terigu.current +
    stocks.cream.current +
    stocks.bubukCoklat.current +
    stocks.vanillaExtract.current +
    stocks.telur.current +
    stocks.mentega.current +
    customMaterials.reduce((sum, mat) => sum + mat.current, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Logo Header */}
        <div className="flex gap-3 items-center mb-8">
          <div className="bg-[#bae4f9] rounded-[10px] w-[186px] h-[56px] flex items-center justify-center">
            <img
              src={imgParasoesLogo}
              alt="Parasoes Logo"
              className="w-[361px] h-[120px] object-contain"
            />
          </div>
          <div>
            <h1
              className="text-[30px] font-semibold leading-[36px] text-[#101828]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Parasoes
            </h1>
            <p
              className="text-[16px] leading-[24px] text-[#4a5565]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Soes Cream Depok
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Total Produk */}
          <div
            className="border-[#0af] border-[1.6px] rounded-[10px] p-6"
            style={{
              backgroundImage:
                "linear-gradient(154.957deg, rgba(186, 228, 249, 0.82) 0%, rgba(82, 197, 255, 0.82) 100%)",
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
              Ready to serve
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
              Total stock units
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
              1.8M
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
            {/* Chocolate Soes */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Chocolate Soes
                </h3>
                <p
                  className="text-[14px] leading-[20px] text-[#6a7282]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Updated: 2026-04-27
                </p>
              </div>
              <div className="mb-3">
                <p
                  className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {stocks.chocolateSoes.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    pcs
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 25 pcs
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.chocolateSoes.current, stocks.chocolateSoes.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("chocolateSoes", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium leading-[20px] text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("chocolateSoes", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium leading-[20px]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Vanilla Soes */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Vanilla Soes
                </h3>
                <p
                  className="text-[14px] leading-[20px] text-[#6a7282]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Updated: 2026-04-27
                </p>
              </div>
              <div className="mb-3">
                <p
                  className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {stocks.vanillaSoes.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    pcs
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 25 pcs
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.vanillaSoes.current, stocks.vanillaSoes.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("vanillaSoes", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium leading-[20px] text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("vanillaSoes", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium leading-[20px]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>
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
              {hasChanges && (
                <button
                  onClick={saveChanges}
                  disabled={isSaving}
                  className="bg-[#22c55e] hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-[10px] flex items-center gap-2 text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              )}
              <button
                onClick={() => setIsAddMaterialModalOpen(true)}
                className="bg-[#101828] hover:bg-gray-900 text-white px-4 py-2 rounded-[10px] flex items-center gap-2 text-[14px] font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <Plus className="w-4 h-4" />
                Tambah Bahan Baru
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {/* Terigu */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Terigu
                </h3>
                <p
                  className="text-[14px] leading-[20px] text-[#6a7282]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Updated: 2026-04-27
                </p>
              </div>
              <div className="mb-3">
                <p
                  className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {stocks.terigu.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    pcs
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 40 pcs
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.terigu.current, stocks.terigu.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("terigu", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("terigu", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Cream */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Cream
                </h3>
                <p
                  className="text-[14px] leading-[20px] text-[#6a7282]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Updated: 2026-04-26
                </p>
              </div>
              <div className="mb-3">
                <p
                  className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {stocks.cream.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    kg
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 30 kg
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.cream.current, stocks.cream.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("cream", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("cream", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Bubuk Coklat */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Bubuk Coklat
                </h3>
                <p
                  className="text-[14px] leading-[20px] text-[#6a7282]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Updated: 2026-04-27
                </p>
              </div>
              <div className="mb-3">
                <p
                  className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {stocks.bubukCoklat.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    kg
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 20 kg
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.bubukCoklat.current, stocks.bubukCoklat.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("bubukCoklat", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("bubukCoklat", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Vanilla Extract */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Vanilla Extract
                </h3>
                <p
                  className="text-[14px] leading-[20px] text-[#6a7282]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Updated: 2026-04-26
                </p>
              </div>
              <div className="mb-3">
                <p
                  className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {stocks.vanillaExtract.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    bottles
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 15 bottles
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.vanillaExtract.current, stocks.vanillaExtract.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("vanillaExtract", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("vanillaExtract", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Telur */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Telur
                </h3>
                <p
                  className="text-[14px] leading-[20px] text-[#6a7282]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Updated: 2026-04-27
                </p>
              </div>
              <div className="mb-3">
                <p
                  className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {stocks.telur.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    pcs
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 50 pcs
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.telur.current, stocks.telur.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("telur", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("telur", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Mentega */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Mentega
                </h3>
                <p
                  className="text-[14px] leading-[20px] text-[#6a7282]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Updated: 2026-04-27
                </p>
              </div>
              <div className="mb-3">
                <p
                  className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {stocks.mentega.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    kg
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 30 kg
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.mentega.current, stocks.mentega.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("mentega", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("mentega", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Custom Materials */}
            {customMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5"
              >
                <div className="mb-3">
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
                    Updated: {material.lastUpdated}
                  </p>
                </div>
                <div className="mb-3">
                  <p
                    className="text-[30px] font-semibold leading-[36px] text-[#101828]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {material.current}{" "}
                    <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                      {material.unit}
                    </span>
                  </p>
                  <p
                    className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Min: {material.min} {material.unit}
                  </p>
                </div>
                <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                  <div
                    className="h-[8px] rounded-full bg-[#00c950]"
                    style={{
                      width: `${getProgressPercentage(material.current, material.min)}%`,
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateCustomMaterialStock(material.id, -1)}
                    className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    - Use
                  </button>
                  <button
                    onClick={() => updateCustomMaterialStock(material.id, 1)}
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

      {/* Add Material Modal */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  placeholder="Contoh: Susu Kental Manis"
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
                <input
                  type="text"
                  value={newMaterial.unit}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, unit: e.target.value })
                  }
                  placeholder="Contoh: botol, kg, liter"
                  className="w-full px-4 py-2 border border-[#d1d5dc] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
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
                  value={newMaterial.current}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      current: parseInt(e.target.value) || 0,
                    })
                  }
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
                  value={newMaterial.min}
                  onChange={(e) =>
                    setNewMaterial({
                      ...newMaterial,
                      min: parseInt(e.target.value) || 0,
                    })
                  }
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
    </div>
  );
}
