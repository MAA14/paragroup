import { useState } from "react";
import Header from "../components/Header";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useInventory } from "../contexts/InventoryContext";
import { supabase } from "../../lib/supabase";

interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [purchaseMethod, setPurchaseMethod] = useState<"online" | "offline">(
    "offline",
  );
  const [onlinePlatform, setOnlinePlatform] = useState("shopee");
  const [offlineType, setOfflineType] = useState("dine-in");

  const [isPrinting, setIsPrinting] = useState(false);
  const { products, isProductAvailable, checkout } = useInventory();

  const addToCart = (product: (typeof products)[0]) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} ditambahkan ke keranjang`);
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity + change) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
    toast.success("Produk dihapus dari keranjang");
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const platformCommission =
    purchaseMethod === "online"
      ? onlinePlatform === "shopee"
        ? 0.1
        : 0.15
      : 0;
  const commission = total * platformCommission;
  const netTotal = total - commission;

  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const saveTransactionToSupabase = async (transaction: any) => {
    try {
      // Insert main transaction record
      const { data: savedTransaction, error: transError } = await supabase
        .from("transactions")
        .insert([
          {
            id: transaction.id,
            customer_name: transaction.customerName,
            subtotal: transaction.subtotal,
            tax: transaction.tax,
            total: transaction.total,
            commission: transaction.commission,
            net_total: transaction.netTotal,
            payment_method: transaction.paymentMethod,
            payment_method_label: transaction.paymentMethodLabel,
            purchase_method: transaction.purchaseMethod,
            purchase_method_label: transaction.purchaseMethodLabel,
            online_platform: transaction.onlinePlatform,
            offline_type: transaction.offlineType,
            created_at: transaction.date,
          },
        ])
        .select();

      if (transError) {
        console.error("Error saving transaction:", transError);
        toast.error("Gagal menyimpan transaksi ke database");
        return false;
      }

      // Insert transaction items
      const transactionItems = transaction.items.map((item: any) => ({
        transaction_id: transaction.id,
        product_id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(transactionItems);

      if (itemsError) {
        console.error("Error saving transaction items:", itemsError);
        toast.error("Gagal menyimpan item transaksi");
        return false;
      }

      console.log("Transaction saved to Supabase:", savedTransaction);
      return true;
    } catch (error) {
      console.error("Unexpected error saving transaction:", error);
      toast.error("Terjadi kesalahan saat menyimpan transaksi");
      return false;
    }
  };

  const printThermalReceipt = async (transactionData: any) => {
    setIsPrinting(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }],
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
      });

      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService(
        "000018f0-0000-1000-8000-00805f9b34fb",
      );
      const characteristic = await service?.getCharacteristic(
        "00002af1-0000-1000-8000-00805f9b34fb",
      );

      if (!characteristic)
        throw new Error("Karakteristik Bluetooth tidak ditemukan");

      let receiptText =
        "================================\n" +
        "    PARADOSE & PARASOES UMKM    \n" +
        "================================\n" +
        `ID: ${transactionData.id}\n` +
        "--------------------------------\n";

      transactionData.items.forEach((item: any) => {
        receiptText += `${item.name}\n${item.quantity} x Rp ${item.price.toLocaleString("id-ID")} = Rp ${(item.price * item.quantity).toLocaleString("id-ID")}\n`;
      });

      receiptText +=
        "--------------------------------\n" +
        `Total:             Rp ${transactionData.total.toLocaleString("id-ID")}\n` +
        "================================\n" +
        "          Terima Kasih          \n\n\n";

      const encoder = new TextEncoder();
      const initCommand = new Uint8Array([27, 64]);
      const textData = encoder.encode(receiptText);

      const printBuffer = new Uint8Array(initCommand.length + textData.length);
      printBuffer.set(initCommand);
      printBuffer.set(textData, initCommand.length);

      const chunkSize = 100;
      for (let i = 0; i < printBuffer.length; i += chunkSize) {
        const chunk = printBuffer.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
      }
    } catch (error) {
      console.error("Bluetooth Print Error:", error);
      toast.error(
        "Gagal terhubung ke printer thermal. Mencetak via browser...",
      );
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong!");
      return;
    }

    const purchaseMethodLabel =
      purchaseMethod === "online"
        ? `Online - ${onlinePlatform === "shopee" ? "ShopeeFood" : onlinePlatform === "gofood" ? "GoFood" : "GrabFood"}`
        : `Offline - ${offlineType === "dine-in" ? "Dine In" : "Take Away"}`;

    const paymentMethodLabel =
      paymentMethod === "cash"
        ? "Tunai"
        : paymentMethod === "debit"
          ? "Kartu Debit"
          : paymentMethod === "qris"
            ? "QRIS"
            : "Transfer Bank";

    const transaction = {
      id: `TRX-${Date.now()}`,
      customerName: customerName || "Walk-in Customer",
      items: cart,
      subtotal,
      tax,
      total,
      commission,
      netTotal,
      paymentMethod,
      paymentMethodLabel,
      purchaseMethod,
      purchaseMethodLabel,
      onlinePlatform: purchaseMethod === "online" ? onlinePlatform : null,
      offlineType: purchaseMethod === "offline" ? offlineType : null,
      date: new Date().toISOString(),
    };

    console.log("Transaction:", transaction);

    // Save transaction to Supabase first
    saveTransactionToSupabase(transaction).then((success) => {
      if (!success) {
        return; // Stop if save failed
      }

      toast.success("Transaksi berhasil disimpan!");

      // Set transaction untuk print
      setLastTransaction(transaction);

      // Potong stok via context (Inventory Decoupling)
      checkout(cart, transaction);

      // Delay untuk state update selesai, lalu print
      setTimeout(() => {
        printThermalReceipt(transaction);

        // Reset form setelah print
        setTimeout(() => {
          setCart([]);
          setCustomerName("");
          setPaymentMethod("cash");
          setPurchaseMethod("offline");
          setOnlinePlatform("shopee");
          setOfflineType("dine-in");
          setLastTransaction(null);
        }, 500);
      }, 100);
    });
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt,
            #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-width: 800px;
              height: auto;
            }
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          #printable-receipt {
            display: none;
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-blue-700" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">
                  Point of Sales (POS)
                </h1>
                <p className="text-gray-600">Mencatat transaksi penjualan</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">
                  Pilih Produk
                </h2>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Paradose - Coffee
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {products
                      .filter((p) => p.brand === "Paradose")
                      .map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          disabled={!isProductAvailable(product.id)}
                          className={`border-2 rounded-lg p-4 text-left transition-colors ${
                            isProductAvailable(product.id)
                              ? "bg-amber-50 hover:bg-amber-100 border-amber-200"
                              : "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-amber-700 font-semibold mt-1">
                            Rp {product.price.toLocaleString("id-ID")}
                          </div>
                          {!isProductAvailable(product.id) && (
                            <div className="text-xs text-red-500 mt-1 font-bold">
                              Stok Habis
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Parasoes - Choux Pastry
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {products
                      .filter((p) => p.brand === "Parasoes")
                      .map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          disabled={!isProductAvailable(product.id)}
                          className={`border-2 rounded-lg p-4 text-left transition-colors ${
                            isProductAvailable(product.id)
                              ? "bg-orange-50 hover:bg-orange-100 border-orange-200"
                              : "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-orange-700 font-semibold mt-1">
                            Rp {product.price.toLocaleString("id-ID")}
                          </div>
                          {!isProductAvailable(product.id) && (
                            <div className="text-xs text-red-500 mt-1 font-bold">
                              Stok Habis
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-gray-700" />
                  <h2 className="font-semibold text-gray-900">Keranjang</h2>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Keranjang kosong</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.brand}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="font-semibold text-gray-900">
                            Rp{" "}
                            {(item.price * item.quantity).toLocaleString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4 space-y-2 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>PPN (10%):</span>
                    <span>Rp {tax.toLocaleString("id-ID")}</span>
                  </div>
                  {commission > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>
                        Komisi Platform ({(platformCommission * 100).toFixed(0)}
                        %):
                      </span>
                      <span>-Rp {commission.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  {commission > 0 && (
                    <div className="flex justify-between font-medium text-green-600 text-sm">
                      <span>Net (setelah komisi):</span>
                      <span>Rp {netTotal.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Pelanggan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama pelanggan"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metode Pembelian
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setPurchaseMethod("offline")}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          purchaseMethod === "offline"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Offline
                      </button>
                      <button
                        onClick={() => setPurchaseMethod("online")}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          purchaseMethod === "online"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Online
                      </button>
                    </div>

                    {purchaseMethod === "online" ? (
                      <select
                        value={onlinePlatform}
                        onChange={(e) => setOnlinePlatform(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="shopee">ShopeeFood (10% komisi)</option>
                        <option value="gofood">GoFood (15% komisi)</option>
                        <option value="grabfood">GrabFood (15% komisi)</option>
                      </select>
                    ) : (
                      <select
                        value={offlineType}
                        onChange={(e) => setOfflineType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="dine-in">Dine In</option>
                        <option value="take-away">Take Away</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Tunai</option>
                      <option value="debit">Kartu Debit</option>
                      <option value="qris">QRIS</option>
                      <option value="transfer">Transfer Bank</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isPrinting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  {isPrinting ? "Mencetak..." : "Proses & Cetak Struk"}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Terhubung dengan Printer Thermal C-58XS
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Hidden Print Receipt */}
      {lastTransaction && (
        <div id="printable-receipt" className="hidden print:block">
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              padding: "40px 20px",
              fontFamily: "Arial, sans-serif",
              backgroundColor: "#fff",
              color: "#333",
            }}
          >
            {/* Header */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "30px",
                borderBottom: "2px solid #1f2937",
                paddingBottom: "20px",
              }}
            >
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  margin: "0 0 5px 0",
                  color: "#1f2937",
                }}
              >
                PARADOSE & PARASOES UMKM
              </h1>
              <p
                style={{ margin: "5px 0", fontSize: "12px", color: "#6b7280" }}
              >
                Kopi Spesial & Pastry Choux Premium
              </p>
              <p
                style={{ margin: "5px 0", fontSize: "11px", color: "#9ca3af" }}
              >
                Jl. Kopi No. 123, Jakarta | Phone: 08XX-XXXX-XXXX
              </p>
            </div>

            {/* Invoice Title & Number */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "25px",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    margin: "0",
                    color: "#1f2937",
                  }}
                >
                  INVOICE / STRUK PENJUALAN
                </h2>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px" }}>
                <p style={{ margin: "3px 0", fontWeight: "bold" }}>
                  Invoice No: {lastTransaction.id}
                </p>
                <p style={{ margin: "3px 0" }}>
                  Tanggal:{" "}
                  {new Date(lastTransaction.date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
                <p style={{ margin: "3px 0" }}>
                  Waktu:{" "}
                  {new Date(lastTransaction.date).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div
              style={{
                marginBottom: "25px",
                padding: "12px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 5px 0",
                      fontWeight: "bold",
                      color: "#374151",
                    }}
                  >
                    Pelanggan:
                  </p>
                  <p style={{ margin: "0", color: "#6b7280" }}>
                    {lastTransaction.customerName !== "Walk-in Customer"
                      ? lastTransaction.customerName
                      : "Walk-in Customer"}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 5px 0",
                      fontWeight: "bold",
                      color: "#374151",
                    }}
                  >
                    Metode Pembelian:
                  </p>
                  <p style={{ margin: "0", color: "#6b7280" }}>
                    {lastTransaction.purchaseMethodLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: "25px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#1f2937", color: "#fff" }}>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        fontWeight: "bold",
                      }}
                    >
                      Produk
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "70px",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        fontWeight: "bold",
                        width: "100px",
                      }}
                    >
                      Harga
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        fontWeight: "bold",
                        width: "120px",
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lastTransaction.items.map(
                    (item: CartItem, index: number) => (
                      <tr
                        key={index}
                        style={{ borderBottom: "1px solid #e5e7eb" }}
                      >
                        <td style={{ padding: "10px", textAlign: "left" }}>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {item.name}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#9ca3af",
                              marginTop: "2px",
                            }}
                          >
                            {item.brand}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            color: "#374151",
                          }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            textAlign: "right",
                            color: "#374151",
                          }}
                        >
                          Rp {item.price.toLocaleString("id-ID")}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            textAlign: "right",
                            fontWeight: "500",
                            color: "#1f2937",
                          }}
                        >
                          Rp{" "}
                          {(item.price * item.quantity).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Divider */}
            <div
              style={{
                borderTop: "2px solid #1f2937",
                borderBottom: "1px solid #e5e7eb",
                margin: "20px 0",
              }}
            ></div>

            {/* Summary */}
            <div
              style={{
                marginBottom: "25px",
                fontSize: "12px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div style={{ width: "300px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span>Subtotal:</span>
                  <span>
                    Rp {lastTransaction.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span>PPN (10%):</span>
                  <span>Rp {lastTransaction.tax.toLocaleString("id-ID")}</span>
                </div>
                {lastTransaction.commission > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      color: "#dc2626",
                    }}
                  >
                    <span>Komisi Platform:</span>
                    <span>
                      -Rp {lastTransaction.commission.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "2px solid #e5e7eb",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  <span>TOTAL:</span>
                  <span>
                    Rp {lastTransaction.total.toLocaleString("id-ID")}
                  </span>
                </div>
                {lastTransaction.commission > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "#059669",
                      fontWeight: "500",
                    }}
                  >
                    <span>Net (setelah komisi):</span>
                    <span>
                      Rp {lastTransaction.netTotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div
              style={{
                marginBottom: "25px",
                padding: "12px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 5px 0",
                      fontWeight: "bold",
                      color: "#065f46",
                    }}
                  >
                    Metode Pembayaran:
                  </p>
                  <p style={{ margin: "0", color: "#047857" }}>
                    <strong>{lastTransaction.paymentMethodLabel}</strong>
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 5px 0",
                      fontWeight: "bold",
                      color: "#065f46",
                    }}
                  >
                    Jumlah Transaksi:
                  </p>
                  <p style={{ margin: "0", color: "#047857" }}>
                    <strong>{lastTransaction.items.length} Item</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                textAlign: "center",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "20px",
                fontSize: "11px",
                color: "#6b7280",
              }}
            >
              <p
                style={{
                  margin: "5px 0",
                  fontWeight: "bold",
                  fontSize: "13px",
                  color: "#1f2937",
                }}
              >
                Terima kasih atas kunjungan Anda!
              </p>
              <p style={{ margin: "5px 0" }}>
                Kami menghargai setiap pembelian Anda
              </p>
              <p style={{ margin: "5px 0", fontStyle: "italic" }}>
                Sampai jumpa kembali 😊
              </p>
              <p
                style={{
                  margin: "15px 0 0 0",
                  fontSize: "10px",
                  color: "#9ca3af",
                }}
              >
                Dicetak: {new Date().toLocaleString("id-ID")} | Sistem POS v1.0
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
