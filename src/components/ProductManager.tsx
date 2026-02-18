import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Trash2,
  Package,
  Briefcase,
  Edit2,
  Download,
  SortAsc,
  LayoutGrid,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Tag,
  Info,
  Eye,
} from 'lucide-react';
import Header from './ui/Header';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Card from './ui/Card';
import Modal from './ui/Modal';
import ConfirmDialog from './ui/ConfirmDialog';
import EmptyState from './ui/EmptyState';
import { useProducts } from '../hooks/useData';
import { db } from '../services/db';
import { validateProduct } from '../services/validationService';

type SortOption = 'name' | 'price' | 'type';

const ProductManager: React.FC = () => {
  const products = useProducts();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const stats = useMemo(() => {
    const productsList = products.filter((p) => p.type === 'product');
    const servicesList = products.filter((p) => p.type === 'service');
    const totalValue = productsList.reduce((acc, p) => acc + p.price * (p.stock || 0), 0);
    const lowStockCount = productsList.filter((p) => (p.stock || 0) <= 5).length;

    return {
      total: products.length,
      productsCount: productsList.length,
      servicesCount: servicesList.length,
      value: totalValue,
      lowStock: lowStockCount,
    };
  }, [products]);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    brand: '',
    shortDescription: '',
    description: '',
    price: 0,
    taxRate: 20,
    ecoParticipation: 0,
    repairabilityIndex: undefined,
    legalWarranty: '2 ans',
    origin: 'France',
    unit: 'unité',
    type: 'service',
    taxCategory: 'SERVICE_BIC',
    stock: 0,
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      brand: '',
      shortDescription: '',
      description: '',
      price: 0,
      taxRate: 20,
      ecoParticipation: 0,
      repairabilityIndex: undefined,
      legalWarranty: '2 ans',
      origin: 'France',
      unit: 'unité',
      type: 'service',
      taxCategory: 'SERVICE_BIC',
      stock: 0,
    });
    setIsPanelOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({ ...product });
    setIsPanelOpen(true);
  };

  const openDetail = (product: Product) => {
    setViewingProduct(product);
    setIsDetailOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('❌ Le nom du produit est requis');
      return;
    }

    try {
      const product: Product = {
        id: editingId || Date.now().toString(),
        name: formData.name,
        sku: formData.sku,
        brand: formData.brand,
        shortDescription: formData.shortDescription,
        description: formData.description || '',
        price: Number(formData.price) || 0,
        taxRate: Number(formData.taxRate) || 20,
        ecoParticipation: formData.ecoParticipation,
        repairabilityIndex: formData.repairabilityIndex,
        legalWarranty: formData.legalWarranty || '2 ans',
        origin: formData.origin || 'France',
        unit: formData.unit || 'unité',
        type: formData.type as 'service' | 'product',
        taxCategory: formData.taxCategory || 'SERVICE_BIC',
        stock: formData.type === 'product' ? Number(formData.stock) || 0 : undefined,
      };

      // 🛡️ Valider le produit avant sauvegarde
      const validationResult = await validateProduct(product, product.id);
      if (!validationResult.valid) {
        const errors = validationResult.errors
          .slice(0, 3)
          .map((e) => e.message)
          .join(', ');
        toast.error(`❌ Erreur validation: ${errors}`);
        return;
      }

      if (editingId) {
        await db.products.update(editingId, product);
        toast.success('✅ Produit mis à jour avec succès');
      } else {
        await db.products.add(product);
        toast.success('✅ Produit créé avec succès');
      }
      setIsPanelOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`💥 Erreur lors de la sauvegarde: ${message}`);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await db.products.delete(deleteId);
        const productName = products.find((p) => p.id === deleteId)?.name || 'Produit';
        toast.success(`✅ ${productName} supprimé avec succès`);
        setDeleteId(null);
        setIsConfirmOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error(`❌ Erreur suppression: ${message}`);
      }
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const exportCSV = () => {
    const headers = [
      'Nom',
      'SKU',
      'Marque',
      'Type',
      'Prix HT',
      'TVA',
      'Éco-participation',
      'Unité',
      'Catégorie Fiscale',
      'Garantie',
      'Origine',
      'Description',
    ];
    const rows = products.map((p) =>
      [
        `"${p.name}"`,
        `"${p.sku || ''}"`,
        `"${p.brand || ''}"`,
        `"${p.type === 'service' ? 'Prestation' : 'Marchandise'}"`,
        p.price.toFixed(2),
        `${p.taxRate}%`,
        (p.ecoParticipation || 0).toFixed(2),
        `"${p.unit}"`,
        `"${p.taxCategory}"`,
        `"${p.legalWarranty}"`,
        `"${p.origin}"`,
        `"${p.description.replace(/"/g, '""')}"`,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogue_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processedProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const result = products.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
    );

    return result.sort((a, b) => {
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return a.name.localeCompare(b.name);
    });
  }, [products, searchTerm, sortBy]);

  return (
    <div
      data-testid="products-container"
      className="space-y-12 animate-fade-in max-w-7xl mx-auto pb-20"
    >
      <Header
        title="Catalogue"
        description="Gérez vos prestations et produits avec suivi automatique du stock."
        icon={LayoutGrid}
        actions={
          <div className="flex gap-4">
            <Button variant="outline" onClick={exportCSV} icon={Download} className="rounded-2xl">
              Exporter
            </Button>
            <Button
              onClick={openCreate}
              icon={Plus}
              className="rounded-2xl shadow-lg shadow-blue-200"
            >
              Ajouter
            </Button>
          </div>
        }
      />

      {/* Statistiques du Catalogue */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        data-testid="product-stats"
      >
        <Card className="p-8 border-none bg-white shadow-soft rounded-[2.5rem] flex flex-col justify-between group hover:shadow-premium transition-all duration-500">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
            <LayoutGrid size={24} />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Total
            </p>
            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
          </div>
        </Card>

        <Card className="p-8 border-none bg-white shadow-soft rounded-[2.5rem] flex flex-col justify-between group hover:shadow-premium transition-all duration-500">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
            <Briefcase size={24} />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Prestations
            </p>
            <p className="text-3xl font-black text-slate-900">{stats.servicesCount}</p>
          </div>
        </Card>

        <Card className="p-8 border-none bg-white shadow-soft rounded-[2.5rem] flex flex-col justify-between group hover:shadow-premium transition-all duration-500">
          <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-500 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500">
            <Package size={24} />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Marchandises
            </p>
            <p className="text-3xl font-black text-slate-900">{stats.productsCount}</p>
          </div>
        </Card>

        <Card className="p-8 border-none bg-white shadow-soft rounded-[2.5rem] flex flex-col justify-between group hover:shadow-premium transition-all duration-500">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
            <ArrowUpRight size={24} />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Valeur Stock
            </p>
            <p className="text-3xl font-black text-slate-900">
              {stats.value.toLocaleString('fr-FR')} €
            </p>
          </div>
        </Card>

        <Card className="p-8 border-none bg-white shadow-soft rounded-[2.5rem] flex flex-col justify-between group hover:shadow-premium transition-all duration-500">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
            <Tag size={24} />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Stock Faible
            </p>
            <p
              className={`text-3xl font-black ${stats.lowStock > 0 ? 'text-rose-600' : 'text-slate-900'}`}
            >
              {stats.lowStock}
            </p>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={editingId ? "Modifier l'élément" : 'Nouvel élément'}
        description="Saisissez les informations de votre catalogue."
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setIsPanelOpen(false)}>
              Annuler
            </Button>
            <Button className="flex-1 p-4" onClick={handleSubmit}>
              {editingId ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4 max-h-[70vh] overflow-y-auto px-2">
          {/* Section A: Informations Commerciales */}
          <div className="space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Tag size={16} /> Informations Commerciales
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Nom du produit / service
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: SouverainBox v2 - Serveur Privé"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  SKU / Référence
                </label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: SBX-2026-BLK"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Marque
                </label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ex: Eco-Tech France"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Type
                </label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer font-medium"
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value as 'service' | 'product';
                    setFormData({
                      ...formData,
                      type,
                      taxCategory: type === 'product' ? 'MARCHANDISE' : 'SERVICE_BIC',
                      stock: type === 'product' ? formData.stock || 0 : undefined,
                    });
                  }}
                >
                  <option value="service" className="p-2">
                    Prestation
                  </option>
                  <option value="product" className="p-2">
                    Marchandise
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Catégorie Micro
                </label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer font-medium"
                  value={formData.taxCategory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxCategory: e.target.value as Product['taxCategory'],
                    })
                  }
                >
                  <option value="MARCHANDISE">Vente marchandises (BIC)</option>
                  <option value="SERVICE_BIC">Service BIC (Artisan/Com.)</option>
                  <option value="SERVICE_BNC">Service BNC (Libéral)</option>
                </select>
              </div>

              <div className="space-y-2 text-blue-600">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1">
                  Prix Unitaire HT (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-4 bg-blue-50/30 border-2 border-blue-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-900"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Taux TVA (%)
                </label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer font-medium"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })
                  }
                >
                  <option value="0">0% (Franchise)</option>
                  <option value="5.5">5.5%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Unité de vente
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ex: unité, jour, h"
                />
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                  Prix TTC Estimé
                </p>
                <p className="text-2xl font-black text-emerald-700">
                  {((formData.price || 0) * (1 + (formData.taxRate || 0) / 100)).toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          {/* Section B: Descriptifs */}
          <div className="space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Info size={16} /> Descriptifs
            </h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Accroche (Short Description)
                </label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Une phrase percutante pour vos documents..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Description détaillée (Markdown supporté)
                </label>
                <textarea
                  rows={6}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-600 font-medium resize-none leading-relaxed"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Caractéristiques techniques, guide..."
                />
              </div>
            </div>
          </div>

          {/* Section C: Champs Obligatoires & Légaux */}
          <div className="space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={16} /> Spécificités Françaises & Stock
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Éco-participation (€ TTC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                  value={formData.ecoParticipation}
                  onChange={(e) =>
                    setFormData({ ...formData, ecoParticipation: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Indice de réparabilité (/10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                  value={formData.repairabilityIndex}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      repairabilityIndex: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="Ex: 8.5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Garantie Légale
                </label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                  value={formData.legalWarranty}
                  onChange={(e) => setFormData({ ...formData, legalWarranty: e.target.value })}
                  placeholder="Ex: 2 ans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Globe size={12} /> Origine
                </label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="Ex: France"
                />
              </div>

              {formData.type === 'product' && (
                <div className="md:col-span-2 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
                  <label className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                    <Package size={16} /> Gestion du Stock
                  </label>
                  <input
                    type="number"
                    className="w-full p-4 bg-white border-2 border-blue-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-black text-blue-900"
                    value={formData.stock || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-[10px] text-blue-600/70 font-medium">
                    Ce stock sera automatiquement décompté lors de l&apos;envoi d&apos;une facture.
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Fiche Produit"
        description="Détails complets du catalogue au standard français."
        footer={
          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsDetailOpen(false);
                if (viewingProduct) openEdit(viewingProduct);
              }}
              icon={Edit2}
            >
              Modifier
            </Button>
            <Button className="flex-1" onClick={() => setIsDetailOpen(false)}>
              Fermer
            </Button>
          </div>
        }
      >
        {viewingProduct && (
          <div className="space-y-10 py-6 max-h-[70vh] overflow-y-auto px-4">
            {/* A. Informations Commerciales */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <Tag className="text-blue-500" size={20} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                  Informations Commerciales
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Nom du produit
                  </p>
                  <p className="text-2xl font-black text-slate-900">{viewingProduct.name}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    SKU / Référence
                  </p>
                  <p className="text-sm font-bold text-slate-700">{viewingProduct.sku || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Marque
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {viewingProduct.brand || 'N/A'}
                  </p>
                </div>

                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500 uppercase">Prix HT</span>
                    <span className="text-slate-900">{viewingProduct.price.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500 uppercase">
                      TVA ({viewingProduct.taxRate}%)
                    </span>
                    <span className="text-slate-900">
                      {(viewingProduct.price * (viewingProduct.taxRate / 100)).toFixed(2)} €
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Prix TTC
                    </span>
                    <span className="text-2xl font-black text-blue-600">
                      {(viewingProduct.price * (1 + viewingProduct.taxRate / 100)).toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={viewingProduct.type === 'service' ? 'blue' : 'violet'}>
                      {viewingProduct.type === 'service' ? 'Prestation' : 'Marchandise'}
                    </Badge>
                    {viewingProduct.type === 'product' && (
                      <Badge variant={(viewingProduct.stock || 0) <= 5 ? 'red' : 'emerald'} dot>
                        Stock: {viewingProduct.stock}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 italic">
                    {viewingProduct.type === 'product'
                      ? 'Disponibilité : En stock (Affichage dynamique)'
                      : 'Disponibilité : Immédiate'}
                  </p>
                </div>
              </div>
            </div>

            {/* B. Descriptifs */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <Info className="text-amber-500" size={20} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                  Descriptifs
                </h3>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-amber-50/50 rounded-[2rem] border border-amber-100/50">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
                    Accroche
                  </p>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                    &quot;{viewingProduct.shortDescription || 'Aucune accroche définie.'}&quot;
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Description détaillée
                  </p>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    {viewingProduct.description || 'Aucune description détaillée.'}
                  </div>
                </div>
              </div>
            </div>

            {/* C. Champs Obligatoires & Légaux */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <ShieldCheck className="text-emerald-500" size={20} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                  Champs Légaux & Garanties
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-slate-50 border-none shadow-none flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Éco-participation
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {viewingProduct.ecoParticipation?.toFixed(2) || '0.00'} € TTC
                  </p>
                  <p className="text-[9px] text-slate-400 italic">
                    Obligatoire pour l&apos;électronique
                  </p>
                </Card>

                <Card className="p-6 bg-slate-50 border-none shadow-none flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Indice de réparabilité
                    </p>
                    {viewingProduct.repairabilityIndex && (
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          viewingProduct.repairabilityIndex >= 7
                            ? 'bg-emerald-100 text-emerald-600'
                            : viewingProduct.repairabilityIndex >= 4
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {viewingProduct.repairabilityIndex}/10
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {viewingProduct.repairabilityIndex
                      ? viewingProduct.repairabilityIndex.toFixed(1) + ' / 10'
                      : 'Non applicable'}
                  </p>
                </Card>

                <Card className="p-6 bg-slate-50 border-none shadow-none flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Fabrication / Origine
                  </p>
                  <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Globe size={18} className="text-blue-500" />
                    {viewingProduct.origin || 'France'}
                  </p>
                </Card>

                <Card className="p-6 bg-slate-50 border-none shadow-none flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Garantie Légale
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {viewingProduct.legalWarranty || '2 ans'}
                  </p>
                  <p className="text-[9px] text-slate-400 italic">Conformité fabricant</p>
                </Card>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer l'élément"
        message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
        confirmLabel="Supprimer"
      />

      <div className="space-y-10">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Rechercher par nom, description ou type..."
              className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[2.5rem] focus:outline-none focus:border-blue-500 shadow-soft transition-all text-slate-900 font-bold placeholder:text-slate-400 group-hover:border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 bg-white px-8 py-5 border-2 border-slate-100 rounded-[2.5rem] shadow-soft group hover:border-slate-200 transition-all">
            <div className="flex items-center gap-2 text-slate-400">
              <SortAsc size={20} />
              <span className="text-xs font-black uppercase tracking-widest hidden lg:inline">
                Trier par
              </span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-sm font-black text-slate-900 outline-none cursor-pointer appearance-none"
            >
              <option value="name">Alphabétique (A-Z)</option>
              <option value="price">Prix décroissant</option>
              <option value="type">Type d&apos;élément</option>
            </select>
          </div>
        </div>

        {/* List of items */}
        {processedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {processedProducts.map((p) => (
              <Card
                key={p.id}
                data-testid="product-card"
                className="p-8 border-none bg-white rounded-[3rem] shadow-soft hover:shadow-premium transition-all duration-500 group relative flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div
                    className={`
                      w-16 h-16 rounded-3xl flex items-center justify-center border transition-all duration-500
                      ${
                        p.type === 'service'
                          ? 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white'
                          : 'bg-violet-50 text-violet-600 border-violet-100 group-hover:bg-violet-600 group-hover:text-white'
                      }
                    `}
                  >
                    {p.type === 'service' ? <Briefcase size={28} /> : <Package size={28} />}
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <button
                      onClick={() => openDetail(p)}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      title="Voir"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge
                    variant={p.type === 'service' ? 'blue' : 'violet'}
                    className="px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-wider"
                  >
                    {p.type === 'service' ? 'Prestation' : 'Marchandise'}
                  </Badge>
                  {p.type === 'product' && (
                    <Badge
                      variant={(p.stock || 0) <= 5 ? 'red' : 'emerald'}
                      dot
                      className="px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-wider"
                    >
                      Stock: {p.stock}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 flex-grow">
                  <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {p.name}
                  </h4>
                  <p className="text-sm font-medium text-slate-400 line-clamp-2 leading-relaxed italic">
                    {p.shortDescription || p.description || 'Aucune description...'}
                  </p>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Prix Unit. HT
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 tracking-tighter">
                        {p.price.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                        €
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500 transform">
                    <ArrowUpRight size={24} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            data-testid="products-empty-state"
            icon={Package}
            title="Catalogue vide"
            description="Organisez vos services et produits pour gagner du temps lors de la création de vos factures. Tout ce que vous vendez commence ici."
            actionLabel="Ajouter un élément"
            onAction={openCreate}
          />
        )}
      </div>
    </div>
  );
};

export default ProductManager;
