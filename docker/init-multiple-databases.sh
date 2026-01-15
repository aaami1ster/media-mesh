#!/bin/bash
set -e

# Initialize all MediaMesh databases
# This script creates separate databases for each microservice following the "Database per Service" pattern

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Auth Service Database
    CREATE DATABASE auth_db;
    
    -- CMS Service Database
    CREATE DATABASE cms_db;
    
    -- Metadata Service Database
    CREATE DATABASE metadata_db;
    
    -- Media Service Database
    CREATE DATABASE media_db;
    
    -- Discovery Service Database
    CREATE DATABASE discovery_db;
    
    -- Ingest Service Database
    CREATE DATABASE ingest_db;
    
    -- Search/Indexing Service Database
    CREATE DATABASE search_db;
    
    -- Grant privileges to all databases
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE cms_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE metadata_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE media_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE discovery_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE ingest_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE search_db TO $POSTGRES_USER;
EOSQL

echo "✅ All MediaMesh databases created successfully!"