import { Invoice, UserProfile, InvoiceItem, Client } from '../types';
import { Decimal } from 'decimal.js';

// Thresholds 2024-2026 (Franchise en base de TVA)
export const VAT_THRESHOLDS = {
  SERVICES: {
    BASE: 36800,
    LIMIT: 39100,
  },
  SALES: {
    BASE: 91900,
    LIMIT: 101000,
  },
};

// CA Thresholds (Micro-entrepreneur limits 2023-2025/2026)
export const CA_THRESHOLDS = {
  SERVICES: 77700,
  SALES: 188700,
};

// URSSAF Rates (2025/2026 approximation)
/**
 * Taux de cotisations URSSAF pour micro-entrepreneurs
 * Références légales : Code de la Sécurité Sociale L.131-6-1 et suivants
 * Mise à jour : 2026
 *
 * @see https://www.urssaf.fr/portail/home/taux-et-baremes.html
 */
export const URSSAF_RATES = {
  SERVICES: 0.212, // BIC Services / Professions libérales : 21,2%
  SALES: 0.123, // Achat-revente / Fournitures : 12,3%
  BNC_LIBERAL: 0.231, // Professions libérales (CIPAV) : 23,1%
  CFP_SERVICES: 0.002, // Contribution Formation Professionnelle Services : 0,2%
  CFP_SALES: 0.001, // Contribution Formation Professionnelle Ventes : 0,1%
  VERSEMEMENT_LIBERATOIRE_SALES: 0.01, // Option VL Ventes (acompte IR) : 1,0%
  VERSEMEMENT_LIBERATOIRE_SERVICES: 0.017, // Option VL Services : 1,7%
  VERSEMEMENT_LIBERATOIRE_BNC: 0.022, // Option VL BNC : 2,2%
};

/**
 * Calcule les cotisations URSSAF sur la base des chiffres d'affaires déclarés
 *
 * Logique :
 * 1. Filtre les factures payées (seules applicables pour la cotisation)
 * 2. Sépare les ventes (marchandises) des services (BIC/BNC)
 * 3. Applique les taux de cotisations + ACCRE si applicable
 * 4. Ajoute les options : Versement Libératoire (VL) et CFP
 * 5. Arrondit à l'entier inférieur (règle comptable)
 *
 * @param invoices - Liste des factures (statut et items)
 * @param userProfile - Profil utilisateur (ACCRE, VL, type d'activité)
 * @returns Objet avec cotisations détaillées, ventilation et chiffres d'affaires
 *
 * @example
 * ```typescript
 * const urssaf = calculateUrssaf(invoices, profile);
 * // {
 * //   sales: 150,           // Cotisations Achat-revente
 * //   services: 250,        // Cotisations BIC Services
 * //   total: 400,           // Total cotisations
 * //   breakdown: {
 * //     cotisations: 385,        // Cotisations sociales pures
 * //     versementLiberatoire: 15, // Option VL (acompte IR)
 * //     cfp: 2                    // Contribution Formation Professionnelle
 * //   },
 * //   turnover: {
 * //     sales: 1000,   // CA HT ventes
 * //     services: 2000, // CA HT services
 * //     total: 3000    // CA HT total
 * //   }
 * // }
 * ```
 */
export const calculateUrssaf = (invoices: Invoice[], userProfile: UserProfile) => {
  let totalSalesHT = new Decimal(0);
  let totalServicesHT = new Decimal(0);

  // Consider only 'paid' invoices for real CA, or others for prediction
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');

  paidInvoices.forEach((inv) => {
    inv.items.forEach((item: InvoiceItem) => {
      // Small adjustment: if the invoice has a global discount, we should apply it to items prorata
      // For simplicity here, we use the raw item amounts
      const qte = new Decimal(item.quantity || 0);
      const pu = new Decimal(item.unitPrice || 0);
      const disc = new Decimal(item.discount || 0);
      const amountHT = qte.times(pu).times(new Decimal(1).minus(disc.div(100)));

      if (item.category === 'MARCHANDISE') {
        totalSalesHT = totalSalesHT.plus(amountHT);
      } else {
        // PRESTATION_SERVICE_BIC or PRESTATION_SERVICE_BNC are grouped for this calculation
        // but could be split more accurately if needed
        totalServicesHT = totalServicesHT.plus(amountHT);
      }
    });

    // Apply global discount if any
    if (inv.discount && inv.discount > 0) {
      const globalFactor = new Decimal(1).minus(new Decimal(inv.discount).div(100));
      // This is an approximation as we don't know which category the discount applies to if mixed
      // We apply it proportionally to both
      totalSalesHT = totalSalesHT.times(globalFactor);
      totalServicesHT = totalServicesHT.times(globalFactor);
    }
  });

  // Base rates
  let rateSales = new Decimal(URSSAF_RATES.SALES);
  let rateServices = new Decimal(URSSAF_RATES.SERVICES);

  // ACCRE adjustment (usually 50% reduction in the first year)
  if (userProfile.hasAccre) {
    rateSales = rateSales.div(2);
    rateServices = rateServices.div(2);
  }

  // Versement Libératoire (Income Tax)
  const vlSales = userProfile.hasVersementLiberatoire
    ? totalSalesHT.times(URSSAF_RATES.VERSEMEMENT_LIBERATOIRE_SALES)
    : new Decimal(0);
  const vlServices = userProfile.hasVersementLiberatoire
    ? totalServicesHT.times(URSSAF_RATES.VERSEMEMENT_LIBERATOIRE_SERVICES)
    : new Decimal(0);

  // Formation Professionnelle
  const cfpSales = totalSalesHT.times(URSSAF_RATES.CFP_SALES);
  const cfpServices = totalServicesHT.times(URSSAF_RATES.CFP_SERVICES);

  const cotisationsSales = totalSalesHT.times(rateSales).plus(vlSales).plus(cfpSales);
  const cotisationsServices = totalServicesHT
    .times(rateServices)
    .plus(vlServices)
    .plus(cfpServices);

  return {
    sales: cotisationsSales.toDecimalPlaces(0).toNumber(),
    services: cotisationsServices.toDecimalPlaces(0).toNumber(),
    total: cotisationsSales.plus(cotisationsServices).toDecimalPlaces(0).toNumber(),
    breakdown: {
      cotisations: totalSalesHT
        .times(rateSales)
        .plus(totalServicesHT.times(rateServices))
        .toDecimalPlaces(0)
        .toNumber(),
      versementLiberatoire: vlSales.plus(vlServices).toDecimalPlaces(0).toNumber(),
      cfp: cfpSales.plus(cfpServices).toDecimalPlaces(0).toNumber(),
    },
    turnover: {
      sales: totalSalesHT.toDecimalPlaces(2).toNumber(),
      services: totalServicesHT.toDecimalPlaces(2).toNumber(),
      total: totalSalesHT.plus(totalServicesHT).toDecimalPlaces(2).toNumber(),
    },
  };
};

export const checkVatThreshold = (invoices: Invoice[]) => {
  const currentYear = new Date().getFullYear();
  const yearInvoices = invoices.filter(
    (inv) => inv.status === 'paid' && new Date(inv.date).getFullYear() === currentYear
  );

  let yearSales = new Decimal(0);
  let yearServices = new Decimal(0);

  yearInvoices.forEach((inv) => {
    inv.items.forEach((item: InvoiceItem) => {
      const amount = new Decimal(item.quantity || 0).times(new Decimal(item.unitPrice || 0));
      if (item.category === 'MARCHANDISE') {
        yearSales = yearSales.plus(amount);
      } else {
        yearServices = yearServices.plus(amount);
      }
    });
  });

  const salesStatus = {
    amount: yearSales.toNumber(),
    threshold: VAT_THRESHOLDS.SALES.BASE,
    limit: VAT_THRESHOLDS.SALES.LIMIT,
    isOverThreshold: yearSales.greaterThan(VAT_THRESHOLDS.SALES.BASE),
    isOverLimit: yearSales.greaterThan(VAT_THRESHOLDS.SALES.LIMIT),
    percent: yearSales.div(VAT_THRESHOLDS.SALES.BASE).times(100).toNumber(),
  };

  const servicesStatus = {
    amount: yearServices.toNumber(),
    threshold: VAT_THRESHOLDS.SERVICES.BASE,
    limit: VAT_THRESHOLDS.SERVICES.LIMIT,
    isOverThreshold: yearServices.greaterThan(VAT_THRESHOLDS.SERVICES.BASE),
    isOverLimit: yearServices.greaterThan(VAT_THRESHOLDS.SERVICES.LIMIT),
    percent: yearServices.div(VAT_THRESHOLDS.SERVICES.BASE).times(100).toNumber(),
  };

  return {
    sales: salesStatus,
    services: servicesStatus,
    shouldPayVat: salesStatus.isOverThreshold || servicesStatus.isOverThreshold,
  };
};

/**
 * Calcule la progression vers les plafonds de CA micro-entrepreneur
 */
export const checkCaThreshold = (invoices: Invoice[]) => {
  const currentYear = new Date().getFullYear();
  const yearInvoices = invoices.filter(
    (inv) => inv.status === 'paid' && new Date(inv.date).getFullYear() === currentYear
  );

  let yearSales = new Decimal(0);
  let yearServices = new Decimal(0);

  yearInvoices.forEach((inv) => {
    inv.items.forEach((item: InvoiceItem) => {
      const amount = new Decimal(item.quantity || 0).times(new Decimal(item.unitPrice || 0));
      if (item.category === 'MARCHANDISE') {
        yearSales = yearSales.plus(amount);
      } else {
        yearServices = yearServices.plus(amount);
      }
    });
  });

  const salesStatus = {
    amount: yearSales.toNumber(),
    threshold: CA_THRESHOLDS.SALES,
    isOverLimit: yearSales.greaterThan(CA_THRESHOLDS.SALES),
    percent: yearSales.div(CA_THRESHOLDS.SALES).times(100).toNumber(),
  };

  const servicesStatus = {
    amount: yearServices.toNumber(),
    threshold: CA_THRESHOLDS.SERVICES,
    isOverLimit: yearServices.greaterThan(CA_THRESHOLDS.SERVICES),
    percent: yearServices.div(CA_THRESHOLDS.SERVICES).times(100).toNumber(),
  };

  return {
    sales: salesStatus,
    services: servicesStatus,
    isOverLimit: salesStatus.isOverLimit || servicesStatus.isOverLimit,
  };
};

/**
 * Calcule la régularisation URSSAF (différence entre déclaration et réalité)
 *
 * Utilisée pour les ajustements en fin d'année fiscal
 *
 * @param actualTurnover - CA réel de l'année complète
 * @param declaredTurnover - CA déclaré aux trimestres/mois previous
 * @param userProfile - Profil de cotisations
 * @returns Montant à régulariser (positif = à verser, négatif = crédit)
 */
export const calculateUrssafAdjustment = (
  actualTurnover: number,
  declaredTurnover: number,
  userProfile: UserProfile
): { adjustment: number; original: number; final: number } => {
  const actual = calculateUrssaf(
    [
      {
        id: 'virtual',
        number: 'VIRTUAL-001',
        clientId: 'virtual',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        subtotal: actualTurnover,
        taxAmount: 0,
        total: actualTurnover,
        status: 'paid',
        items: [
          {
            id: '1',
            description: 'CA virtuel',
            quantity: 1,
            unit: 'h',
            unitPrice: actualTurnover,
            category: 'SERVICE_BIC',
            taxRate: 0,
            discount: 0,
            isSection: false,
          },
        ],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Invoice,
    ],
    userProfile
  );

  const declared = calculateUrssaf(
    [
      {
        id: 'virtual',
        number: 'VIRTUAL-001',
        clientId: 'virtual',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        subtotal: declaredTurnover,
        taxAmount: 0,
        total: declaredTurnover,
        status: 'paid',
        items: [
          {
            id: '1',
            description: 'CA déclaré',
            quantity: 1,
            unit: 'h',
            unitPrice: declaredTurnover,
            category: 'SERVICE_BIC',
            taxRate: 0,
            discount: 0,
            isSection: false,
          },
        ],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Invoice,
    ],
    userProfile
  );

  return {
    adjustment: actual.total - declared.total,
    original: declared.total,
    final: actual.total,
  };
};

/**
 * Calcule la prochaine échéance fiscale URSSAF
 *
 * Détermine la date limite de déclaration/paiement des cotisations
 * selon le régime de contribution (mensuel ou trimestriel)
 */
export const getNextUrssafDeadline = (userProfile: UserProfile) => {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const year = today.getFullYear();

  if (userProfile.contributionQuarter === 'monthly') {
    // Déclaration le 30 ou 31 du mois suivant pour le mois en cours
    // Ou si on est déjà après l'échéance du mois précédent...
    // Simplification : Prochaine échéance = fin du mois actuel
    const deadline = new Date(year, month + 1, 0); // Dernier jour du mois en cours
    return {
      date: deadline,
      period: today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      label: `Déclaration de ${today.toLocaleDateString('fr-FR', { month: 'long' })}`,
    };
  } else {
    // Trimestriel
    // Q1: Jan-Mar (due 30/04), Q2: Apr-Jun (due 31/07), Q3: Jul-Sep (due 31/10), Q4: Oct-Dec (due 31/01)
    let deadlineMonth;
    let period;
    if (month < 3) {
      deadlineMonth = 3; // Avril
      period = 'Q1 (Jan-Mar)';
    } else if (month < 6) {
      deadlineMonth = 6; // Juillet
      period = 'Q2 (Avr-Juin)';
    } else if (month < 9) {
      deadlineMonth = 9; // Octobre
      period = 'Q3 (Juil-Sep)';
    } else {
      deadlineMonth = 0; // Janvier (année suivante)
      period = 'Q4 (Oct-Déc)';
    }

    const deadlineYear = month >= 9 ? year + 1 : year;
    const deadlineDate = new Date(deadlineYear, deadlineMonth + 1, 0);

    return {
      date: deadlineDate,
      period,
      label: `Échéance ${period}`,
    };
  }
};

/**
 * Calcul du prochain numéro de facture séquentiel (Réforme 2026)
 */
export const getNextDocumentNumber = (
  invoices: Invoice[],
  type: string,
  userProfile: UserProfile
) => {
  const currentYear = new Date().getFullYear();
  const prefix =
    type === 'invoice'
      ? userProfile.invoicePrefix || 'FAC'
      : type === 'quote'
        ? userProfile.quotePrefix || 'DEV'
        : type === 'order'
          ? 'COM'
          : 'AVO';

  // On cherche le numéro le plus élevé pour l'année en cours
  const yearPattern = `${prefix}-${currentYear}-`;
  const yearInvoices = invoices.filter((i) => i.type === type && i.number.startsWith(yearPattern));

  let maxNumber = 0;
  yearInvoices.forEach((inv) => {
    const parts = inv.number.split('-');
    const numPart = parseInt(parts[parts.length - 1]);
    if (!isNaN(numPart) && numPart > maxNumber) {
      maxNumber = numPart;
    }
  });

  const startNumber =
    type === 'invoice' ? userProfile.invoiceStartNumber || 1 : userProfile.quoteStartNumber || 1;

  // Le prochain numéro est soit le max + 1, soit le numéro de départ s'il est plus grand que le max actuel
  const nextNumber = Math.max(maxNumber + 1, startNumber);

  return `${prefix}-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
};

/**
 * Générateur de XML Factur-X au format CII (Cross Industry Invoice).
 * Profil : BASIC WL (Requis pour la réforme 2026).
 */
export const generateFacturX_XML = (
  invoice: Invoice,
  userProfile: UserProfile,
  client: Client | undefined
) => {
  const dateFormatted = invoice.date.replace(/-/g, '');
  const siret = userProfile.siret.replace(/\s/g, '');
  const clientSiret = client?.siret?.replace(/\s/g, '') || '';

  const itemsXml = (invoice.items || [])
    .filter((item) => !item.isSection)
    .map((item, index) => {
      const qte = new Decimal(item.quantity || 0);
      const pu = new Decimal(item.unitPrice || 0);
      const amount = qte.times(pu).toDecimalPlaces(2);
      return `
        <ram:IncludedSupplyChainTradeLineItem>
            <ram:AssociatedDocumentLineDocument>
                <ram:LineID>${index + 1}</ram:LineID>
            </ram:AssociatedDocumentLineDocument>
            <ram:SpecifiedTradeProduct>
                <ram:Name>${item.description}</ram:Name>
            </ram:SpecifiedTradeProduct>
            <ram:SpecifiedLineTradeAgreement>
                <ram:NetPriceProductTradePrice>
                    <ram:ChargeAmount>${pu.toFixed(2)}</ram:ChargeAmount>
                </ram:NetPriceProductTradePrice>
            </ram:SpecifiedLineTradeAgreement>
            <ram:SpecifiedLineTradeDelivery>
                <ram:BilledQuantity unitCode="C62">${qte.toNumber()}</ram:BilledQuantity>
            </ram:SpecifiedLineTradeDelivery>
            <ram:SpecifiedLineTradeSettlement>
                <ram:ApplicableTradeTax>
                    <ram:TypeCode>VAT</ram:TypeCode>
                    <ram:CategoryCode>${userProfile.isVatExempt ? 'O' : 'S'}</ram:CategoryCode>
                    <ram:RateApplicablePercent>${item.taxRate || 0}</ram:RateApplicablePercent>
                </ram:ApplicableTradeTax>
                <ram:SpecifiedPeriod>
                    <ram:EndDateTime>
                        <udt:DateTimeString format="102">${dateFormatted}</udt:DateTimeString>
                    </ram:EndDateTime>
                </ram:SpecifiedPeriod>
                <ram:SpecifiedTradeSettlementLineMonetarySummation>
                    <ram:LineTotalAmount>${amount.toFixed(2)}</ram:LineTotalAmount>
                </ram:SpecifiedTradeSettlementLineMonetarySummation>
            </ram:SpecifiedLineTradeSettlement>
        </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:a="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:10"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
    <rsm:ExchangedDocumentContext>
        <ram:GuidelineSpecifiedDocumentContextParameter>
            <ram:ID>urn:factur-x.eu:1p0:basicwl</ram:ID>
        </ram:GuidelineSpecifiedDocumentContextParameter>
    </rsm:ExchangedDocumentContext>
    <rsm:ExchangedDocument>
        <ram:ID>${invoice.number}</ram:ID>
        <ram:TypeCode>380</ram:TypeCode>
        <ram:IssueDateTime>
            <udt:DateTimeString format="102">${dateFormatted}</udt:DateTimeString>
        </ram:IssueDateTime>
    </rsm:ExchangedDocument>
    <rsm:SupplyChainTransaction>${itemsXml}
        <ram:ApplicableHeaderTradeAgreement>
            <ram:SellerTradeParty>
                <ram:Name>${userProfile.companyName}</ram:Name>
                <ram:SpecifiedLegalOrganization>
                    <ram:ID schemeID="0002">${siret}</ram:ID>
                </ram:SpecifiedLegalOrganization>
                <ram:PostalTradeAddress>
                    <ram:LineOne>${userProfile.address}</ram:LineOne>
                    <ram:CountryID>FR</ram:CountryID>
                </ram:PostalTradeAddress>
            </ram:SellerTradeParty>
            <ram:BuyerTradeParty>
                <ram:Name>${client?.name || 'Client'}</ram:Name>
                ${
                  clientSiret
                    ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${clientSiret}</ram:ID></ram:SpecifiedLegalOrganization>`
                    : ''
                }
                <ram:PostalTradeAddress>
                    <ram:LineOne>${client?.address || ''}</ram:LineOne>
                    <ram:CountryID>FR</ram:CountryID>
                </ram:PostalTradeAddress>
            </ram:BuyerTradeParty>
        </ram:ApplicableHeaderTradeAgreement>
        <ram:ApplicableHeaderTradeDelivery>
        </ram:ApplicableHeaderTradeDelivery>
        <ram:ApplicableHeaderTradeSettlement>
            <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
            <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
                <ram:LineTotalAmount>${new Decimal(invoice.subtotal || invoice.total || 0).toFixed(2)}</ram:LineTotalAmount>
                <ram:TaxBasisTotalAmount>${new Decimal(invoice.subtotal || invoice.total || 0).toFixed(2)}</ram:TaxBasisTotalAmount>
                <ram:TaxTotalAmount currencyID="EUR">${new Decimal(invoice.taxAmount || 0).toFixed(2)}</ram:TaxTotalAmount>
                <ram:GrandTotalAmount>${new Decimal(invoice.total || 0).toFixed(2)}</ram:GrandTotalAmount>
                <ram:DuePayableAmount>${new Decimal(invoice.total || 0).toFixed(2)}</ram:DuePayableAmount>
            </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        </ram:ApplicableHeaderTradeSettlement>
    </rsm:SupplyChainTransaction>
</rsm:CrossIndustryInvoice>`;
};
