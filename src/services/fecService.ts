import { Invoice, UserProfile, Client, Expense, Supplier } from '../types';
import { generateJournalEntries } from './accountingService';
import { addAuditLog } from './db';

/**
 * Génère un fichier FEC (Fichier des Écritures Comptables) conforme à l'article A.47 A-1
 * du Livre des Procédures Fiscales pour un micro-entrepreneur.
 */
export function generateFEC(
  invoices: Invoice[],
  expenses: Expense[],
  userProfile: UserProfile,
  clients: Client[],
  suppliers: Supplier[] = []
): string {
  const columns = [
    'JournalCode',
    'JournalLib',
    'EcritureNum',
    'EcritureDate',
    'CompteNum',
    'CompteLib',
    'CompteAuxNum',
    'CompteAuxLib',
    'PieceRef',
    'PieceDate',
    'EcritureLib',
    'Debit',
    'Credit',
    'EcritureLet',
    'DateLet',
    'ValidDate',
    'MontantDevise',
    'IdenDevise',
  ];

  const rows: string[] = [columns.join('\t')];

  // Utilise notre nouveau service d'écritures normées FR
  const entries = generateJournalEntries(invoices, expenses, userProfile, clients, suppliers);
  let currentEcritureId = '';
  let ecritureIncremental = 0;

  entries.forEach((entry) => {
    // Dans le FEC, EcritureNum doit être unique par écriture (qui peut avoir plusieurs lignes)
    // On se base sur le préfixe de l'ID pour grouper
    const entryIdBase = entry.id.split('-')[0];
    if (entryIdBase !== currentEcritureId) {
      currentEcritureId = entryIdBase;
      ecritureIncremental++;
    }

    const row = [
      entry.journal,
      entry.journalLib,
      ecritureIncremental.toString(),
      entry.date.replace(/-/g, ''),
      entry.compteNum,
      entry.compteLib,
      entry.compteAuxNum || '', // CompteAuxNum
      entry.compteAuxLib || '', // CompteAuxLib
      entry.reference, // PieceRef
      entry.date.replace(/-/g, ''), // PieceDate
      entry.libelle,
      entry.debit.toFixed(2).replace('.', ','),
      entry.credit.toFixed(2).replace('.', ','),
      entry.lettrage || '',
      entry.lettrage ? entry.date.replace(/-/g, '') : '', // DateLet
      entry.date.replace(/-/g, ''), // ValidDate
      '', // MontantDevise
      'EUR', // IdenDevise
    ];
    rows.push(row.join('\t'));
  });

  return rows.join('\r\n');
}

/**
 * Déclenche le téléchargement du fichier FEC et log l'action dans l'Audit Trail
 */
export async function downloadFEC(
  invoices: Invoice[],
  userProfile: UserProfile,
  clients: Client[] = [],
  expenses: Expense[] = [],
  suppliers: Supplier[] = []
) {
  const content = generateFEC(invoices, expenses, userProfile, clients, suppliers);
  const siren = userProfile.siret
    ? userProfile.siret.replace(/\s/g, '').substring(0, 9)
    : '000000000';
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const filename = `${siren}FEC${dateStr}.txt`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  // Audit Trail - Impact Infrastructure
  await addAuditLog(
    'generate_fec',
    'accounting',
    filename,
    `Génération du fichier FEC pour la période (Toutes données cumulées).`
  );
}
