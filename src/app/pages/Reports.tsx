import { useState } from 'react';
import Header from '../components/Header';
import { FileText, Printer, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [selectedBrand, setSelectedBrand] = useState('all');

  const monthlyData = {
    '2026-04': {
      paradose: {
        sales: 125,
        revenue: 3250000,
        costs: 1625000,
        profit: 1625000,
        products: [
          { name: 'Golden Brew', sold: 78, revenue: 1950000 },
          { name: 'Berrycano', sold: 47, revenue: 1300000 },
        ],
      },
      parasoes: {
        sales: 98,
        revenue: 1470000,
        costs: 735000,
        profit: 735000,
        products: [
          { name: 'Chocolate Choux', sold: 52, revenue: 780000 },
          { name: 'Vanilla Choux', sold: 46, revenue: 690000 },
        ],
      },
      online: {
        shopee: { orders: 23, revenue: 845000, commission: 84500, net: 760500 },
        gofood: { orders: 18, revenue: 672000, commission: 100800, net: 571200 },
        grabfood: { orders: 15, revenue: 520000, commission: 78000, net: 442000 },
      },
      expenses: [
        { category: 'Bahan Baku', amount: 1800000 },
        { category: 'Operasional', amount: 450000 },
        { category: 'Marketing', amount: 200000 },
        { category: 'Utilitas', amount: 185000 },
      ],
    },
  };

  const currentData = monthlyData[selectedMonth as keyof typeof monthlyData];

  const totalRevenue = currentData.paradose.revenue + currentData.parasoes.revenue +
    currentData.online.shopee.revenue + currentData.online.gofood.revenue + currentData.online.grabfood.revenue;

  const totalCosts = currentData.paradose.costs + currentData.parasoes.costs +
    currentData.expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const totalProfit = totalRevenue - totalCosts;

  const onlineCommission = currentData.online.shopee.commission +
    currentData.online.gofood.commission + currentData.online.grabfood.commission;

  const handlePrint = () => {
    window.print();
  };

  const getFilteredData = () => {
    if (selectedBrand === 'paradose') return currentData.paradose;
    if (selectedBrand === 'parasoes') return currentData.parasoes;
    return {
      sales: currentData.paradose.sales + currentData.parasoes.sales,
      revenue: currentData.paradose.revenue + currentData.parasoes.revenue,
      costs: currentData.paradose.costs + currentData.parasoes.costs,
      profit: currentData.paradose.profit + currentData.parasoes.profit,
    };
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 print:mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg print:hidden">
                <FileText className="w-8 h-8 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Laporan Keuangan</h1>
                <p className="text-gray-600 print:hidden">Menampilkan rekap penjualan harian dan total penjualan</p>
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
              Periode: {new Date(selectedMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-gray-600">Brand: {selectedBrand === 'all' ? 'Semua' : selectedBrand === 'paradose' ? 'Paradose' : 'Parasoes'}</p>
            <p className="text-sm text-gray-500 mt-2">
              Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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
              {typeof filteredData.sales === 'number' ? filteredData.sales : '-'}
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
            <p className="text-sm text-gray-500 mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</p>
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
            <p className="text-sm text-gray-500 mt-1">Rp {totalCosts.toLocaleString('id-ID')}</p>
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
            <p className="text-sm text-gray-500 mt-1">Rp {totalProfit.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 print:break-inside-avoid">
            <h3 className="font-semibold text-gray-900 mb-4">Rincian Penjualan per Brand</h3>
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Paradose (Coffee)</h4>
                  <span className="text-sm text-gray-600">{currentData.paradose.sales} unit</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Revenue:</span>
                    <span className="font-medium">Rp {currentData.paradose.revenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Biaya:</span>
                    <span className="font-medium text-red-600">-Rp {currentData.paradose.costs.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                    <span>Profit:</span>
                    <span className="text-green-600">Rp {currentData.paradose.profit.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Parasoes (Choux)</h4>
                  <span className="text-sm text-gray-600">{currentData.parasoes.sales} unit</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Revenue:</span>
                    <span className="font-medium">Rp {currentData.parasoes.revenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Biaya:</span>
                    <span className="font-medium text-red-600">-Rp {currentData.parasoes.costs.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                    <span>Profit:</span>
                    <span className="text-green-600">Rp {currentData.parasoes.profit.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 print:break-inside-avoid">
            <h3 className="font-semibold text-gray-900 mb-4">Penjualan Online</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium text-gray-900">ShopeeFood</div>
                  <div className="text-sm text-gray-600">{currentData.online.shopee.orders} orders</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    Rp {currentData.online.shopee.revenue.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-red-600">
                    Komisi: -Rp {currentData.online.shopee.commission.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Net: Rp {currentData.online.shopee.net.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium text-gray-900">GoFood</div>
                  <div className="text-sm text-gray-600">{currentData.online.gofood.orders} orders</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    Rp {currentData.online.gofood.revenue.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-red-600">
                    Komisi: -Rp {currentData.online.gofood.commission.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Net: Rp {currentData.online.gofood.net.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium text-gray-900">GrabFood</div>
                  <div className="text-sm text-gray-600">{currentData.online.grabfood.orders} orders</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    Rp {currentData.online.grabfood.revenue.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-red-600">
                    Komisi: -Rp {currentData.online.grabfood.commission.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Net: Rp {currentData.online.grabfood.net.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total Online Commission:</span>
                  <span className="text-red-600">-Rp {onlineCommission.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden print:block mt-8 pt-6 border-t">
          <div className="text-center text-sm text-gray-600">
            <p>Laporan ini dibuat secara otomatis oleh Sistem Inventory Management</p>
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
