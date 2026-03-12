#!/bin/bash

# ============================================
# Setup PostgreSQL - Micro-Gestion Facile
# ============================================
# Script pour initialiser la base de données rapidement
# Usage: ./setup-db.sh [--seed] [--docker]

set -e  # Exit on error

SEED=false
USE_DOCKER=false
DB_NAME="micro_gestion_facile"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --seed)
      SEED=true
      shift
      ;;
    --docker)
      USE_DOCKER=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "🚀 Configuration PostgreSQL pour Micro-Gestion Facile"
echo "=================================================="

# Check if PostgreSQL is installed
if [ "$USE_DOCKER" = false ]; then
  if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL n'est pas installé"
    echo "   Installation:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt-get install postgresql"
    echo "   - Windows: https://www.postgresql.org/download/windows/"
    exit 1
  fi
  echo "✅ PostgreSQL trouvé"
fi

# Create database if not using Docker
if [ "$USE_DOCKER" = true ]; then
  echo ""
  echo "📦 Démarrage de PostgreSQL via Docker..."
  docker-compose -f docker-compose.db.yml up -d
  
  # Wait for PostgreSQL to be ready
  echo "⏳ Attente du démarrage de PostgreSQL..."
  for i in {1..30}; do
    if docker exec micro-gestion-postgres pg_isready -U postgres &> /dev/null; then
      echo "✅ PostgreSQL est prêt"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "❌ PostgreSQL n'a pas démarré à temps"
      exit 1
    fi
    sleep 1
  done
fi

# Check if database exists
echo ""
echo "🔍 Vérification de la base de données..."

if [ "$USE_DOCKER" = true ]; then
  DB_CHECK=$(docker exec micro-gestion-postgres psql -U $DB_USER -l 2>/dev/null | grep $DB_NAME || echo "")
else
  DB_CHECK=$(psql -U $DB_USER -l 2>/dev/null | grep $DB_NAME || echo "")
fi

if [ -z "$DB_CHECK" ]; then
  echo "📚 Création de la base de données..."
  
  if [ "$USE_DOCKER" = true ]; then
    docker exec micro-gestion-postgres createdb -U $DB_USER -E UTF8 -l fr_FR.UTF-8 $DB_NAME
  else
    createdb -U $DB_USER -E UTF8 -l fr_FR.UTF-8 $DB_NAME
  fi
  
  echo "✅ Base de données créée"
else
  echo "✅ Base de données existe déjà"
fi

# Apply migrations
echo ""
echo "📋 Application des migrations..."

if [ "$USE_DOCKER" = true ]; then
  docker exec micro-gestion-postgres psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/001_initial_schema.sql
else
  psql -U $DB_USER -d $DB_NAME -f database/migrations/001_initial_schema.sql
fi

echo "✅ Migrations appliquées"

# Load seed data if requested
if [ "$SEED" = true ]; then
  echo ""
  echo "🌱 Chargement des données de test..."
  
  if [ "$USE_DOCKER" = true ]; then
    docker exec micro-gestion-postgres psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/seeds/seed.sql
  else
    psql -U $DB_USER -d $DB_NAME -f database/seeds/seed.sql
  fi
  
  echo "✅ Données de test chargées"
fi

# Verify installation
echo ""
echo "✅ Vérification..."

if [ "$USE_DOCKER" = true ]; then
  TABLES=$(docker exec micro-gestion-postgres psql -U $DB_USER -d $DB_NAME -c "\dt" 2>/dev/null | wc -l)
else
  TABLES=$(psql -U $DB_USER -d $DB_NAME -c "\dt" 2>/dev/null | wc -l)
fi

if [ $TABLES -gt 5 ]; then
  echo "✅ Tables créées: $(($TABLES - 3))"
else
  echo "❌ Erreur lors de la création des tables"
  exit 1
fi

# Display connection info
echo ""
echo "=================================================="
echo "🎉 Configuration terminez avec succès!"
echo "=================================================="
echo ""
echo "📊 Informations de connexion:"
echo "   Hôte:     $DB_HOST"
echo "   Port:     $DB_PORT"
echo "   Base:     $DB_NAME"
echo "   Utilisateur: $DB_USER"
echo ""

if [ "$USE_DOCKER" = true ]; then
  echo "🌐 pgAdmin: http://localhost:5050"
  echo "   Email: admin@example.com"
  echo "   Mot de passe: admin"
  echo ""
  echo "Connecter dans pgAdmin:"
  echo "   Hostname: postgres"
  echo "   Port: 5432"
  echo "   Nom d'utilisateur: postgres"
  echo "   Mot de passe: postgres"
else
  echo "Connexion locale:"
  echo "   psql -U $DB_USER -d $DB_NAME"
fi

echo ""
echo "📚 Documentation:"
echo "   - database/README.md"
echo "   - database/INTEGRATION_GUIDE.md"
echo "   - database/SQL_QUERIES.md"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. Configurer .env avec vos paramètres"
echo "   2. npm install pg dotenv"
echo "   3. npm run dev (ou dev:with-api)"
echo ""

exit 0
