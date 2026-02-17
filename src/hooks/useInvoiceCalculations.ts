import { useMemo } from 'react';
import { Decimal } from 'decimal.js';
import { InvoiceItem } from '../types';

interface CalculationProps {
  items: InvoiceItem[];
  discount?: number;
  shipping?: number;
  deposit?: number;
  isTaxExempt?: boolean;
}

export const useInvoiceCalculations = ({
  items,
  discount = 0,
  shipping = 0,
  deposit = 0,
  isTaxExempt = false,
}: CalculationProps) => {
  return useMemo(() => {
    let subtotalHT = new Decimal(0);
    const taxByRate: Record<number, { base: Decimal; amount: Decimal }> = {};

    items.forEach((item) => {
      if (item.isSection) return;

      const qte = new Decimal(item.quantity || 0);
      const pu = new Decimal(item.unitPrice || 0);
      const itemDiscount = new Decimal(item.discount || 0);
      const itemTaxRate = isTaxExempt ? new Decimal(0) : new Decimal(item.taxRate || 0);

      // HT de la ligne avant remise ligne (arrondi à 2 décimales)
      const lineTotalHTRaw = qte.times(pu).toDecimalPlaces(2);

      // Remise sur la ligne
      const lineDiscountAmount = lineTotalHTRaw.times(itemDiscount.div(100)).toDecimalPlaces(2);
      const lineHTAfterDiscount = lineTotalHTRaw.minus(lineDiscountAmount);

      // TVA de la ligne
      const lineVATAmount = lineHTAfterDiscount.times(itemTaxRate.div(100)).toDecimalPlaces(2);

      subtotalHT = subtotalHT.plus(lineHTAfterDiscount);

      // Groupement par taux de TVA
      const rate = itemTaxRate.toNumber();
      if (!taxByRate[rate]) {
        taxByRate[rate] = { base: new Decimal(0), amount: new Decimal(0) };
      }
      taxByRate[rate].base = taxByRate[rate].base.plus(lineHTAfterDiscount);
      taxByRate[rate].amount = taxByRate[rate].amount.plus(lineVATAmount);
    });

    // Remise globale (%) appliquée sur le total HT cumulé
    const globalDiscountAmount = subtotalHT
      .times(new Decimal(discount).div(100))
      .toDecimalPlaces(2);
    const finalHT = subtotalHT.minus(globalDiscountAmount);

    // Ajustement de la TVA au prorata si remise globale (comptablement complexe, on simplifie par défaut)
    // En général, on recalcule la TVA sur le HT net si la remise est globale
    let finalVAT = new Decimal(0);
    const taxDetails = Object.entries(taxByRate).map(([rate, data]) => {
      const rateFactor = new Decimal(1).minus(new Decimal(discount).div(100));
      const adjustedBase = data.base.times(rateFactor).toDecimalPlaces(2);
      const adjustedAmount = data.amount.times(rateFactor).toDecimalPlaces(2);
      finalVAT = finalVAT.plus(adjustedAmount);

      return {
        rate: Number(rate),
        base: adjustedBase.toNumber(),
        amount: adjustedAmount.toNumber(),
      };
    });

    const totalTTC = finalHT.plus(finalVAT).plus(new Decimal(shipping)).toDecimalPlaces(2);
    const balanceDue = Decimal.max(0, totalTTC.minus(new Decimal(deposit)));

    return {
      subtotal: subtotalHT.toNumber(),
      finalHT: finalHT.toNumber(),
      taxAmount: finalVAT.toNumber(),
      taxDetails,
      discountAmount: globalDiscountAmount.toNumber(),
      total: totalTTC.toNumber(),
      balanceDue: balanceDue.toNumber(),
      isTaxExempt,
    };
  }, [items, discount, shipping, deposit, isTaxExempt]);
};
