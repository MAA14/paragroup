import { useState, useEffect } from "react";
import Header from "../components/Header";
import {
  FileText,
  Printer,
  TrendingUp,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface MonthlyData {
  paradose: {
    sales: number;
    revenue: number;
    costs: number;
    profit: number;
    products: Array<{ name: string; sold: number; revenue: number }>;
  };
  parasoes: {
    sales: number;
    revenue: number;
    costs: number;
    profit: number;
    products: Array<{ name: string; sold: number; revenue: number }>;
  };
  online: {
    shopee: {
      orders: number;
      revenue: number;
      commission: number;
      net: number;
    };
    gofood: {
      orders: number;
      revenue: number;
      commission: number;
      net: number;
    };
    grabfood: {
      orders: number;
      revenue: number;
      commission: number;
      net: number;
    };
  };
  expenses: Array<{ category: string; amount: number }>;
}

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedMonth");
      return stored || "2026-04";
    }
    return "2026-04";
  });
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyData>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthlyData(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedMonth", selectedMonth);
    }
  }, [selectedMonth]);

  const fetchMonthlyData = async (month: string) => {
    try {
      setLoading(true);
      setError(null);

      // Initialize default data structure with all values as 0
      const defaultData: MonthlyData = {
        paradose: {
          sales: 0,
          revenue: 0,
          costs: 0,
          profit: 0,
          products: [],
        },
        parasoes: {
          sales: 0,
          revenue: 0,
          costs: 0,
          profit: 0,
          products: [],
        },
        online: {
          shopee: { orders: 0, revenue: 0, commission: 0, net: 0 },
          gofood: { orders: 0, revenue: 0, commission: 0, net: 0 },
          grabfood: { orders: 0, revenue: 0, commission: 0, net: 0 },
        },
        expenses: [],
      };

      // Fetch transactions for the selected month
      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("*, transaction_items (*)")
        .gte("created_at", `${month}-01T00:00:00Z`)
        .lt(
          "created_at",
          `${new Date(month + "-01").getFullYear()}-${String(parseInt(month.split("-")[1]) + 1).padStart(2, "0")}-01T00:00:00Z`,
        );

      if (transError) {
        console.error("Error fetching transactions:", transError);
        setMonthlyData((prev) => ({ ...prev, [month]: defaultData }));
        return;
      }

      // Fetch expenses for the selected month
      const { data: expensesData, error: expError } = await supabase
        .from("expenses")
        .select("*")
        .eq("month", month);

      if (expError) {
        console.error("Error fetching expenses:", expError);
      }

      // Process transactions
      const paradoseProducts: Record<
        string,
        { sold: number; revenue: number }
      > = {};
      const paraoesProducts: Record<string, { sold: number; revenue: number }> =
        {};
      let paradoseSales = 0;
      let paradoseRevenue = 0;
      let paraoesRevenue = 0;
      let paraoesRevenue2 = 0;

      const onlineData = {
        shopee: { orders: 0, revenue: 0, commission: 0, net: 0 },
        gofood: { orders: 0, revenue: 0, commission: 0, net: 0 },
        grabfood: { orders: 0, revenue: 0, commission: 0, net: 0 },
      };

      if (transactions && Array.isArray(transactions)) {
        transactions.forEach((transaction) => {
          const isOnline = transaction.online_platform;

          if (isOnline === "shopee") {
            onlineData.shopee.orders += 1;
            onlineData.shopee.revenue += transaction.total || 0;
            onlineData.shopee.commission += transaction.commission || 0;
            onlineData.shopee.net += transaction.net_total || 0;
          } else if (isOnline === "gofood") {
            onlineData.gofood.orders += 1;
            onlineData.gofood.revenue += transaction.total || 0;
            onlineData.gofood.commission += transaction.commission || 0;
            onlineData.gofood.net += transaction.net_total || 0;
          } else if (isOnline === "grabfood") {
            onlineData.grabfood.orders += 1;
            onlineData.grabfood.revenue += transaction.total || 0;
            onlineData.grabfood.commission += transaction.commission || 0;
            onlineData.grabfood.net += transaction.net_total || 0;
          }

          // Process items
          if (
            transaction.transaction_items &&
            Array.isArray(transaction.transaction_items)
          ) {
            transaction.transaction_items.forEach((item: any) => {
              if (item.brand === "Paradose") {
                paradoseSales += item.quantity || 0;
                paradoseRevenue += (item.price || 0) * (item.quantity || 0);

                if (!paradoseProducts[item.name]) {
                  paradoseProducts[item.name] = { sold: 0, revenue: 0 };
                }
                paradoseProducts[item.name].sold += item.quantity || 0;
                paradoseProducts[item.name].revenue +=
                  (item.price || 0) * (item.quantity || 0);
              } else if (item.brand === "Parasoes") {
                paraoesRevenue2 += item.quantity || 0;
                paraoesRevenue += (item.price || 0) * (item.quantity || 0);

                if (!paraoesProducts[item.name]) {
                  paraoesProducts[item.name] = { sold: 0, revenue: 0 };
                }
                paraoesProducts[item.name].sold += item.quantity || 0;
                paraoesProducts[item.name].revenue +=
                  (item.price || 0) * (item.quantity || 0);
              }
            });
          }
        });
      }

      // Calculate costs (assuming 50% of revenue for now - adjust based on your business logic)
      const paradoseCosts = Math.round(paradoseRevenue * 0.5);
      const paraoesRecipientCosts = Math.round(paraoesRevenue * 0.5);

      // Process expenses
      const expensesArray =
        expensesData?.map((exp) => ({
          category: exp.category || "",
          amount: exp.amount || 0,
        })) || [];

      const totalExpenses = expensesArray.reduce(
        (sum, exp) => sum + (exp.amount || 0),
        0,
      );

      const processedData: MonthlyData = {
        paradose: {
          sales: paradoseSales,
          revenue: paradoseRevenue,
          costs: paradoseCosts + totalExpenses / 2, // Split expenses
          profit: paradoseRevenue - paradoseCosts - totalExpenses / 2,
          products: Object.entries(paradoseProducts).map(([name, data]) => ({
            name,
            sold: data.sold,
            revenue: data.revenue,
          })),
        },
        parasoes: {
          sales: paraoesRevenue2,
          revenue: paraoesRevenue,
          costs: paraoesRecipientCosts + totalExpenses / 2,
          profit: paraoesRevenue - paraoesRecipientCosts - totalExpenses / 2,
          products: Object.entries(paraoesProducts).map(([name, data]) => ({
            name,
            sold: data.sold,
            revenue: data.revenue,
          })),
        },
        online: onlineData,
        expenses: expensesArray,
      };

      setMonthlyData((prev) => ({ ...prev, [month]: processedData }));
    } catch (err) {
      console.error("Unexpected error fetching data:", err);
      setError("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const currentData = monthlyData[selectedMonth as keyof typeof monthlyData];

  // Provide default data if not loaded yet
  const displayData = currentData || {
    paradose: {
      sales: 0,
      revenue: 0,
      costs: 0,
      profit: 0,
      products: [],
    },
    parasoes: {
      sales: 0,
      revenue: 0,
      costs: 0,
      profit: 0,
      products: [],
    },
    online: {
      shopee: { orders: 0, revenue: 0, commission: 0, net: 0 },
      gofood: { orders: 0, revenue: 0, commission: 0, net: 0 },
      grabfood: { orders: 0, revenue: 0, commission: 0, net: 0 },
    },
    expenses: [],
  };

  const totalRevenue =
    selectedBrand === "paradose"
      ? displayData.paradose.revenue || 0
      : selectedBrand === "parasoes"
        ? displayData.parasoes.revenue || 0
        : (displayData.paradose.revenue || 0) +
          (displayData.parasoes.revenue || 0) +
          (displayData.online.shopee.revenue || 0) +
          (displayData.online.gofood.revenue || 0) +
          (displayData.online.grabfood.revenue || 0);

  const totalCosts =
    selectedBrand === "paradose"
      ? displayData.paradose.costs || 0
      : selectedBrand === "parasoes"
        ? displayData.parasoes.costs || 0
        : (displayData.paradose.costs || 0) +
          (displayData.parasoes.costs || 0) +
          (displayData.expenses?.reduce(
            (sum, exp) => sum + (exp.amount || 0),
            0,
          ) || 0);

  const totalProfit = totalRevenue - totalCosts;

  const onlineCommission =
    (displayData.online.shopee.commission || 0) +
    (displayData.online.gofood.commission || 0) +
    (displayData.online.grabfood.commission || 0);

  const handlePrint = () => {
    window.print();
  };

  const getFilteredData = () => {
    if (selectedBrand === "paradose") return displayData.paradose;
    if (selectedBrand === "parasoes") return displayData.parasoes;
    return {
      sales:
        (displayData.paradose.sales || 0) + (displayData.parasoes.sales || 0),
      revenue:
        (displayData.paradose.revenue || 0) +
        (displayData.parasoes.revenue || 0),
      costs:
        (displayData.paradose.costs || 0) + (displayData.parasoes.costs || 0),
      profit:
        (displayData.paradose.profit || 0) + (displayData.parasoes.profit || 0),
    };
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {loading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700">Loading report data...</p>
          </div>
        )}

        <div className="mb-8 print:mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg print:hidden">
                <FileText className="w-8 h-8 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">
                  Laporan Keuangan
                </h1>
                <p className="text-gray-600 print:hidden">
                  Menampilkan rekap penjualan harian dan total penjualan
                </p>
              </div>
            </div>
            <div className="flex gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Printer className="w-5 h-5" />
                Print Laporan
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Bulan
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              >
                <option value="all">Semua Brand</option>
                <option value="paradose">Paradose</option>
                <option value="parasoes">Parasoes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="hidden print:block mb-6">
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold">LAPORAN KEUANGAN BULANAN</h2>
            <p className="text-gray-600 mt-1">
              Periode:{" "}
              {new Date(selectedMonth).toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-gray-600">
              Brand:{" "}
              {selectedBrand === "all"
                ? "Semua"
                : selectedBrand === "paradose"
                  ? "Paradose"
                  : "Parasoes"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Dicetak pada:{" "}
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg print:hidden">
                <ShoppingCart className="w-5 h-5 text-blue-700" />
              </div>
              <h3 className="text-gray-600 text-sm">Total Penjualan</h3>
            </div>
            <p className="text-3xl font-semibold text-gray-900">
              {typeof filteredData.sales === "number" ? filteredData.sales : 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Unit terjual</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg print:hidden">
                <DollarSign className="w-5 h-5 text-green-700" />
              </div>
              <h3 className="text-gray-600 text-sm">Total Revenue</h3>
            </div>
            <p className="text-3xl font-semibold text-gray-900">
              {(totalRevenue / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg print:hidden">
                <TrendingUp className="w-5 h-5 text-red-700" />
              </div>
              <h3 className="text-gray-600 text-sm">Total Biaya</h3>
            </div>
            <p className="text-3xl font-semibold text-gray-900">
              {(totalCosts / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Rp {totalCosts.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg print:hidden">
                <DollarSign className="w-5 h-5 text-purple-700" />
              </div>
              <h3 className="text-gray-600 text-sm">Net Profit</h3>
            </div>
            <p className="text-3xl font-semibold text-green-600">
              {(totalProfit / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Rp {totalProfit.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 print:break-inside-avoid">
            <h3 className="font-semibold text-gray-900 mb-4">
              Rincian Penjualan per Brand
            </h3>
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    Paradose (Coffee)
                  </h4>
                  <span className="text-sm text-gray-600">
                    {displayData.paradose.sales || 0} unit
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Revenue:</span>
                    <span className="font-medium">
                      Rp{" "}
                      {(displayData.paradose.revenue || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Biaya:</span>
                    <span className="font-medium text-red-600">
                      -Rp{" "}
                      {(displayData.paradose.costs || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                    <span>Profit:</span>
                    <span className="text-green-600">
                      Rp{" "}
                      {(displayData.paradose.profit || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    Parasoes (Choux)
                  </h4>
                  <span className="text-sm text-gray-600">
                    {displayData.parasoes.sales || 0} unit
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Revenue:</span>
                    <span className="font-medium">
                      Rp{" "}
                      {(displayData.parasoes.revenue || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Biaya:</span>
                    <span className="font-medium text-red-600">
                      -Rp{" "}
                      {(displayData.parasoes.costs || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                    <span>Profit:</span>
                    <span className="text-green-600">
                      Rp{" "}
                      {(displayData.parasoes.profit || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 print:break-inside-avoid">
            <h3 className="font-semibold text-gray-900 mb-4">
              Penjualan Online
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium text-gray-900">ShopeeFood</div>
                  <div className="text-sm text-gray-600">
                    {displayData.online.shopee.orders || 0} orders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    Rp{" "}
                    {(displayData.online.shopee.revenue || 0).toLocaleString(
                      "id-ID",
                    )}
                  </div>
                  <div className="text-sm text-red-600">
                    Komisi: -Rp{" "}
                    {(displayData.online.shopee.commission || 0).toLocaleString(
                      "id-ID",
                    )}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Net: Rp{" "}
                    {(displayData.online.shopee.net || 0).toLocaleString(
                      "id-ID",
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium text-gray-900">GoFood</div>
                  <div className="text-sm text-gray-600">
                    {displayData.online.gofood.orders || 0} orders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    Rp{" "}
                    {(displayData.online.gofood.revenue || 0).toLocaleString(
                      "id-ID",
                    )}
                  </div>
                  <div className="text-sm text-red-600">
                    Komisi: -Rp{" "}
                    {(displayData.online.gofood.commission || 0).toLocaleString(
                      "id-ID",
                    )}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Net: Rp{" "}
                    {(displayData.online.gofood.net || 0).toLocaleString(
                      "id-ID",
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium text-gray-900">GrabFood</div>
                  <div className="text-sm text-gray-600">
                    {displayData.online.grabfood.orders || 0} orders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    Rp{" "}
                    {(displayData.online.grabfood.revenue || 0).toLocaleString(
                      "id-ID",
                    )}
                  </div>
                  <div className="text-sm text-red-600">
                    Komisi: -Rp{" "}
                    {(
                      displayData.online.grabfood.commission || 0
                    ).toLocaleString("id-ID")}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Net: Rp{" "}
                    {(displayData.online.grabfood.net || 0).toLocaleString(
                      "id-ID",
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total Online Commission:</span>
                  <span className="text-red-600">
                    -Rp {onlineCommission.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden print:block mt-8 pt-6 border-t">
          <div className="text-center text-sm text-gray-600">
            <p>
              Laporan ini dibuat secara otomatis oleh Sistem Inventory
              Management
            </p>
            <p className="mt-1">© 2026 Paradose & Parasoes UMKM</p>
          </div>
        </div>
      </main>

      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:border-2 {
            border-width: 2px !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }
          .print\\:break-before-page {
            break-before: page !important;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
