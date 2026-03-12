-- ============================================
-- DONNÉES DE TEST - Seed pour développement
-- ============================================

-- Données de test pour un utilisateur (micro-entrepreneur)
INSERT INTO user_profiles (
  id,
  company_name,
  legal_form,
  siret,
  address,
  email,
  phone,
  tva_number,
  is_vat_exempt,
  activity_type,
  is_configured
) VALUES (
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'Thomas SARL',
  'SARL',
  '12345678901234',
  '123 Rue de la Paix, 75000 Paris',
  'thomas@example.com',
  '+33612345678',
  'FR98765432109',
  TRUE,
  'services',
  TRUE
) ON CONFLICT DO NOTHING;

-- Clients de test
INSERT INTO clients (
  id,
  user_id,
  name,
  email,
  address,
  country,
  tax_type
) VALUES (
  'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'Entreprise ABC',
  'contact@abc.com',
  '456 Avenue des Champs, 75008 Paris',
  'FR',
  'DOMESTIC'
),
(
  'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'Client Export',
  'info@export.de',
  'Strasse 10, 10115 Berlin',
  'DE',
  'EU_B2B'
) ON CONFLICT DO NOTHING;

-- Produits/Services de test
INSERT INTO products (
  id,
  user_id,
  name,
  sku,
  description,
  price,
  tax_rate,
  unit,
  type,
  tax_category
) VALUES (
  'p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'Consultation - 1 heure',
  'CONS-001',
  'Consultation expert inclus',
  100.00,
  20.00,
  'heure',
  'service',
  'SERVICE_BIC'
),
(
  'p2p2p2p2-p2p2-p2p2-p2p2-p2p2p2p2p2p2',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'Logiciel Gestion',
  'LOG-001',
  'Accès annuel au logiciel',
  500.00,
  20.00,
  'année',
  'service',
  'SERVICE_BIC'
) ON CONFLICT DO NOTHING;

-- Fournisseurs de test
INSERT INTO suppliers (
  id,
  user_id,
  name,
  email,
  siret,
  category,
  status
) VALUES (
  's1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'Fournisseur Logiciel',
  'support@logiciel.com',
  '98765432109876',
  '651',
  'VALIDATED'
) ON CONFLICT DO NOTHING;

-- Facture de test
INSERT INTO invoices (
  id,
  user_id,
  client_id,
  type,
  number,
  issue_date,
  due_date,
  total,
  status
) VALUES (
  'i1i1i1i1-i1i1-i1i1-i1i1-i1i1i1i1i1i1',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
  'invoice',
  'FAC-2024-001',
  '2024-01-15',
  '2024-02-15',
  120.00,
  'SENT'
) ON CONFLICT DO NOTHING;

-- Lignes de facture
INSERT INTO invoice_items (
  id,
  invoice_id,
  product_id,
  description,
  quantity,
  unit,
  unit_price,
  line_order
) VALUES (
  'ii1ii1ii-1ii1-1ii1-1ii1-1ii1ii1ii1ii',
  'i1i1i1i1-i1i1-i1i1-i1i1-i1i1i1i1i1i1',
  'p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1',
  'Consultation - 1 heure',
  1.0,
  'heure',
  100.00,
  1
) ON CONFLICT DO NOTHING;

-- Dépenses de test
INSERT INTO expenses (
  id,
  user_id,
  supplier_id,
  date,
  description,
  amount,
  vat_amount,
  category,
  status
) VALUES (
  'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  's1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1',
  '2024-01-10',
  'Licence logiciel 2024',
  600.00,
  120.00,
  '651',
  'VALIDATED'
) ON CONFLICT DO NOTHING;
