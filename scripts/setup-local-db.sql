-- Run once as the PostgreSQL superuser (usually "postgres").
-- Creates the FitX Gym app user + database to match .env / docker-compose defaults.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fitx') THEN
    CREATE ROLE fitx LOGIN PASSWORD 'fitx_dev_password';
  ELSE
    ALTER ROLE fitx WITH LOGIN PASSWORD 'fitx_dev_password';
  END IF;
END
$$;

SELECT format('CREATE DATABASE %I OWNER fitx', 'fitxgym')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fitxgym')
\gexec

GRANT ALL PRIVILEGES ON DATABASE fitxgym TO fitx;
