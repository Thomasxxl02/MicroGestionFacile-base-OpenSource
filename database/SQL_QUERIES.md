-- ============================================
-- REQUÊTES SQL OPTIMALES
-- ============================================
-- Guide des requêtes fréquemment utilisées
-- Feuille de triche pour micro-gestion-facile

-- ============================================
-- 📊 TABLEAU DE BORD (Dashboard)
-- ============================================

-- 1. Chiffre d'affaires du mois courant
SELECT
SUM(total) as ca_mois,
COUNT(\*) as nb_factures,
AVG(total) as ticket_moyen
FROM invoices
WHERE user_id = $1
AND EXTRACT(MONTH FROM issue_date) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE)
AND status IN ('SENT', 'PAID');

-- 2. Comparaison mois vs mois précédent
SELECT
DATE_TRUNC('month', issue_date)::DATE as month,
SUM(total) as revenue,
COUNT(\*) as count
FROM invoices
WHERE user_id = $1
AND issue_date >= CURRENT_DATE - INTERVAL '2 months'
AND status IN ('SENT', 'PAID')
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY month DESC;

-- 3. Top 5 clients par CA
SELECT
c.id,
c.name,
COUNT(i.id) as nb_factures,
SUM(i.total) as total_ca,
MAX(i.issue_date) as last_invoice
FROM clients c
LEFT JOIN invoices i ON c.id = i.client_id
WHERE c.user_id = $1 AND c.archived = FALSE
GROUP BY c.id, c.name
ORDER BY total_ca DESC NULLS LAST
LIMIT 5;

-- 4. Factures en retard (overdue)
SELECT
i.id,
i.number,
c.name as client_name,
i.total,
i.due_date,
(CURRENT_DATE - i.due_date)::INTEGER as days_late
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.user_id = $1
AND i.status = 'SENT'
AND i.due_date < CURRENT_DATE
ORDER BY days_late DESC;

-- 5. Prochaines échéances (30 jours)
SELECT
i.id,
i.number,
c.name as client_name,
i.total,
i.due_date,
(i.due_date - CURRENT_DATE)::INTEGER as days_left
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.user_id = $1
AND i.status = 'SENT'
AND i.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY i.due_date ASC;

-- ============================================
-- 💰 GESTION FINANCIÈRE
-- ============================================

-- 6. Bilan fiscal annuel
SELECT
EXTRACT(YEAR FROM issue_date)::INTEGER as year,
COUNT(\*) as nb_factures,
SUM(total) as ca_total,
SUM(COALESCE(tax_amount, 0)) as tva_collectée,
AVG(total) as ticket_moyen
FROM invoices
WHERE user_id = $1
AND status IN ('SENT', 'PAID')
AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY EXTRACT(YEAR FROM issue_date);

-- 7. Dépenses par mois (pour comparaison)
SELECT
DATE_TRUNC('month', e.date)::DATE as month,
SUM(CASE WHEN e.status = 'VALIDATED' THEN e.amount ELSE 0 END) as expenses,
SUM(CASE WHEN e.status = 'VALIDATED' THEN e.vat_amount ELSE 0 END) as vat_recoverable,
COUNT(\*) as nb_operations
FROM expenses e
WHERE e.user_id = $1
AND e.date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', e.date)
ORDER BY month DESC;

-- 8. Ratio dépenses/revenus (profitabilité)
SELECT
DATE_TRUNC('month', d.month)::DATE as month,
COALESCE(r.revenue, 0) as revenue,
COALESCE(e.expenses, 0) as expenses,
COALESCE(r.revenue, 0) - COALESCE(e.expenses, 0) as profit,
CASE
WHEN COALESCE(r.revenue, 0) > 0
THEN ROUND((COALESCE(e.expenses, 0) / COALESCE(r.revenue, 0) \* 100)::NUMERIC, 2)
ELSE 0
END as expense_ratio_pct
FROM (
SELECT DISTINCT DATE_TRUNC('month', issue_date)::DATE as month
FROM invoices WHERE user_id = $1
UNION
SELECT DISTINCT DATE_TRUNC('month', date)::DATE as month
FROM expenses WHERE user_id = $1
) d
LEFT JOIN monthly_revenue r ON r.user_id = $1 AND r.month = d.month
LEFT JOIN (
SELECT DATE_TRUNC('month', date)::DATE as month, SUM(amount) as expenses
FROM expenses
WHERE user_id = $1 AND status = 'VALIDATED'
GROUP BY DATE_TRUNC('month', date)
) e ON e.month = d.month
ORDER BY month DESC;

-- ============================================
-- 📄 GESTION DES FACTURES
-- ============================================

-- 9. Liste des factures avec détails client
SELECT
i.id,
i.number,
i.type,
c.name as client_name,
i.issue_date,
i.due_date,
i.total,
i.tax_amount,
i.status,
(CASE
WHEN i.status = 'SENT' AND i.due_date < CURRENT_DATE THEN 'OVERDUE'
WHEN i.status = 'SENT' AND i.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'SOON'
ELSE 'ON_TRACK'
END) as health
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.user_id = $1
ORDER BY i.issue_date DESC
LIMIT 50;

-- 10. Détail d'une facture (header + items)
SELECT
i.id,
i.number,
i.type,
i.issue_date,
i.due_date,
i.total,
i.status,
c.name as client_name,
c.email as client_email,
c.address as client_address,
c.tva_number as client_tva_number,
up.company_name as emitter_name,
up.tva_number as emitter_tva_number
FROM invoices i
JOIN clients c ON i.client_id = c.id
JOIN user_profiles up ON i.user_id = up.id
WHERE i.id = $1;

-- 11. Items d'une facture
SELECT
ii.id,
ii.description,
ii.quantity,
ii.unit,
ii.unit_price,
ii.tax_rate,
ii.discount,
(ii.quantity _ ii.unit_price) as subtotal,
ROUND((ii.quantity _ ii.unit_price \* COALESCE(ii.tax_rate, 0) / 100)::NUMERIC, 2) as tax_amount
FROM invoice_items ii
WHERE ii.invoice_id = $1
ORDER BY ii.line_order ASC;

-- 12. Créer devis → facture (linked documents)
-- Voir si un devis a été converti
SELECT
q.id as quote_id,
q.number as quote_number,
q.total as quote_total,
i.id as invoice_id,
i.number as invoice_number,
i.total as invoice_total
FROM invoices q
LEFT JOIN invoices i ON i.linked_document_id = q.id
WHERE q.user_id = $1
AND q.type = 'quote'
AND q.issue_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY q.issue_date DESC;

-- ============================================
-- 👥 GESTION CLIENTS
-- ============================================

-- 13. Liste des clients avec statistiques
SELECT
c.id,
c.name,
c.email,
c.country,
c.tax_type,
COUNT(i.id) as nb_factures,
SUM(CASE WHEN i.status IN ('SENT', 'PAID') THEN i.total ELSE 0 END) as ca_total,
MAX(i.issue_date) as last_invoice_date,
EXTRACT(DAY FROM (CURRENT_DATE - MAX(i.issue_date)))::INTEGER as days_since_last_invoice,
c.archived
FROM clients c
LEFT JOIN invoices i ON c.id = i.client_id
WHERE c.user_id = $1
GROUP BY c.id
ORDER BY ca_total DESC NULLS LAST;

-- 14. Clients inactifs (> 6 mois)
SELECT
c.id,
c.name,
c.email,
MAX(i.issue_date) as last_invoice,
(CURRENT_DATE - MAX(i.issue_date))::INTEGER as days_inactive
FROM clients c
LEFT JOIN invoices i ON c.id = i.client_id
WHERE c.user_id = $1 AND c.archived = FALSE
GROUP BY c.id
HAVING MAX(i.issue_date) < CURRENT_DATE - INTERVAL '6 months' OR MAX(i.issue_date) IS NULL
ORDER BY days_inactive DESC;

-- 15. Clients EU vs FR vs Export
SELECT
CASE
WHEN country = 'FR' THEN 'France'
WHEN country IN (SELECT DISTINCT country FROM clients WHERE country ~ '^[A-Z]{2}$' AND country != 'FR') THEN 'EU'
ELSE 'Export'
END as zone,
COUNT(\*) as nb_clients,
SUM(ca.ca_total) as zone_ca
FROM clients c
LEFT JOIN (
SELECT client_id, SUM(total) as ca_total
FROM invoices
WHERE status IN ('SENT', 'PAID')
GROUP BY client_id
) ca ON c.id = ca.client_id
WHERE c.user_id = $1 AND c.archived = FALSE
GROUP BY zone;

-- ============================================
-- 📦 GESTION PRODUITS/SERVICES
-- ============================================

-- 16. Produits les plus vendus
SELECT
p.id,
p.name,
COUNT(ii.id) as times_sold,
SUM(ii.quantity) as total_quantity,
SUM(ii.quantity \* ii.unit_price) as revenue,
AVG(ii.unit_price) as avg_price_sold
FROM products p
LEFT JOIN invoice_items ii ON p.id = ii.product_id
LEFT JOIN invoices i ON ii.invoice_id = i.id
WHERE p.user_id = $1 AND i.status IN ('SENT', 'PAID')
GROUP BY p.id
ORDER BY revenue DESC NULLS LAST;

-- 17. Stock alerte (pour produits)
SELECT
id,
name,
sku,
stock,
CASE
WHEN stock <= 5 THEN 'CRITICAL'
WHEN stock <= 20 THEN 'LOW'
ELSE 'OK'
END as stock_status
FROM products
WHERE user_id = $1 AND type = 'product' AND stock IS NOT NULL
ORDER BY stock ASC;

-- ============================================
-- 🏪 GESTION FOURNISSEURS & DÉPENSES
-- ============================================

-- 18. Dépenses par catégorie comptable
SELECT
e.category,
COUNT(\*) as count,
SUM(e.amount) as total_amount,
SUM(e.vat_amount) as total_vat,
ROUND(AVG(e.amount)::NUMERIC, 2) as avg_amount
FROM expenses e
WHERE e.user_id = $1
AND e.status = 'VALIDATED'
AND e.date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY e.category
ORDER BY total_amount DESC;

-- 19. Top dépenses
SELECT
e.id,
e.date,
s.name as supplier_name,
e.description,
e.amount,
e.vat_amount,
e.category,
e.status
FROM expenses e
LEFT JOIN suppliers s ON e.supplier_id = s.id
WHERE e.user_id = $1
ORDER BY e.amount DESC
LIMIT 20;

-- 20. Dépenses contre-passées (reversals)
SELECT
e1.id as reversal_id,
e1.date,
e1.description,
e1.amount,
e2.id as original_id,
e2.date as original_date
FROM expenses e1
LEFT JOIN expenses e2 ON e1.reversal_of = e2.id
WHERE e1.user_id = $1
AND e1.reversal_of IS NOT NULL
ORDER BY e1.date DESC;

-- ============================================
-- 🔒 CONFORMITÉ & AUDIT
-- ============================================

-- 21. Journal d'audit pour un utilisateur
SELECT
action,
entity_type,
COUNT(\*) as count,
MAX(created_at) as last_action
FROM audit_logs
WHERE user_id = $1
GROUP BY action, entity_type
ORDER BY last_action DESC;

-- 22. Modifications récentes d'une facture
SELECT
action,
old_values,
new_values,
created_at
FROM audit_logs
WHERE entity_type = 'INVOICE'
AND entity_id = $1
ORDER BY created_at DESC;

-- 23. Historique des sauvegardes
SELECT
id,
backup_type,
status,
rows_backed_up,
size_bytes / 1024 / 1024 as size_mb,
encrypted,
created_at
FROM backup_logs
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 📈 ANALYSE / STATISTIQUES
-- ============================================

-- 24. Taux de conversion devis → facture
SELECT
COUNT(CASE WHEN type = 'quote' THEN 1 END)::FLOAT /
NULLIF(COUNT(CASE WHEN type IN ('quote', 'invoice') THEN 1 END), 0) \* 100
as conversion_rate_pct
FROM invoices
WHERE user_id = $1
AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE);

-- 25. Temps moyen de paiement (invoice → paid)
-- NOTE: Requiert colonne "paid_date" si implémentée
SELECT
ROUND(AVG((CURRENT_DATE - i.due_date))::NUMERIC, 0)::INTEGER as avg_days_to_pay
FROM invoices i
WHERE i.user_id = $1
AND i.status = 'PAID'
AND i.due_date IS NOT NULL;

-- 26. Évolution CA sur 12 mois (pour graphiques)
SELECT
DATE_TRUNC('month', i.issue_date)::DATE as month,
SUM(i.total) as revenue
FROM invoices i
WHERE i.user_id = $1
AND i.status IN ('SENT', 'PAID')
AND i.issue_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', i.issue_date)
ORDER BY month ASC;

-- ============================================
-- 🛡️ MAINTENANCE
-- ============================================

-- 27. Facteurs d'intégrité manquants
SELECT
id,
number,
type,
issue_date,
'Missing integrity hash' as issue
FROM invoices
WHERE user_id = $1 AND integrity_hash IS NULL
ORDER BY issue_date DESC;

-- 28. Factures sans client (orphelines)
-- NE DEVRAIT PAS ARRIVER avec les constraints FK
SELECT COUNT(\*) as orphaned_invoices
FROM invoices
WHERE user_id = $1 AND client_id NOT IN (SELECT id FROM clients);

-- 29. Statistiques de performance DB
SELECT
schemaname,
tablename,
idx_scan,
idx_tup_read,
idx_tup_fetch,
pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ============================================
-- 🎯 REQUÊTES PARAMÉTRÉES (Node.js)
-- ============================================

/\*
// Utilisation dans Node.js avec pg pool:

import { pool } from './database';

// Exemple paramètres
const userId = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
const clientId = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';

// Simple query
const result = await pool.query(
'SELECT \* FROM invoices WHERE user_id = $1',
[userId]
);

// Ou via helper function:
import { query } from './database';
const invoices = await query(
'SELECT \* FROM invoices_with_clients WHERE status = $1',
['SENT']
);

// Transaction
import { transaction } from './database';
const result = await transaction(async (client) => {
await client.query(
'INSERT INTO invoices (user_id, client_id, number, total) VALUES ($1, $2, $3, $4)',
[userId, clientId, 'FAC-2024-042', 500.00]
);
// Autres opérations...
return { success: true };
});
\*/

-- ============================================
-- FIN DES REQUÊTES
-- ============================================
