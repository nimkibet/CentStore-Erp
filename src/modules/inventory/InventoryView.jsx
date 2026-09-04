import React, { useEffect, useState } from 'react';
import { Package, Building2, Factory, FileText } from 'lucide-react';
import LowStockBanner from './LowStockBanner';
import CatalogView from './CatalogView';
import WarehouseView from './WarehouseView';
import VendorView from './VendorView';
import POView from './POView';
import AddProductModal from './AddProductModal';

export default function InventoryView({ token, userRole }) {
  const [activeSubTab, setActiveSubTab] = useState('catalog');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [selectedVendorForPO, setSelectedVendorForPO] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/erp/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = products.filter(p => {
    const stock = p.stock !== undefined ? p.stock : 10;
    const reorderPoint = p.reorderPoint || 5;
    return stock <= reorderPoint;
  });

  const handleOpenPOWithVendor = (vendorId) => {
    setSelectedVendorForPO(vendorId);
    setActiveSubTab('purchase-orders');
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Supply Chain & Inventory (SCM)
          </h1>
          <p className="text-sm text-slate-500">
            Multi-warehouse stock tracking, vendor supplier management, and Purchase Orders.
          </p>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      <LowStockBanner
        token={token}
        lowStockCount={lowStockItems.length}
        onAutoTriggerSuccess={fetchProducts}
        onOpenPOModal={() => setActiveSubTab('purchase-orders')}
      />

      {/* Sub-Navigation Bar */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8" aria-label="SCM Module Navigation">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`pb-4 px-1 inline-flex items-center space-x-2 text-sm font-medium border-b-2 transition ${
              activeSubTab === 'catalog'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catalog & Stock</span>
          </button>

          <button
            onClick={() => setActiveSubTab('warehouses')}
            className={`pb-4 px-1 inline-flex items-center space-x-2 text-sm font-medium border-b-2 transition ${
              activeSubTab === 'warehouses'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Multi-Warehouse</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vendors')}
            className={`pb-4 px-1 inline-flex items-center space-x-2 text-sm font-medium border-b-2 transition ${
              activeSubTab === 'vendors'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>Vendor Directory</span>
          </button>

          <button
            onClick={() => setActiveSubTab('purchase-orders')}
            className={`pb-4 px-1 inline-flex items-center space-x-2 text-sm font-medium border-b-2 transition ${
              activeSubTab === 'purchase-orders'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Purchase Orders</span>
          </button>
        </nav>
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeSubTab === 'catalog' && (
          <CatalogView
            token={token}
            userRole={userRole}
            products={products}
            loading={loading}
            fetchProducts={fetchProducts}
            onOpenAddProductModal={() => setIsAddProductModalOpen(true)}
          />
        )}

        {activeSubTab === 'warehouses' && (
          <WarehouseView
            token={token}
            userRole={userRole}
          />
        )}

        {activeSubTab === 'vendors' && (
          <VendorView
            token={token}
            userRole={userRole}
            onOpenPOModalWithVendor={handleOpenPOWithVendor}
          />
        )}

        {activeSubTab === 'purchase-orders' && (
          <POView
            token={token}
            userRole={userRole}
            initialVendorId={selectedVendorForPO}
            onStockUpdated={fetchProducts}
          />
        )}
      </div>

      {/* Add Product Modal for Catalog */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onProductAdded={fetchProducts}
        token={token}
      />
    </div>
  );
}
