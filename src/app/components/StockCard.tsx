import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface StockCardProps {
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  lastUpdated?: string;
  onUpdateStock?: (newStock: number) => void;
}

export default function StockCard({
  name,
  currentStock,
  minStock,
  unit,
  lastUpdated,
  onUpdateStock,
}: StockCardProps) {
  const isLowStock = currentStock <= minStock;
  const stockPercentage = (currentStock / minStock) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{name}</h3>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">Updated: {lastUpdated}</p>
          )}
        </div>
        {isLowStock && (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Low Stock</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold text-gray-900">{currentStock}</span>
          <span className="text-gray-600 mb-1">{unit}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Min: {minStock} {unit}</span>
          {currentStock > minStock ? (
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>{stockPercentage.toFixed(0)}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600">
              <TrendingDown className="w-4 h-4" />
              <span>{stockPercentage.toFixed(0)}%</span>
            </div>
          )}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isLowStock ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
          />
        </div>

        {onUpdateStock && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onUpdateStock(currentStock - 1)}
              className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              - Use
            </button>
            <button
              onClick={() => onUpdateStock(currentStock + 10)}
              className="flex-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Restock
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
