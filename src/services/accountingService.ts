import { Invoice, Expense, UserProfile, Client, Supplier } from '../types';
import { Decimal } from 'decimal.js';

export interface AccountingEntry {
  id: string;
  date: string;
  journal: 'VT' | 'AC' | 'BQ' | 'OD';
  journalLib: string;
  compteNum: string;
  compteLib: string;
  compteAuxNum?: string;
  compteAuxLib?: string;
  debit: Decimal;
  credit: Decimal;
  libelle: string;
  reference: string;
  lettrage?: string;
}

/**
 * Service de génération d'écritures comptables aux normes françaises (Comptabilité Double Entrée)
 */
export const generateJournalEntries = (
  invoices: Invoice[],
  expenses: Expense[],
  userProfile: UserProfile,
  clients: Client[],
  suppliers: Supplier[] = []
): AccountingEntry[] => {
  const entries: AccountingEntry[] = [];

  // 1. GÉNÉRATION DU JOURNAL DES VENTES (VT)
  invoices
    .filter((inv) => inv.type === 'invoice' || inv.type === 'credit_note')
    .forEach((inv) => {
      const client = clients.find((c) => c.id === inv.clientId);
      const clientName = client?.name || 'Client Divers';
      const isCreditNote = inv.type === 'credit_note';
      const subtotal = new Decimal(inv.subtotal || inv.total || 0);
      const taxAmount = new Decimal(inv.taxAmount || 0);
      const total = new Decimal(inv.total || 0);

      // Ligne Client (411000)
      entries.push({
        id: `${inv.id}-411`,
        date: inv.date,
        journal: 'VT',
        journalLib: 'Journal des Ventes',
        compteNum: '411000',
        compteLib: 'Clients',
        compteAuxNum: client?.id?.slice(0, 8).toUpperCase(),
        compteAuxLib: clientName,
        debit: isCreditNote ? new Decimal(0) : total,
        credit: isCreditNote ? total : new Decimal(0),
        libelle: `${isCreditNote ? 'Avoir' : 'Facture'} ${inv.number} - ${clientName}`,
        reference: inv.number,
      });

      // Ligne Revenu (706/707)
      const revenueCompte = userProfile.activityType === 'sales' ? '707000' : '706000';
      const revenueLib =
        userProfile.activityType === 'sales' ? 'Ventes de marchandises' : 'Prestations de services';

      entries.push({
        id: `${inv.id}-70x`,
        date: inv.date,
        journal: 'VT',
        journalLib: 'Journal des Ventes',
        compteNum: revenueCompte,
        compteLib: revenueLib,
        debit: isCreditNote ? subtotal : new Decimal(0),
        credit: isCreditNote ? new Decimal(0) : subtotal,
        libelle: `${isCreditNote ? 'Avoir' : 'Facture'} ${inv.number} - ${clientName}`,
        reference: inv.number,
      });

      // Ligne TVA Collectée (445710) - Uniquement si assujetti
      if (!userProfile.isVatExempt && taxAmount.gt(0)) {
        entries.push({
          id: `${inv.id}-4457`,
          date: inv.date,
          journal: 'VT',
          journalLib: 'Journal des Ventes',
          compteNum: '445710',
          compteLib: 'TVA Collectée (20%)',
          debit: isCreditNote ? taxAmount : new Decimal(0),
          credit: isCreditNote ? new Decimal(0) : taxAmount,
          libelle: `TVA sur ${inv.number}`,
          reference: inv.number,
        });
      }

      // 2. GÉNÉRATION DU JOURNAL DE BANQUE (BQ) POUR LES FACTURES PAYÉES
      if (inv.status === 'paid') {
        const payDate = inv.updatedAt?.split('T')[0] || inv.date;

        // Ligne Banque (512000)
        entries.push({
          id: `${inv.id}-512-pay`,
          date: payDate,
          journal: 'BQ',
          journalLib: 'Journal de Banque',
          compteNum: '512000',
          compteLib: 'Banque',
          debit: total,
          credit: new Decimal(0),
          libelle: `Règlement Client ${clientName} - ${inv.number}`,
          reference: inv.number,
          lettrage: inv.number.split('-').pop(),
        });

        // Ligne Lettrage Client (411000)
        entries.push({
          id: `${inv.id}-411-pay`,
          date: payDate,
          journal: 'BQ',
          journalLib: 'Journal de Banque',
          compteNum: '411000',
          compteLib: 'Clients',
          debit: new Decimal(0),
          credit: total,
          libelle: `Paiement reçu - Lettrage ${inv.number}`,
          reference: inv.number,
          lettrage: inv.number.split('-').pop(),
        });
      }
    });

  // 3. GÉNÉRATION DU JOURNAL DES ACHATS (AC)
  expenses.forEach((exp) => {
    const total = new Decimal(exp.amount);
    const vat = new Decimal(exp.vatAmount || 0);
    const ht = total.minus(vat);
    const isCancelled = exp.status === 'cancelled';

    // Compte Charge par défaut ou selon catégorie
    let chargeCompte = '606000'; // Achats non stockés
    let chargeLib = 'Achats divers';

    switch (exp.category) {
      case 'Services':
        chargeCompte = '651000';
        chargeLib = 'Redevances Logiciels / SaaS';
        break;
      case 'Restaurant':
        chargeCompte = '625700';
        chargeLib = 'Réceptions / Frais de repas';
        break;
      case 'Deplacements':
        chargeCompte = '625100';
        chargeLib = 'Voyages et déplacements';
        break;
      case 'Loyer':
        chargeCompte = '613000';
        chargeLib = 'Locations';
        break;
    }

    // Ligne Charge (6x)
    entries.push({
      id: `${exp.id}-6x`,
      date: exp.date,
      journal: 'AC',
      journalLib: 'Journal des Achats',
      compteNum: chargeCompte,
      compteLib: chargeLib,
      debit: isCancelled ? new Decimal(0) : ht,
      credit: isCancelled ? ht : new Decimal(0),
      libelle: `${isCancelled ? '[ANNULÉ] ' : ''}${exp.description}`,
      reference: exp.id.slice(0, 8),
    });

    // Ligne TVA Déductible (445660)
    if (vat.gt(0)) {
      entries.push({
        id: `${exp.id}-4456`,
        date: exp.date,
        journal: 'AC',
        journalLib: 'Journal des Achats',
        compteNum: '445660',
        compteLib: 'TVA Déductible sur ABS',
        debit: isCancelled ? new Decimal(0) : vat,
        credit: isCancelled ? vat : new Decimal(0),
        libelle: `TVA sur ${exp.description}`,
        reference: exp.id.slice(0, 8),
      });
    }

    // Ligne Fournisseur (401000)
    const supplier = suppliers.find((s) => s.id === exp.supplierId);
    const supplierName = supplier?.name || 'Fournisseur Divers';

    entries.push({
      id: `${exp.id}-401`,
      date: exp.date,
      journal: 'AC',
      journalLib: 'Journal des Achats',
      compteNum: '401000',
      compteLib: 'Fournisseurs',
      compteAuxNum: supplier?.id?.slice(0, 8).toUpperCase(),
      compteAuxLib: supplierName,
      debit: isCancelled ? total : new Decimal(0),
      credit: isCancelled ? new Decimal(0) : total,
      libelle: `Fct / Note : ${exp.description}`,
      reference: exp.id.slice(0, 8),
    });

    // 4. GÉNÉRATION AUTOMATIQUE DU DÉCAISSEMENT (BQ) pour les dépenses validées
    if (!isCancelled) {
      entries.push({
        id: `${exp.id}-512-out`,
        date: exp.date,
        journal: 'BQ',
        journalLib: 'Journal de Banque',
        compteNum: '512000',
        compteLib: 'Banque',
        debit: new Decimal(0),
        credit: total,
        libelle: `Paiement Fournisseur : ${exp.description}`,
        reference: exp.id.slice(0, 8),
      });

      entries.push({
        id: `${exp.id}-401-clear`,
        date: exp.date,
        journal: 'BQ',
        journalLib: 'Journal de Banque',
        compteNum: '401000',
        compteLib: 'Fournisseurs',
        compteAuxNum: supplier?.id?.slice(0, 8).toUpperCase(),
        compteAuxLib: supplierName,
        debit: total,
        credit: new Decimal(0),
        libelle: `Règlement de la dépense ${exp.id.slice(0, 8)}`,
        reference: exp.id.slice(0, 8),
      });
    }
  });

  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
