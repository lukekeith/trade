# Database Setup

## Prerequisites

Install PostgreSQL 14+ on your system:
- **macOS**: `brew install postgresql@14`
- **Ubuntu**: `sudo apt-get install postgresql-14`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

## Initial Setup

1. Start PostgreSQL service:
```bash
# macOS
brew services start postgresql@14

# Ubuntu
sudo systemctl start postgresql

# Windows
# PostgreSQL should start automatically as a service
```

2. Create the database:
```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE trade;
CREATE USER tradeuser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE trade TO tradeuser;
\q
```

3. Run the schema:
```bash
psql -U tradeuser -d trade -f schema.sql
```

## Configuration

Update your `/app/.env` file with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trade
DB_USER=tradeuser
DB_PASSWORD=your_secure_password
```

## Migrations

Future database migrations will be placed in the `/database/migrations` directory.

To run migrations manually:
```bash
psql -U tradeuser -d trade -f migrations/001_migration_name.sql
```

## Data Retention

The schema includes tables for:
- **candles**: OHLCV price data (automatically purges 1m data older than 30 days)
- **user_settings**: User preferences and configuration
- **panel_configs**: Panel layout and widget settings
- **watchlists**: User symbol watchlists

## Backup

To backup the database:
```bash
pg_dump -U tradeuser trade > backup_$(date +%Y%m%d).sql
```

To restore:
```bash
psql -U tradeuser trade < backup_20250101.sql
```
