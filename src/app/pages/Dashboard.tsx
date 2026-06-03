import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Header from '../components/Header';
import { Coffee, Cake, TrendingUp, Package, AlertCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import imgParadoseLogo from '../../imports/Header/0210f8247ab69f16929c062e8dc995e803d5bd76.png';
import svgPathsParasoes from '../../imports/Header-2/svg-qlzkjys9tb';

export default function Dashboard() {
  const [paradoseStock, setParadoseStock] = useState({
    goldenBrew: { current: 45, min: 30 },
    berrycano: { current: 28, min: 30 },
    coffeeBeans: { current: 120, min: 50 },
    milk: { current: 65, min: 40 },
  });

  const [parasoesStock, setParasoesStock] = useState({
    chocolate: { current: 35, min: 25 },
    vanilla: { current: 42, min: 25 },
    chouxDough: { current: 80, min: 40 },
    cream: { current: 55, min: 30 },
  });

  // loading state removed

  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase.from('inventory').select('*');
      if (error) {
        console.error('Error fetching inventory:', error);
      } else if (data) {
        const newParadoseStock = { ...paradoseStock };
        const newParasoesStock = { ...parasoesStock };
        
        data.forEach((item: any) => {
          if (item.brand === 'Paradose') {
            if (item.name === 'Golden Brew') newParadoseStock.goldenBrew = { current: item.current_stock, min: item.min_stock };
            if (item.name === 'Berrycano') newParadoseStock.berrycano = { current: item.current_stock, min: item.min_stock };
            if (item.name === 'Coffee Beans') newParadoseStock.coffeeBeans = { current: item.current_stock, min: item.min_stock };
            if (item.name === 'Milk') newParadoseStock.milk = { current: item.current_stock, min: item.min_stock };
          } else if (item.brand === 'Parasoes') {
            if (item.name === 'Chocolate') newParasoesStock.chocolate = { current: item.current_stock, min: item.min_stock };
            if (item.name === 'Vanilla') newParasoesStock.vanilla = { current: item.current_stock, min: item.min_stock };
            if (item.name === 'Choux Dough') newParasoesStock.chouxDough = { current: item.current_stock, min: item.min_stock };
            if (item.name === 'Cream') newParasoesStock.cream = { current: item.current_stock, min: item.min_stock };
          }
        });
        
        setParadoseStock(newParadoseStock);
        setParasoesStock(newParasoesStock);
      }
    };
    
    fetchInventory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stockData = [
    {
      id: 'stock-golden-brew',
      name: 'Golden Brew',
      stock: paradoseStock.goldenBrew.current,
      min: paradoseStock.goldenBrew.min,
    },
    {
      id: 'stock-berrycano',
      name: 'Berrycano',
      stock: paradoseStock.berrycano.current,
      min: paradoseStock.berrycano.min,
    },
    {
      id: 'stock-chocolate',
      name: 'Chocolate',
      stock: parasoesStock.chocolate.current,
      min: parasoesStock.chocolate.min,
    },
    {
      id: 'stock-vanilla',
      name: 'Vanilla',
      stock: parasoesStock.vanilla.current,
      min: parasoesStock.vanilla.min,
    },
  ];

  const brandDistribution = [
    {
      id: 'brand-paradose',
      name: 'Paradose (Coffee)',
      value: Object.values(paradoseStock).reduce((sum, item) => sum + item.current, 0)
    },
    {
      id: 'brand-parasoes',
      name: 'Parasoes (Choux)',
      value: Object.values(parasoesStock).reduce((sum, item) => sum + item.current, 0)
    },
  ];

  const COLORS = ['#8B4513', '#F4A460'];

  const lowStockItems = [
    ...(paradoseStock.berrycano.current <= paradoseStock.berrycano.min ? [{ name: 'Berrycano', brand: 'Paradose', current: paradoseStock.berrycano.current }] : []),
    ...(parasoesStock.chocolate.current <= parasoesStock.chocolate.min ? [{ name: 'Chocolate Choux', brand: 'Parasoes', current: parasoesStock.chocolate.current }] : []),
  ];

  const totalParadoseValue = 2500000; // Rp
  const totalParasoesValue = 1800000; // Rp

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor your inventory across both brands</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              {Object.values(paradoseStock).reduce((sum, item) => sum + item.current, 0)} units
            </p>
            <p className="text-sm text-gray-500">Total Inventory Value: Rp {totalParadoseValue.toLocaleString('id-ID')}</p>
          </div>

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
              {Object.values(parasoesStock).reduce((sum, item) => sum + item.current, 0)} units
            </p>
            <p className="text-sm text-gray-500">Total Inventory Value: Rp {totalParasoesValue.toLocaleString('id-ID')}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Revenue</h3>
            <p className="text-2xl font-semibold text-gray-900 mb-2">
              Rp {(totalParadoseValue + totalParasoesValue).toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +12.5% from last month
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-700" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Products</h3>
            <p className="text-2xl font-semibold text-gray-900 mb-2">
              {Object.values(paradoseStock).reduce((sum, item) => sum + item.current, 0) +
                Object.values(parasoesStock).reduce((sum, item) => sum + item.current, 0)}
            </p>
            <p className="text-sm text-gray-500">Across 2 brands</p>
          </div>
        </div>

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
                      <span className="text-red-600 font-medium">{item.current} units remaining</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Product Stock Levels</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockData} key="stock-bar-chart">
                <CartesianGrid strokeDasharray="3 3" key="stock-grid" />
                <XAxis dataKey="name" key="stock-xaxis" />
                <YAxis key="stock-yaxis" />
                <Tooltip key="stock-tooltip" />
                <Legend key="stock-legend" />
                <Bar dataKey="stock" fill="#374151" name="Current Stock" key="bar-current-stock" />
                <Bar dataKey="min" fill="#9CA3AF" name="Minimum Stock" key="bar-min-stock" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Brand Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart key="brand-pie-chart">
                <Pie
                  data={brandDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  key="pie-brand-distribution"
                >
                  {brandDistribution.map((entry) => (
                    <Cell key={entry.id} fill={COLORS[brandDistribution.indexOf(entry) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip key="brand-tooltip" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Link to="/paradose" className="block group hover:opacity-90 transition-opacity">
            <div className="bg-white rounded-lg border border-gray-200 p-12 hover:shadow-lg transition-shadow flex items-center justify-center min-h-[200px]">
              <img
                src={imgParadoseLogo}
                alt="Paradose Logo"
                className="max-w-full h-auto object-contain"
                style={{ maxHeight: '150px' }}
              />
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
