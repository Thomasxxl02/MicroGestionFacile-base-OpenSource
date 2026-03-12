# Schéma PostgreSQL - Micro-Gestion Facile

## 📋 Vue d'ensemble

Ce répertoire contient le schéma PostgreSQL complet pour **Micro-Gestion Facile**, une application de gestion pour micro-entrepreneurs.

### Structure

```
database/
├── migrations/          # Fichiers de migration SQL
│   └── 001_initial_schema.sql
├── seeds/              # Données de test
│   └── seed.sql
└── README.md           # Ce fichier
```

## 🏗️ Architecture de la Base de Données

### Tables principales

| Table           | Description                                        |
| --------------- | -------------------------------------------------- |
| `user_profiles` | Profil utilisateur (entreprise micro-entrepreneur) |
| `clients`       | Clients/prospects                                  |
| `suppliers`     | Fournisseurs                                       |
| `products`      | Produits et services                               |
| `invoices`      | Factures, devis, commandes, avoirs                 |
| `invoice_items` | Lignes de facture                                  |
| `expenses`      | Dépenses professionnelles                          |
| `backup_logs`   | Historique des sauvegardes                         |
| `audit_logs`    | Journal d'audit (RGPD compliant)                   |

### Caractéristiques clés

✅ **Conformité française**

- Gestion TVA (franchise, taux réduit, normal)
- Support SIRET/SIREN
- Numéro TVA intra-communautaire

✅ **Sécurité & Audit**

- Logs d'audit complets `audit_logs`
- Historique des sauvegardes chiffrées `backup_logs`
- Hash d'intégrité SHA-256 pour les factures

✅ **Performance**

- Indexes optimisés sur les colonnes fréquemment requêtes
- Vues matérialisées pour tableaux de bord
- Support des transactions

✅ **Traçabilité**

- `created_at` / `updated_at` sur toutes les entités
- Triggers automatiques pour mise à jour

## 🚀 Installation

### Prérequis

- PostgreSQL 13+ (testé avec 14, 15, 16)
- Node.js 18+
- CLI `psql` ou client PostgreSQL

### 1️⃣ Créer la base de données

```bash
# Via psql
psql -U postgres -c "CREATE DATABASE micro_gestion_facile ENCODING 'UTF8' LOCALE 'fr_FR.UTF-8';"

# Ou via createdb
createdb -U postgres -E UTF8 -l fr_FR.UTF-8 micro_gestion_facile
```

### 2️⃣ Appliquer le schéma

```bash
# Depuis le répertoire root du projet
psql -U postgres -d micro_gestion_facile -f database/migrations/001_initial_schema.sql

# Vérifier la création (optionnel)
psql -U postgres -d micro_gestion_facile -c "\dt"
```

### 3️⃣ Charger les données de test (optionnel)

```bash
psql -U postgres -d micro_gestion_facile -f database/seeds/seed.sql
```

### 4️⃣ Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet:

```env
# ===== PostgreSQL =====
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=micro_gestion_facile
DB_SSL=false  # true for production

# ===== Pool Configuration =====
DB_POOL_MAX=20           # Nombre max de connexions
DEBUG=false              # Logs detaillés
```

## 📊 Schéma Relationnel

```
user_profiles (entreprise)
├── clients (many)
│   └── invoices (many)
│       └── invoice_items (many)
│           └── products (opt)
├── suppliers (many)
│   └── expenses (many)
├── products (many)
└── expenses (many)

audit_logs → user_profiles
backup_logs → user_profiles
```

## 🛠️ Usage dans Node.js/Express

### Configuration du serveur API

Fichier: `server/database.ts`

```typescript
import { pool, query, transaction } from './database';

// Health check
await pool.query('SELECT NOW()');

// Query simple
const users = await query('SELECT * FROM user_profiles');

// Query avec paramètres (protection SQL injection)
const client = await query('SELECT * FROM clients WHERE user_id = $1', [
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
]);

// Transaction
const result = await transaction(async (client) => {
  // Opérations multiples atomiques
  await client.query('INSERT INTO invoices ...');
  await client.query('UPDATE clients ...');
  return { success: true };
});
```

### Installer les dépendances Node

```bash
npm install pg @types/pg
```

## 📚 Vues (Views) Incluses

### 1. `invoices_with_clients`

Jointure factures + clients pour les requêtes communes.

```sql
SELECT * FROM invoices_with_clients WHERE status = 'SENT';
```

### 2. `monthly_revenue`

Revenus mensuels par type de document.

```sql
SELECT * FROM monthly_revenue WHERE user_id = '...' AND month >= '2024-01-01';
```

### 3. `expenses_by_category`

Dépenses par catégorie comptable.

```sql
SELECT * FROM expenses_by_category WHERE user_id = '...' ORDER BY total_amount DESC;
```

## 🔐 Sécurité

### Recommandations

1. **Chiffrement DB SSL**

   ```env
   DB_SSL=true
   ```

2. **Authentification renforcée**

   ```bash
   # Créer utilisateur dédié (moins de perms que superuser)
   psql -U postgres -c "CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';"
   psql -U postgres -c "GRANT CONNECT ON DATABASE micro_gestion_facile TO app_user;"
   psql -U postgres -d micro_gestion_facile -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;"
   ```

3. **Backup réguliers**

   ```bash
   pg_dump -U postgres micro_gestion_facile > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Monitoring**
   - Activer `log_statement = 'all'` en développement (`DEBUG=true`)
   - Audit trail complète dans `audit_logs`

## 🧪 Tests

### Vérifier la structure

```bash
psql -U postgres -d micro_gestion_facile << EOF
-- Tables
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';

-- Views
SELECT * FROM information_schema.views WHERE table_schema = 'public';
EOF
```

### Tester les données de test

```bash
psql -U postgres -d micro_gestion_facile << EOF
SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM invoices;
EOF
```

## 📈 Performances

### Indexes présents

```sql
-- User
idx_user_profiles_siret
idx_user_profiles_email

-- Clients
idx_clients_user_id
idx_clients_email
idx_clients_archived

-- Invoices
idx_invoices_user_id
idx_invoices_client_id
idx_invoices_number
idx_invoices_status
idx_invoices_issue_date
idx_invoices_due_date

-- Expenses
idx_expenses_user_id
idx_expenses_date
idx_expenses_category
```

### Queries optimisées

```sql
-- Factures en retard
SELECT * FROM invoices
WHERE status = 'SENT' AND due_date < CURRENT_DATE
ORDER BY due_date ASC;

-- CA par mois (via vue)
SELECT * FROM monthly_revenue
WHERE user_id = '...' AND month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')::DATE;

-- Dépenses vs revenus
SELECT
  DATE_TRUNC('month', i.issue_date)::DATE as month,
  SUM(i.total) as revenue,
  (SELECT SUM(amount) FROM expenses e WHERE DATE_TRUNC('month', e.date) = DATE_TRUNC('month', i.issue_date)) as expenses
FROM invoices i
GROUP BY DATE_TRUNC('month', i.issue_date)
ORDER BY month DESC;
```

## 🔄 Migration depuis IndexedDB (Dexie)

L'application utilise actuellement **Dexie (IndexedDB)** côté client.

### Stratégie de migration

1. **Phase 1** (Actuellement) : IndexedDB local + PostgreSQL côté serveur
2. **Phase 2** : Sync automatique IndexedDB ↔ PostgreSQL
3. **Phase 3** : PostgreSQL comme source unique de vérité

### Script de migration (future)

```typescript
// TODO: export_from_dexie_to_sql.ts
// Exporter les données d'IndexedDB et importer dans PostgreSQL
```

## 🐛 Troubleshooting

### Erreur: "database does not exist"

```bash
psql -U postgres -l  # Lister les BD
createdb -U postgres micro_gestion_facile
```

### Erreur: "permission denied"

```bash
psql -U postgres -d micro_gestion_facile -c "GRANT ALL ON SCHEMA public TO app_user;"
```

### Pool timeout

```env
# Augmenter le timeout
DB_POOL_MAX=50
```

## 📞 Support

Pour des questions sur le schéma ou l'intégration:

- Voir [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- Voir [SQL_QUERIES.md](./SQL_QUERIES.md) (guide des requêtes optimales)

## 📄 License

MIT - Voir [LICENSE](../LICENSE)

---

**Dernière mise à jour**: Mars 2024  
**Version schéma**: 001  
**Compatible**: PostgreSQL 13, 14, 15, 16
