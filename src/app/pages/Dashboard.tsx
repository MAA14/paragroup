import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Header from '../components/Header';
import { Coffee, Cake, TrendingUp, Package, AlertCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import imgParadoseLogo from '../../imports/Header/0210f8247ab69f16929c062e8dc995e803d5bd76.png';
import svgPathsParasoes from '../../imports/Header-2/svg-qlzkjys9tb';

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  min_stock: number;
}

interface TransactionItem {
  id: string;
  total: number;
}

interface RawMaterial {
  id: string;
  name: string;
  brand: string;
  unit: string;
  current_stock: number;
  min_stock: number;
}

export default function Dashboard() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived values -------------------------------------------------------
  const paradoseProducts = products.filter(p => p.brand === 'Paradose');
  const parasoesProducts = products.filter(p => p.brand === 'Parasoes');

  const totalParadoseUnits = paradoseProducts.reduce((sum, p) => sum + (p.stock ?? 0), 0);
  const totalParasoesUnits = parasoesProducts.reduce((sum, p) => sum + (p.stock ?? 0), 0);

  // Total value per brand (price * stock)
  const totalParadoseValue = paradoseProducts.reduce((sum, p) => sum + (p.stock ?? 0) * p.price, 0);
  const totalParasoesValue = parasoesProducts.reduce((sum, p) => sum + (p.stock ?? 0) * p.price, 0);

  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total), 0);

  const totalProducts = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);

  // Low stock alerts from products and raw materials
  const lowStockItems = [
    ...products.filter(p => (p.stock ?? 0) <= (p.min_stock ?? 0)).map(p => ({
      name: p.name,
      brand: p.brand,
      current_stock: p.stock,
      min_stock: p.min_stock,
    })),
    ...materials.filter(m => m.current_stock <= m.min_stock).map(m => ({
      name: m.name,
      brand: m.brand,
      current_stock: m.current_stock,
      min_stock: m.min_stock,
    })),
  ];

  // Fetch data -----------------------------------------------------------
  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: productsData, error: productsError } = await supabase.from('products').select('*');
      const { data: materialsData, error: materialsError } = await supabase.from('raw_materials').select('*');
      const { data: transactionsData, error: transactionsError } = await supabase.from('transactions').select('id,total');

      if (productsError) console.error('Products fetch error:', productsError);
      if (materialsError) console.error('Materials fetch error:', materialsError);
      if (transactionsError) console.error('Transactions fetch error:', transactionsError);

      setProducts(productsData || []);
      setMaterials(materialsData || []);
      setTransactions(transactionsData || []);
      setLoading(false);
    };
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const stockData = products.map(p => ({
    id: p.id,
    name: p.name,
    stock: p.stock ?? 0,
    min: p.min_stock ?? 0,
  }));

  const brandDistribution = [
    { id: 'brand-paradose', name: 'Paradose (Coffee)', value: totalParadoseUnits },
    { id: 'brand-parasoes', name: 'Parasoes (Choux)', value: totalParasoesUnits },
  ];

  const COLORS = ['#8B4513', '#F4A460'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor your inventory across both brands</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Paradose summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Coffee className="w-6 h-6 text-amber-700" />
              </div>
              <Link to="/paradose" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                View <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Paradose</h3>
            <p className="text-2xl font-semibold text-gray-900 mb-2">
              {totalParadoseUnits} units
            </p>
            <p className="text-sm text-gray-500">
              Total Inventory Value: Rp {totalParadoseValue.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Parasoes summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Cake className="w-6 h-6 text-orange-700" />
              </div>
              <Link to="/parasoes" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                View <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Parasoes</h3>
            <p className="text-2xl font-semibold text-gray-900 mb-2">
              {totalParasoesUnits} units
            </p>
            <p className="text-sm text-gray-500">
              Total Inventory Value: Rp {totalParasoesValue.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Revenue</h3>
            <p className="text-2xl font-semibold text-gray-900 mb-2">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +12.5% from last month
            </p>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-700" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Products</h3>
            <p className="text-2xl font-semibold text-gray-900 mb-2">
              {totalProducts}
            </p>
            <p className="text-sm text-gray-500">Across 2 brands</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Low Stock Alerts</h3>
                <div className="space-y-2">
                  {lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded px-4 py-2">
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <span className="text-gray-500 ml-2">({item.brand})</span>
                      </div>
                      <span className="text-red-600 font-medium">{item.current_stock}/{item.min_stock} units remaining</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Product Stock Levels</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="#374151" name="Current Stock" />
                <Bar dataKey="min" fill="#9CA3AF" name="Minimum Stock" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Brand Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={brandDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {brandDistribution.map((entry, idx) => (
                    <Cell key={entry.id} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Logos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Link to="/paradose" className="block group hover:opacity-90 transition-opacity">
            <div className="bg-white rounded-lg border border-gray-200 p-12 hover:shadow-lg transition-shadow flex items-center justify-center min-h-[200px]">
              <img src={imgParadoseLogo} alt="Paradose Logo" className="max-w-full h-auto object-contain" style={{ maxHeight: '150px' }} />
            </div>
          </Link>
          <Link to="/parasoes" className="block group hover:opacity-90 transition-opacity">
            <div className="bg-white rounded-lg border border-gray-200 p-12 hover:shadow-lg transition-shadow flex items-center justify-center min-h-[200px]">
              <div className="relative flex items-center justify-center" style={{ width: '250px', height: '50px' }}>
                <svg className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 97 16.7845">
                  <g>
                    <path d={svgPathsParasoes.pf065700} fill="#4A5565" />
                    <path d={svgPathsParasoes.p74f2000} fill="#4A5565" />
                    <path d={svgPathsParasoes.p2a934e80} fill="#4A5565" />
                    <path d={svgPathsParasoes.p1d3dd200} fill="#4A5565" />
                    <path d={svgPathsParasoes.p70a2a00} fill="#4A5565" />
                    <path d={svgPathsParasoes.p23eb2ef0} fill="#4A5565" />
                    <path d={svgPathsParasoes.p36298cf2} fill="#4A5565" />
                    <path d={svgPathsParasoes.p64c2400} fill="#4A5565" />
                  </g>
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
