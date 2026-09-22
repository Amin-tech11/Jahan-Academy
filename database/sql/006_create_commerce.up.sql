CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_type varchar(24) NOT NULL CHECK (product_type IN ('course','service','consultation','other')),
    reference_id uuid, sku varchar(80) NOT NULL UNIQUE, status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE product_translations (
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(220) NOT NULL, description text, PRIMARY KEY (product_id, locale)
);
CREATE TABLE product_prices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    currency char(3) NOT NULL, amount_minor bigint NOT NULL CHECK (amount_minor >= 0), market_country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
    starts_at timestamptz, ends_at timestamptz, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX ix_product_prices_lookup ON product_prices(product_id, currency, active, starts_at, ends_at);
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_reference varchar(24) NOT NULL UNIQUE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status varchar(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','awaiting_payment','paid','partially_refunded','refunded','cancelled','expired')),
    currency char(3) NOT NULL, subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0), discount_minor bigint NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
    tax_minor bigint NOT NULL DEFAULT 0 CHECK (tax_minor >= 0), total_minor bigint NOT NULL CHECK (total_minor >= 0),
    placed_at timestamptz, paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (total_minor = subtotal_minor - discount_minor + tax_minor)
);
CREATE INDEX ix_orders_user_created ON orders(user_id, created_at DESC);
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name_snapshot varchar(220) NOT NULL,
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0), unit_amount_minor bigint NOT NULL CHECK (unit_amount_minor >= 0),
    discount_minor bigint NOT NULL DEFAULT 0 CHECK (discount_minor >= 0), total_minor bigint NOT NULL CHECK (total_minor >= 0), metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CHECK (total_minor = quantity * unit_amount_minor - discount_minor)
);
CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    provider varchar(50) NOT NULL, provider_payment_id varchar(200), idempotency_key varchar(120) NOT NULL UNIQUE,
    status varchar(24) NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','authorized','succeeded','failed','cancelled','refunded','partially_refunded')),
    currency char(3) NOT NULL, amount_minor bigint NOT NULL CHECK (amount_minor >= 0), failure_code varchar(80),
    authorized_at timestamptz, succeeded_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_payment_id)
);
CREATE INDEX ix_payments_order ON payments(order_id, created_at DESC);
CREATE TABLE payment_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
    provider varchar(50) NOT NULL, provider_event_id varchar(200) NOT NULL, event_type varchar(80) NOT NULL,
    signature_verified boolean NOT NULL DEFAULT false, payload_safe jsonb NOT NULL DEFAULT '{}'::jsonb,
    received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, processing_error_safe text,
    UNIQUE (provider, provider_event_id)
);
CREATE TABLE refunds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    provider_refund_id varchar(200), amount_minor bigint NOT NULL CHECK (amount_minor > 0), currency char(3) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','cancelled')),
    reason varchar(300), requested_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, UNIQUE (payment_id, provider_refund_id)
);
CREATE TABLE invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    invoice_number varchar(60) NOT NULL UNIQUE, document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
    billing_snapshot jsonb NOT NULL, issued_at timestamptz NOT NULL DEFAULT now(), voided_at timestamptz
);

ALTER TABLE enrolments ADD COLUMN order_item_id uuid REFERENCES order_items(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX uq_enrolment_order_item ON enrolments(order_item_id) WHERE order_item_id IS NOT NULL;
ALTER TABLE consultation_bookings ADD COLUMN order_id uuid REFERENCES orders(id) ON DELETE SET NULL;
