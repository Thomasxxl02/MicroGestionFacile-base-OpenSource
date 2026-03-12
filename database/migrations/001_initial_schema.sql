-- PostgreSQL 13+
-- ============================================
-- Micro-Gestion Facile - Schéma Initial PostgreSQL
-- ============================================
-- Migration: 001_initial_schema.sql
-- Crée la structure complète de base de données
-- Supports: Factures, Clients, Produits, Dépenses, Fournisseurs, Profil Utilisateur

-- ============================================
-- 1. PROFIL UTILISATEUR (Entreprise)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations entreprise
  company_name VARCHAR(255) NOT NULL,
  legal_form VARCHAR(50),
  capital DECIMAL(12, 2),
  siret CHAR(14) UNIQUE NOT NULL,
  registration_number VARCHAR(100),
  registration_city VARCHAR(100),
  address TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  website VARCHAR(255),
  
  -- Informations bancaires
  bank_account VARCHAR(34), -- IBAN
  bic VARCHAR(11),
  
  -- Fiscalité
  tva_number VARCHAR(50),
  legal_mentions TEXT,
  default_ai VARCHAR(50) DEFAULT 'gemini',
  default_invoice_notes TEXT,
  
  -- Présentation
  logo TEXT, -- Data URL ou chemin
  signature TEXT, -- Data URL ou chemin
  theme_color VARCHAR(7),
  typography VARCHAR(20),
  
  -- Configuration numérotation
  invoice_prefix VARCHAR(10) DEFAULT 'FAC',
  quote_prefix VARCHAR(10) DEFAULT 'DEV',
  invoice_start_number INTEGER DEFAULT 1,
  quote_start_number INTEGER DEFAULT 1,
  
  -- Paramètres defaults
  default_language VARCHAR(5) DEFAULT 'fr',
  default_payment_deadline INTEGER DEFAULT 30,
  activity_type VARCHAR(20) DEFAULT 'services', -- sales, services, mixed
  default_currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Fiscalité micro-entrepreneur
  is_vat_exempt BOOLEAN DEFAULT TRUE,
  has_accre BOOLEAN DEFAULT FALSE,
  has_versement_liberatoire BOOLEAN DEFAULT FALSE,
  contribution_quarter VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly
  
  -- Backup & Sécurité
  is_configured BOOLEAN DEFAULT FALSE,
  backup_frequency VARCHAR(20) DEFAULT 'none', -- none, weekly, monthly
  last_auto_backup_date TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_siret_format CHECK (siret ~ '^\d{14}$'),
  CONSTRAINT valid_iban_format CHECK (bank_account IS NULL OR bank_account ~ '^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$'),
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_user_profiles_siret ON user_profiles(siret);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- 2. CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  country VARCHAR(2) DEFAULT 'FR',
  currency VARCHAR(3) DEFAULT 'EUR',
  language VARCHAR(5) DEFAULT 'fr',
  
  -- Fiscalité
  tax_type VARCHAR(50) DEFAULT 'DOMESTIC', -- DOMESTIC, EU_B2B, EXPORT
  siret CHAR(14),
  tva_number VARCHAR(50),
  tax_id VARCHAR(100), -- EIN pour clients non-EU
  
  -- Contact
  phone VARCHAR(20),
  notes TEXT,
  
  -- Statut
  archived BOOLEAN DEFAULT FALSE,
  payment_terms INTEGER DEFAULT 30,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_client_per_user CHECK (user_id IS NOT NULL)
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_archived ON clients(archived);

-- ============================================
-- 3. FOURNISSEURS
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  siret CHAR(14),
  address TEXT,
  category VARCHAR(100), -- ex: 651 - Logiciels/SaaS
  notes TEXT,
  
  -- Informations bancaires
  iban VARCHAR(34),
  bic VARCHAR(11),
  
  -- Fiscalité
  vat_number VARCHAR(50),
  origin VARCHAR(10) DEFAULT 'FR', -- FR, EU, NON_EU
  country VARCHAR(2) DEFAULT 'FR',
  accounting_code VARCHAR(20),
  
  -- Paiement
  payment_terms VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VALIDATED, REJECTED
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- ============================================
-- 4. PRODUITS / SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  brand VARCHAR(150),
  short_description VARCHAR(255),
  description TEXT,
  
  -- Tarification
  price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 20.00,
  eco_participation DECIMAL(12, 2),
  
  -- Propriétés produit
  repairability_index DECIMAL(3, 1), -- 0-10
  legal_warranty VARCHAR(100) DEFAULT '2 ans',
  origin VARCHAR(100) DEFAULT 'France',
  
  -- Commercial
  unit VARCHAR(50) NOT NULL, -- pièce, heure, jour, etc.
  type VARCHAR(20) NOT NULL, -- service, product
  tax_category VARCHAR(50) NOT NULL, -- SERVICE_BIC, SALE_BIC, VENTE_MARCHANDISES, etc.
  stock INTEGER,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_type ON products(type);

-- ============================================
-- 5. FACTURES
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  
  type VARCHAR(20) NOT NULL, -- invoice, quote, order, credit_note
  number VARCHAR(50) NOT NULL,
  linked_document_id UUID, -- Reference vers une autre facture (devis -> facture, etc.)
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  service_date DATE,
  reminder_date DATE,
  
  -- Montants
  subtotal DECIMAL(12, 2),
  tax_amount DECIMAL(12, 2),
  total DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2),
  shipping DECIMAL(12, 2),
  deposit DECIMAL(12, 2),
  
  -- Détails
  language VARCHAR(5) DEFAULT 'fr',
  notes TEXT,
  internal_notes TEXT,
  payment_method VARCHAR(100),
  payment_terms VARCHAR(100),
  reference VARCHAR(100),
  
  -- Statut & Traçabilité
  status VARCHAR(50) NOT NULL, -- DRAFT, SENT, PAID, OVERDUE, CANCELLED
  stock_updated BOOLEAN DEFAULT FALSE,
  integrity_hash VARCHAR(64), -- SHA-256 pour audit trail
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_invoice_number CHECK (user_id IS NOT NULL),
  CONSTRAINT valid_total CHECK (total >= 0)
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_number ON invoices(user_id, number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- ============================================
-- 6. LIGNES DE FACTURE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  description TEXT NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  unit_price_cents INTEGER, -- Monetary standard pour précision
  
  tax_rate DECIMAL(5, 2),
  discount DECIMAL(12, 2),
  is_section BOOLEAN DEFAULT FALSE,
  category VARCHAR(50),
  
  -- Calculs (dénormalisé pour performance)
  subtotal DECIMAL(12, 2),
  tax_subtotal DECIMAL(12, 2),
  total DECIMAL(12, 2),
  
  -- Ordre
  line_order INTEGER,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_price CHECK (unit_price >= 0)
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

-- ============================================
-- 7. DÉPENSES
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  vat_amount DECIMAL(12, 2),
  
  category VARCHAR(100) NOT NULL, -- ex: 6051, 6052, 607, etc.
  status VARCHAR(50) DEFAULT 'VALIDATED', -- VALIDATED, CANCELLED
  
  reversal_of UUID REFERENCES expenses(id), -- ID de la dépense contre-passée
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_status ON expenses(status);

-- ============================================
-- 8. BACKUP LOG (pour tracer les sauvegardes)
-- ============================================
CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  backup_type VARCHAR(50), -- automated, manual, scheduled
  status VARCHAR(50), -- success, failed
  error_message TEXT,
  
  rows_backed_up INTEGER,
  size_bytes BIGINT,
  
  s3_bucket VARCHAR(255),
  s3_key VARCHAR(255),
  
  encrypted BOOLEAN DEFAULT TRUE,
  encryption_key_hash VARCHAR(64),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backup_logs_user_id ON backup_logs(user_id);
CREATE INDEX idx_backup_logs_created_at ON backup_logs(created_at);

-- ============================================
-- 9. AUDIT LOG (pour sécurité & conformité)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.
  entity_type VARCHAR(100), -- INVOICE, CLIENT, EXPENSE, etc.
  entity_id UUID,
  
  old_values JSONB, -- Avant modification
  new_values JSONB, -- Après modification
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- 10. TRIGGERS - Mise à jour automatique des timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_clients_timestamp
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_suppliers_timestamp
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_products_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_invoices_timestamp
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_invoice_items_timestamp
BEFORE UPDATE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================
-- 11. VUES (pour facilitator les requêtes communes)
-- ============================================

-- Vue: Factures avec infos client
CREATE OR REPLACE VIEW invoices_with_clients AS
SELECT
  i.id,
  i.user_id,
  i.number,
  i.type,
  i.issue_date,
  i.due_date,
  i.total,
  i.status,
  c.name AS client_name,
  c.email AS client_email,
  c.country AS client_country
FROM invoices i
JOIN clients c ON i.client_id = c.id;

-- Vue: Revenus par mois (pour tableaux de bord)
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  i.user_id,
  DATE_TRUNC('month', i.issue_date)::DATE AS month,
  i.type,
  COUNT(*) AS count,
  SUM(i.total) AS total_amount,
  SUM(i.tax_amount) AS total_tax
FROM invoices i
WHERE i.status IN ('SENT', 'PAID')
GROUP BY i.user_id, DATE_TRUNC('month', i.issue_date), i.type;

-- Vue: Dépenses par catégorie
CREATE OR REPLACE VIEW expenses_by_category AS
SELECT
  e.user_id,
  e.category,
  COUNT(*) AS count,
  SUM(e.amount) AS total_amount,
  SUM(e.vat_amount) AS total_vat,
  DATE_TRUNC('month', e.date)::DATE AS month
FROM expenses e
WHERE e.status = 'VALIDATED'
GROUP BY e.user_id, e.category, DATE_TRUNC('month', e.date);

-- ============================================
-- 12. EXTENSIONS POSTGRESQL (optionales recommandées)
-- ============================================

-- Pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pour sérialisation JSON avancée
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Text search

-- Pour crypto (si besoin local)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- COMMIT de la migration
-- ============================================

COMMENT ON TABLE user_profiles IS 'Profil utilisateur (micro-entrepreneur)';
COMMENT ON TABLE clients IS 'Clients / Prospects';
COMMENT ON TABLE suppliers IS 'Fournisseurs';
COMMENT ON TABLE products IS 'Produits / Services vendus';
COMMENT ON TABLE invoices IS 'Factures, Devis, Commandes, Avoirs';
COMMENT ON TABLE invoice_items IS 'Lignes de facture';
COMMENT ON TABLE expenses IS 'Dépenses professionnelles';
COMMENT ON TABLE backup_logs IS 'Journal des sauvegardes';
COMMENT ON TABLE audit_logs IS 'Journal d''audit (RGPD)';
