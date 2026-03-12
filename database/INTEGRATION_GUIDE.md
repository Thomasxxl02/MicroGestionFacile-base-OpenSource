-- ============================================
-- GUIDE D'INTÉGRATION - PostgreSQL + Node.js
-- ============================================

# 📌 ÉTAPES D'INTÉGRATION

## 1. Installation des dépendances

```bash
npm install pg dotenv
npm install --save-dev @types/pg
```

## 2. Fichier .env

Créer `.env` à la racine du projet:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=micro_gestion_facile
NODE_ENV=development
DEBUG=false
```

## 3. Configuration de la base (server/database.ts)

✅ Fichier créé: `server/database.ts`

Utilisation dans les routes API:

```typescript
import { pool, query, transaction } from './database';

// Récupérer un utilisateur
app.get('/api/users/:id', async (req, res) => {
  const users = await query('SELECT * FROM user_profiles WHERE id = $1', [req.params.id]);
  res.json(users[0]);
});

// Créer une facture (transaction)
app.post('/api/invoices', async (req, res) => {
  try {
    const result = await transaction(async (client) => {
      // Insérer facture
      const invoiceResult = await client.query(
        'INSERT INTO invoices (user_id, client_id, number, total, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [req.body.userId, req.body.clientId, req.body.number, req.body.total, 'DRAFT']
      );
      const invoiceId = invoiceResult.rows[0].id;

      // Insérer items
      for (const item of req.body.items) {
        await client.query(
          'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [invoiceId, item.description, item.quantity, item.unitPrice]
        );
      }

      return invoiceId;
    });

    res.json({ success: true, id: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 4. Initialiser la base

### Option A: Localement (sans Docker)

```bash
# Créer la BD
createdb -U postgres micro_gestion_facile

# Appliquer les migrations
psql -U postgres -d micro_gestion_facile -f database/migrations/001_initial_schema.sql

# Charger les données de test (optionnel)
psql -U postgres -d micro_gestion_facile -f database/seeds/seed.sql

# Vérifier la connexion
psql -U postgres -d micro_gestion_facile -c "SELECT COUNT(*) FROM user_profiles;"
```

### Option B: Avec Docker

```bash
docker-compose -f docker-compose.db.yml up -d
```

Puis appliquer les migrations:

```bash
# Attendre que PostgreSQL démarre (~5s)
sleep 5

# Appliquer le schéma
psql -h localhost -U postgres -d micro_gestion_facile -f database/migrations/001_initial_schema.sql

# Charger les données de test
psql -h localhost -U postgres -d micro_gestion_facile -f database/seeds/seed.sql
```

## 5. Tester la connexion

```bash
# Vous pouvez exécuter le script de test:
npm run test:db

# Ou manuellement:
psql -U postgres -d micro_gestion_facile << EOF
SELECT COUNT(*) as user_count FROM user_profiles;
SELECT COUNT(*) as client_count FROM clients;
SELECT COUNT(*) as invoice_count FROM invoices;
EOF
```

## 6. Intégration progressive (IndexedDB → PostgreSQL)

Stratégie recommandée:

### Phase 1 (Actuellement): Dual storage

- ✅ IndexedDB (Dexie) gère les données côté client
- ✅ PostgreSQL gère les backups serveur
- ✅ Sync automatique via API: Client → Server → DB

### Phase 2: Sync bidirectionnel

```typescript
// Exemple: Sync récurrente
setInterval(async () => {
  const localData = await db.invoices.toArray();
  await fetch('/api/sync/invoices', {
    method: 'POST',
    body: JSON.stringify({ data: localData }),
  });
}, 30000); // Tous les 30s
```

### Phase 3: PostgreSQL source unique

- Charger données depuis PostgreSQL au démarrage
- IndexedDB = cache local uniquement
- Sync unidirectionnel: Server → Client

## 7. Requêtes habituelles

### Récupérer les factures d'un utilisateur

```typescript
const invoices = await query(
  `SELECT i.*, c.name as client_name 
   FROM invoices i 
   JOIN clients c ON i.client_id = c.id 
   WHERE i.user_id = $1 
   ORDER BY i.issue_date DESC`,
  [userId]
);
```

### Créer une facture complète

```typescript
const result = await transaction(async (client) => {
  // 1. Insérer facture
  const inv = await client.query(
    `INSERT INTO invoices 
    (user_id, client_id, number, issue_date, due_date, total, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
      userId,
      clientId,
      'FAC-2024-001',
      new Date(),
      new Date(Date.now() + 30 * 24 * 3600 * 1000),
      500,
      'DRAFT',
    ]
  );

  const invoiceId = inv.rows[0].id;

  // 2. Insérer items
  const items = [
    { description: 'Service 1', qty: 1, price: 300 },
    { description: 'Service 2', qty: 2, price: 100 },
  ];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await client.query(
      `INSERT INTO invoice_items 
      (invoice_id, description, quantity, unit_price, unit, line_order)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [invoiceId, item.description, item.qty, item.price, 'heure', i + 1]
    );
  }

  return invoiceId;
});
```

### Récupérer le CA du mois

```typescript
const revenue = await query(
  `SELECT SUM(total) as ca, COUNT(*) as count
   FROM invoices
   WHERE user_id = $1
   AND EXTRACT(MONTH FROM issue_date) = EXTRACT(MONTH FROM CURRENT_DATE)
   AND status IN ('SENT', 'PAID')`,
  [userId]
);
```

## 8. Gestion des erreurs

```typescript
app.use((error, req, res, next) => {
  console.error('API Error:', error);

  // Erreurs PostgreSQL
  if (error.code === '23505') {
    // Unique violation
    return res.status(400).json({ error: 'Donnée déjà existante' });
  }
  if (error.code === '23503') {
    // Foreign key
    return res.status(400).json({ error: 'Référence invalide' });
  }

  res.status(500).json({ error: 'Erreur serveur' });
});
```

## 9. Backup de la base

```bash
# Dump complet
pg_dump -U postgres micro_gestion_facile > backup_$(date +%Y%m%d_%H%M%S).sql

# Dump structure uniquement
pg_dump -U postgres -s micro_gestion_facile > schema.sql

# Restaurer
psql -U postgres micro_gestion_facile < backup.sql
```

## 10. Migration des données Dexie → PostgreSQL

Créer un script de migration:

```typescript
// migrate-from-dexie.ts
import Dexie from 'dexie';
import { pool } from './server/database';

const db = new Dexie('micro_gestion_facile');

export async function migrateData(userId: string) {
  const transaction = await pool.connect();

  try {
    await transaction.query('BEGIN');

    // Migrer les factures
    const invoices = await db.invoices.toArray();
    for (const invoice of invoices) {
      await transaction.query(
        'INSERT INTO invoices (...) VALUES (...)',
        [...]
      );
    }

    // Migrer clients, produits, etc...

    await transaction.query('COMMIT');
    console.log('✅ Migration complète');
  } catch (error) {
    await transaction.query('ROLLBACK');
    throw error;
  } finally {
    transaction.release();
  }
}
```

## 🔧 Troubleshooting

### "connect ECONNREFUSED"

- Vérifier que PostgreSQL est running: `psql -U postgres`
- Vérifier les paramètres .env

### "database does not exist"

```bash
createdb -U postgres micro_gestion_facile
psql -U postgres -d micro_gestion_facile -f database/migrations/001_initial_schema.sql
```

### Pool connection timeout

```env
DB_POOL_MAX=50
DB_CONNECT_TIMEOUT=5000
```

### Erreur lors de CREATE EXTENSION

```sql
-- Vérifier que l'utilisateur a les droits
ALTER ROLE postgres SUPERUSER;
```

## 📚 Ressources

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [pg npm](https://github.com/brianc/node-postgres)
- [Query Tuning](./SQL_QUERIES.md)
- [Security Best Practices](../docs/SECURITY_COMPREHENSIVE.md)

---

✅ **Schéma PostgreSQL prêt à être intégré!**
