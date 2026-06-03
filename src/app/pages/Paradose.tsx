import { useState, useEffect } from "react";
import Header from "../components/Header";
import svgPaths from "../../imports/MainContent/svg-n0e2pi4v59";
import { AlertCircle, Plus, X, Save } from "lucide-react";
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

export default function Paradose() {
  const [stocks, setStocks] = useState({
    goldenBrew: { current: 12, min: 10 },
    berrycano: { current: 7, min: 10 },
    bijiKopiBlend: { current: 9, min: 8 },
    susuDiamond: { current: 26, min: 24 },
    gulaAren: { current: 2, min: 1 },
    cranberryDiamond: { current: 7, min: 6 },
    botol: { current: 100, min: 75 },
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
        .from("paradose_stocks")
        .select("*");
      if (error) throw error;
      if (data && data.length > 0) {
        const dbStocks = data[0];
        setStocks({
          goldenBrew: {
            current: dbStocks.golden_brew_current || 12,
            min: dbStocks.golden_brew_min || 10,
          },
          berrycano: {
            current: dbStocks.berrycano_current || 7,
            min: dbStocks.berrycano_min || 10,
          },
          bijiKopiBlend: {
            current: dbStocks.biji_kopi_blend_current || 9,
            min: dbStocks.biji_kopi_blend_min || 8,
          },
          susuDiamond: {
            current: dbStocks.susu_diamond_current || 26,
            min: dbStocks.susu_diamond_min || 24,
          },
          gulaAren: {
            current: dbStocks.gula_aren_current || 2,
            min: dbStocks.gula_aren_min || 1,
          },
          cranberryDiamond: {
            current: dbStocks.cranberry_diamond_current || 7,
            min: dbStocks.cranberry_diamond_min || 6,
          },
          botol: {
            current: dbStocks.botol_current || 100,
            min: dbStocks.botol_min || 75,
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
      const { error } = await supabase.from("paradose_stocks").upsert({
        id: 1,
        golden_brew_current: stocks.goldenBrew.current,
        golden_brew_min: stocks.goldenBrew.min,
        berrycano_current: stocks.berrycano.current,
        berrycano_min: stocks.berrycano.min,
        biji_kopi_blend_current: stocks.bijiKopiBlend.current,
        biji_kopi_blend_min: stocks.bijiKopiBlend.min,
        susu_diamond_current: stocks.susuDiamond.current,
        susu_diamond_min: stocks.susuDiamond.min,
        gula_aren_current: stocks.gulaAren.current,
        gula_aren_min: stocks.gulaAren.min,
        cranberry_diamond_current: stocks.cranberryDiamond.current,
        cranberry_diamond_min: stocks.cranberryDiamond.min,
        botol_current: stocks.botol.current,
        botol_min: stocks.botol.min,
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

  const getProgressColor = (current: number, min: number) => {
    if (current <= min) return "#fb2c36";
    return "#00c950";
  };

  const getProgressPercentage = (current: number, min: number) => {
    const total = min * 2;
    return Math.min((current / total) * 100, 100);
  };

  const totalProducts = stocks.goldenBrew.current + stocks.berrycano.current;
  const totalRawMaterials =
    stocks.bijiKopiBlend.current +
    stocks.susuDiamond.current +
    stocks.gulaAren.current +
    stocks.cranberryDiamond.current +
    stocks.botol.current +
    customMaterials.reduce((sum, mat) => sum + mat.current, 0);

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
            {/* Golden Brew */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Golden Brew
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
                  {stocks.goldenBrew.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    cups
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 10 cups
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full"
                  style={{
                    width: `${getProgressPercentage(stocks.goldenBrew.current, stocks.goldenBrew.min)}%`,
                    backgroundColor: getProgressColor(
                      stocks.goldenBrew.current,
                      stocks.goldenBrew.min,
                    ),
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("goldenBrew", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium leading-[20px] text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("goldenBrew", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium leading-[20px]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Berrycano */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3
                    className="text-[18px] font-medium leading-[27px] text-[#101828]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Berrycano
                  </h3>
                  <p
                    className="text-[14px] leading-[20px] text-[#6a7282]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Updated: 2026-04-26
                  </p>
                </div>
                {stocks.berrycano.current <= stocks.berrycano.min && (
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
                  {stocks.berrycano.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    cups
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 10 cups
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full"
                  style={{
                    width: `${getProgressPercentage(stocks.berrycano.current, stocks.berrycano.min)}%`,
                    backgroundColor: getProgressColor(
                      stocks.berrycano.current,
                      stocks.berrycano.min,
                    ),
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("berrycano", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium leading-[20px] text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("berrycano", 1)}
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
            {/* Biji Kopi Blend */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Biji Kopi Blend
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
                  0{stocks.bijiKopiBlend.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    kg
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 8 kg
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.bijiKopiBlend.current, stocks.bijiKopiBlend.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("bijiKopiBlend", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("bijiKopiBlend", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Susu Diamond */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Susu Diamond
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
                  {stocks.susuDiamond.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    liter
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 24 liter
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.susuDiamond.current, stocks.susuDiamond.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("susuDiamond", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("susuDiamond", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Gula Aren */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Gula Aren
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
                  0{stocks.gulaAren.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    liter
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 1 liter
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.gulaAren.current, stocks.gulaAren.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("gulaAren", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("gulaAren", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Cranberry Diamond */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Cranberry Diamond
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
                  0{stocks.cranberryDiamond.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    Karton
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 6 Karton
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.cranberryDiamond.current, stocks.cranberryDiamond.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("cranberryDiamond", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("cranberryDiamond", 1)}
                  className="flex-1 bg-[#101828] hover:bg-gray-900 text-white rounded-[10px] h-[36px] text-[14px] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  + Restock
                </button>
              </div>
            </div>

            {/* Botol */}
            <div className="bg-white border-[#e5e7eb] border-[0.8px] rounded-[10px] p-5">
              <div className="mb-3">
                <h3
                  className="text-[18px] font-medium leading-[27px] text-[#101828]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Botol
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
                  {stocks.botol.current}{" "}
                  <span className="text-[16px] leading-[24px] text-[#4a5565] font-normal">
                    pcs
                  </span>
                </p>
                <p
                  className="text-[14px] leading-[20px] text-[#4a5565] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Min: 75 pcs
                </p>
              </div>
              <div className="bg-[#e5e7eb] h-[8px] rounded-full mb-4">
                <div
                  className="h-[8px] rounded-full bg-[#00c950]"
                  style={{
                    width: `${getProgressPercentage(stocks.botol.current, stocks.botol.min)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStock("botol", -1)}
                  className="flex-1 bg-[#f3f4f6] hover:bg-gray-300 rounded-[10px] h-[36px] text-[14px] font-medium text-[#0a0a0a]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  - Use
                </button>
                <button
                  onClick={() => updateStock("botol", 1)}
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
