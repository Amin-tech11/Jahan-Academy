ALTER TABLE consultation_bookings DROP COLUMN IF EXISTS order_id;
ALTER TABLE enrolments DROP COLUMN IF EXISTS order_item_id;
DROP TABLE IF EXISTS invoices, refunds, payment_events, payments, order_items, orders, product_prices, product_translations, products;
