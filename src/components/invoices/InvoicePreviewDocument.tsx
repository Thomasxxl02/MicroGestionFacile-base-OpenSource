import {
  FileText,
  FileCheck,
  ShoppingBag,
  Receipt,
  Link as LinkIcon,
  ArrowRightCircle,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import { Invoice, Client, UserProfile } from '../../types';
import { useInvoiceCalculations } from '../../hooks/useInvoiceCalculations';
import { getContrastColor } from '../../lib/utils';

interface InvoicePreviewDocumentProps {
  invoice: Invoice;
  isPreview?: boolean;
  clients: Client[];
  userProfile: UserProfile;
  invoices: Invoice[];
  onOpenLinkedDocument?: (id: string) => void;
}

const InvoicePreviewDocument = ({
  invoice,
  isPreview,
  clients,
  userProfile,
  invoices,
  onOpenLinkedDocument,
}: InvoicePreviewDocumentProps) => {
  const client = clients.find((c) => c.id === invoice.clientId);
  const docType = invoice.type || 'invoice';
  const linkedDoc = invoice.linkedDocumentId
    ? invoices.find((i) => i.id === invoice.linkedDocumentId)
    : null;

  const isEn = invoice.language === 'en';

  const labels = {
    description: isEn ? 'Description' : 'Description',
    quantity: isEn ? 'Qty / Unit' : 'Qté / Unité',
    unitPrice: isEn ? 'Unit Price' : 'P.U. HT',
    discount: isEn ? 'Disc %' : 'Rem %',
    tax: isEn ? 'VAT %' : 'TVA %',
    totalTTC: isEn ? 'Total Incl. Tax' : 'Total TTC',
    subtotal: isEn ? 'Subtotal' : 'Total HT',
    taxAmount: isEn ? 'VAT Total' : 'Total TVA',
    globalDisc: isEn ? 'Global Discount' : 'Remise Globale',
    shipping: isEn ? 'Shipping' : 'Frais de Livraison',
    totalPayable: isEn ? 'TOTAL PAYABLE' : 'TOTAL À PAYER',
    quote: isEn ? 'QUOTE' : 'DEVIS',
    invoice: isEn ? 'INVOICE' : 'FACTURE',
    order: isEn ? 'ORDER' : 'COMMANDE',
    credit: isEn ? 'CREDIT NOTE' : 'AVOIR',
    issuedAt: isEn ? 'Issued on' : "Date d'émission",
    expiresAt: isEn ? 'Expires on' : 'Échéance',
    dueDate: isEn ? 'Due Date' : 'Échéance',
    serviceDate: isEn ? 'Service Date' : 'Prestation le',
    paymentMethod: isEn ? 'Payment' : 'Règlement',
    paymentTerms: isEn ? 'Terms' : 'Conditions',
    notes: isEn ? 'Additional Notes' : 'Informations complémentaires',
    status: isEn ? 'Status' : 'Statut',
    paid: isEn ? 'Paid' : 'Payée',
    sent: isEn ? 'Sent' : 'Envoyée',
    draft: isEn ? 'Draft' : 'Brouillon',
    paidAmount: isEn ? 'Paid Amount' : 'Déjà réglé',
    balanceDue: isEn ? 'Balance Due' : 'Reste à payer',
    page: isEn ? 'PAGE' : 'PAGE',
  };

  const title =
    docType === 'quote'
      ? labels.quote
      : docType === 'invoice'
        ? labels.invoice
        : docType === 'order'
          ? labels.order
          : labels.credit;

  const icon =
    docType === 'quote' ? (
      <FileCheck size={28} />
    ) : docType === 'invoice' ? (
      <FileText size={28} />
    ) : docType === 'order' ? (
      <ShoppingBag size={28} />
    ) : (
      <Receipt size={28} />
    );

  const { subtotal, taxAmount, discountAmount, total, balanceDue } = useInvoiceCalculations({
    items: invoice.items,
    discount: invoice.discount,
    shipping: invoice.shipping,
    deposit: invoice.deposit,
  });

  const primaryColor = userProfile.themeColor || '#3b82f6';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isEn ? 'en-GB' : 'fr-FR', {
      style: 'currency',
      currency: userProfile.defaultCurrency || 'EUR',
    }).format(amount);
  };

  return (
    <div
      className={`bg-white p-16 shadow-2xl shadow-slate-200/50 rounded-sm min-h-[1100px] relative mx-auto print:shadow-none print:w-full print:m-0 flex flex-col ${
        userProfile.typography === 'serif' ? 'font-serif' : 'font-sans'
      }`}
      id="invoice-preview"
      style={{ maxWidth: '210mm' }}
    >
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-35deg]">
        <h1 className="text-[120px] font-black tracking-tighter uppercase whitespace-nowrap">
          {title}
        </h1>
      </div>

      {isPreview && (
        <div className="absolute top-0 right-0 left-0 bg-slate-900 text-white text-center py-2 text-[10px] font-black uppercase tracking-[0.3em] no-print z-10">
          AperÃ§u du Document
        </div>
      )}

      {/* Visual Link Banner */}
      {linkedDoc && (
        <div
          className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 mb-12 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-all no-print group"
          onClick={() => !isPreview && onOpenLinkedDocument && onOpenLinkedDocument(linkedDoc.id)}
        >
          <div className="flex items-center gap-5">
            <div
              className="bg-white p-3 rounded-2xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors"
              style={{ color: userProfile.themeColor ? 'inherit' : undefined }}
            >
              <LinkIcon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Document de référence
              </p>
              <p className="text-sm font-bold text-slate-900">
                {linkedDoc.type === 'quote'
                  ? 'Devis'
                  : linkedDoc.type === 'order'
                    ? 'Commande'
                    : 'Facture'}{' '}
                #{linkedDoc.number}
              </p>
            </div>
          </div>
          {!isPreview && (
            <ArrowRightCircle
              size={20}
              className="text-slate-300 group-hover:text-blue-500 transition-all"
              style={{ color: userProfile.themeColor ? primaryColor : undefined }}
            />
          )}
        </div>
      )}

      <div className="flex justify-between items-start mb-24 relative z-10">
        <div>
          <div className="flex items-center gap-4 mb-8">
            {userProfile.logo ? (
              <div className="h-20 w-auto flex items-center">
                <img src={userProfile.logo} alt="Logo" className="max-h-full" />
              </div>
            ) : (
              <div
                className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-xl rotate-3`}
                style={{
                  backgroundColor: primaryColor,
                  color: getContrastColor(primaryColor),
                }}
              >
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                {userProfile.companyName}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {userProfile.legalForm || 'Entrepreneur Individuel'}
                {userProfile.capital && ` au capital de ${formatCurrency(userProfile.capital)}`}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 leading-relaxed font-semibold space-y-1">
            <p className="flex items-center gap-2">
              <MapPin size={10} /> {userProfile.address}
            </p>
            <p className="flex items-center gap-2">
              <Mail size={10} /> {userProfile.email}
            </p>
            <p className="flex items-center gap-2">
              <Phone size={10} /> {userProfile.phone}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <p className="font-mono text-[9px] text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100">
                SIRET: {userProfile.siret}
              </p>
              {userProfile.registrationNumber && (
                <p className="font-mono text-[9px] text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100 text-nowrap">
                  RCS: {userProfile.registrationCity} {userProfile.registrationNumber}
                </p>
              )}
              {userProfile.tvaNumber && (
                <p className="font-mono text-[9px] text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100 text-nowrap">
                  TVA: {userProfile.tvaNumber}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-6xl font-black text-slate-900 -mb-2 tracking-tighter mix-blend-multiply opacity-10 uppercase">
            {title}
          </h2>
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase">
            {title}
          </h2>
          <p className={`text-slate-900 font-black text-xl tracking-widest`}>N° {invoice.number}</p>
          {invoice.reference && (
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">
              Réf: {invoice.reference}
            </p>
          )}

          <div className="mt-12 text-left bg-slate-50/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-100 inline-block min-w-[280px] shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Destinataire
            </h3>
            <p className="font-black text-slate-900 text-xl mb-2">{client?.name}</p>
            <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed font-medium">
              {client?.address}
            </p>
            {client?.siret && (
              <p className="text-[10px] text-slate-400 mt-4 font-mono font-bold">
                SIRET: {client.siret}
              </p>
            )}
            {client?.tvaNumber && (
              <p className="text-[10px] text-slate-400 mt-1 font-mono font-bold">
                TVA: {client.tvaNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-12 mb-16 border-y border-slate-100 py-10 relative z-10">
        <div>
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            {labels.issuedAt}
          </span>
          <span className="font-black text-slate-900 text-lg">
            {new Date(invoice.date).toLocaleDateString(
              invoice.language === 'en' ? 'en-US' : 'fr-FR',
              {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }
            )}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            {docType === 'quote' ? labels.expiresAt : labels.dueDate}
          </span>
          <span className="font-black text-slate-900 text-lg">
            {new Date(invoice.dueDate).toLocaleDateString(
              invoice.language === 'en' ? 'en-US' : 'fr-FR',
              {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }
            )}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            {invoice.serviceDate ? labels.serviceDate : labels.status}
          </span>
          {invoice.serviceDate ? (
            <span className="font-black text-slate-900 text-lg">
              {new Date(invoice.serviceDate).toLocaleDateString(
                invoice.language === 'en' ? 'en-US' : 'fr-FR',
                {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }
              )}
            </span>
          ) : (
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                invoice.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-700'
                  : invoice.status === 'sent'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {invoice.status === 'paid'
                ? labels.paid
                : invoice.status === 'sent'
                  ? labels.sent
                  : labels.draft}
            </span>
          )}
        </div>
      </div>

      <div className="flex-grow relative z-10">
        <table className="w-full mb-12">
          <thead>
            <tr
              className="border-b-4 text-left text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]"
              style={{ borderBottomColor: primaryColor }}
            >
              <th className="py-6 pr-4">{labels.description}</th>
              <th className="py-6 text-right w-24">{labels.quantity}</th>
              <th className="py-6 text-right w-24">{labels.unitPrice}</th>
              <th className="py-6 text-right w-16">{labels.discount}</th>
              <th className="py-6 text-right w-16">{labels.tax}</th>
              <th className="py-6 text-right w-28">{labels.totalTTC}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {invoice.items.map((item, idx) => {
              if (item.isSection) {
                return (
                  <tr key={idx} className="bg-slate-50/50">
                    <td
                      colSpan={6}
                      className="py-4 px-2 text-slate-900 font-black uppercase tracking-widest text-xs"
                    >
                      {item.description}
                    </td>
                  </tr>
                );
              }
              const lineHT = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
              const lineTTC = lineHT * (1 + (item.taxRate || 0) / 100);
              return (
                <tr key={idx} className="group">
                  <td className="py-6 pr-4 text-slate-800 font-bold">{item.description}</td>
                  <td className="py-6 text-right text-slate-500 font-bold">
                    {item.quantity}{' '}
                    <span className="text-[10px] text-slate-400 font-normal ml-1 capitalize">
                      {item.unit || 'u'}
                    </span>
                  </td>
                  <td className="py-6 text-right text-slate-500 font-bold">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-6 text-right text-slate-500 font-bold">
                    {item.discount || 0}%
                  </td>
                  <td className="py-6 text-right text-slate-500 font-bold">{item.taxRate || 0}%</td>
                  <td className="py-6 text-right font-black text-slate-900">
                    {formatCurrency(lineTTC)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-end mt-12 pt-12 border-t-2 border-slate-100 relative z-10">
        <div className="w-1/2">
          {docType === 'quote' && (
            <div className="border border-slate-200 rounded-[2rem] p-8 h-40 flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Bon pour accord (Signature et Cachet)
              </p>
              <div className="border-t border-slate-100 pt-2 text-[9px] text-slate-300 italic">
                Mention "Lu et approuvÃ©"
              </div>
              {userProfile.signature && (
                <div className="mt-2 text-right">
                  <img
                    src={userProfile.signature}
                    alt="Signature"
                    className="h-12 w-auto mix-blend-multiply ml-auto"
                  />
                </div>
              )}
            </div>
          )}
          {docType !== 'quote' && (
            <div className="space-y-6">
              <div className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest space-y-2">
                <p>
                  Règlement :{' '}
                  {invoice.paymentMethod || userProfile.bankAccount || 'Virement bancaire'}
                </p>
                {invoice.paymentTerms && (
                  <p className="text-slate-900 font-black">Conditions : {invoice.paymentTerms}</p>
                )}
                <p className="mt-1 text-slate-300">
                  Règlement par virement bancaire ou mode choisi ci-dessus.
                </p>
              </div>
              {userProfile.signature && (
                <div className="pt-4 border-t border-slate-100 max-w-[150px]">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Signature autorisée
                  </p>
                  <img
                    src={userProfile.signature}
                    alt="Signature"
                    className="h-10 w-auto mix-blend-multiply"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-5/12">
          <div className="space-y-4 pb-8 border-b-2 border-slate-900/5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                {labels.subtotal}
              </span>
              <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  {labels.taxAmount}
                </span>
                <span className="font-bold text-slate-900">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span className="font-black uppercase tracking-widest text-[10px]">
                  {labels.discount} ({invoice.discount}%)
                </span>
                <span className="font-black">- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            {(invoice.shipping || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  {labels.shipping}
                </span>
                <span className="font-bold text-slate-900">
                  + {formatCurrency(invoice.shipping || 0)}
                </span>
              </div>
            )}
            {taxAmount === 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  TVA (Art. 293 B du CGI)
                </span>
                <span className="font-bold text-slate-900">{formatCurrency(0)}</span>
              </div>
            )}
          </div>

          <div className="pt-8">
            <div className="flex justify-between items-center mb-4">
              <span className={`text-slate-900 font-black text-xs uppercase tracking-[0.3em]`}>
                {labels.totalTTC}
              </span>
              <span
                className={`text-slate-900 font-black text-4xl tracking-tighter underline decoration-4 underline-offset-8`}
                style={{ textDecorationColor: primaryColor + '40' }}
              >
                {formatCurrency(total)}
              </span>
            </div>

            {(invoice.deposit || 0) > 0 && (
              <div
                className="p-6 rounded-[2rem] mt-8 shadow-xl"
                style={{
                  backgroundColor: primaryColor,
                  color: getContrastColor(primaryColor),
                }}
              >
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
                  <span>{labels.paidAmount}</span>
                  <span>- {formatCurrency(invoice.deposit || 0)}</span>
                </div>
                <div
                  className={`flex justify-between font-black text-xl border-t border-white/10 pt-3`}
                >
                  <span className="text-xs uppercase tracking-widest flex items-center">
                    {labels.balanceDue}
                  </span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-16 text-center relative z-10">
        {invoice.notes && (
          <div className="mb-12 bg-slate-50/80 backdrop-blur-sm p-8 rounded-[2rem] text-xs text-slate-600 text-left border border-slate-100 relative shadow-inner">
            <span className="absolute -top-3 left-8 bg-white px-4 py-1 rounded-full text-[9px] font-black text-slate-400 border border-slate-100 uppercase tracking-widest">
              {labels.notes}
            </span>
            <div className="font-medium leading-relaxed whitespace-pre-wrap">{invoice.notes}</div>
          </div>
        )}
        <div className="text-[9px] text-slate-400 leading-relaxed border-t border-slate-100 pt-10 font-black uppercase tracking-[0.1em]">
          {taxAmount === 0 && <p>TVA non applicable, art. 293 B du CGI.</p>}
          {userProfile.tvaNumber && taxAmount > 0 && <p>N° TVA Intra : {userProfile.tvaNumber}</p>}
          {userProfile.bankAccount && (
            <p className="mt-1 font-mono text-slate-500">
              IBAN : {userProfile.bankAccount}
              {userProfile.bic && ` | BIC : ${userProfile.bic}`}
            </p>
          )}
          {docType === 'invoice' && (
            <div className="mt-2 space-y-1">
              <p>
                {invoice.language === 'en'
                  ? 'Late payment penalties: Legal interest rate + 10%. Flat-rate recovery fee: €40 (Professionals only).'
                  : "Pénalités de retard : Taux d'intérêt légal + 10%. Indemnité forfaitaire de recouvrement : 40 € (Clients professionnels uniquement)."}
              </p>
              <p>
                {invoice.language === 'en'
                  ? 'Payment method: Bank transfer'
                  : 'Mode de paiement : Virement bancaire'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewDocument;
