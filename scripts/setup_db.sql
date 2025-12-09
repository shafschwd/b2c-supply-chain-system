-- Database Setup Script

-- 1. Create User (if not exists)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'scm_user') THEN
      CREATE ROLE scm_user LOGIN PASSWORD '123456';
   END IF;
END
$do$;

-- 2. Create Database (Run this separately if needed, or ignore error if exists)
-- CREATE DATABASE supply_chain_db OWNER scm_user;

-- 3. Connect to database (Works in psql)
\c supply_chain_db;

-- 4. Create Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'LOGISTICS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CONFIRMED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Create Tables
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    address TEXT,
    wallet_balance NUMERIC(12, 2) DEFAULT 0.00,
    password_hash TEXT
);

CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(255) PRIMARY KEY,
    seller_id VARCHAR(255) REFERENCES users(id),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(255) PRIMARY KEY,
    buyer_id VARCHAR(255) REFERENCES users(id),
    item_id VARCHAR(255) REFERENCES items(id),
    quantity INTEGER NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    current_status order_status NOT NULL,
    order_timestamp TIMESTAMPTZ DEFAULT NOW(),
    blockchain_tx_hash VARCHAR(255),
    payment_collected BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS shipments (
    shipment_id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES orders(order_id) UNIQUE,
    logistics_id VARCHAR(255) REFERENCES users(id),
    current_location VARCHAR(255),
    last_update TIMESTAMPTZ DEFAULT NOW(),
    estimated_arrival VARCHAR(255)
);

-- 6. Functions
CREATE OR REPLACE FUNCTION create_item_function(
    p_id VARCHAR,
    p_seller_id VARCHAR,
    p_item_name VARCHAR,
    p_description VARCHAR,
    p_price NUMERIC,
    p_stock INTEGER,
    p_image_url VARCHAR
)
RETURNS SETOF items AS
$$
BEGIN
    RETURN QUERY
    INSERT INTO items (
        id, seller_id, item_name, description, price, stock, image_url, created_at
    )
    VALUES (
        p_id,
        p_seller_id,
        p_item_name,
        p_description,
        p_price,
        p_stock,
        p_image_url,
        NOW()
    )
    RETURNING *;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_item_function(
    p_id VARCHAR,
    p_item_name VARCHAR,
    p_description VARCHAR,
    p_price NUMERIC,
    p_stock INTEGER,
    p_image_url VARCHAR
)
RETURNS SETOF items AS
$$
BEGIN
    RETURN QUERY
    UPDATE items
    SET
        item_name = p_item_name,
        description = p_description,
        price = p_price,
        stock = p_stock,
        image_url = p_image_url
    WHERE
        id = p_id
    RETURNING *;
END;
$$
LANGUAGE plpgsql;

-- Grant privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO scm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scm_user;
