BEGIN;

DO $$
DECLARE
    public_table_count integer;
    required_table text;
BEGIN
    SELECT count(*) INTO public_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    IF public_table_count < 75 THEN
        RAISE EXCEPTION 'Expected at least 75 public tables, found %', public_table_count;
    END IF;

    FOREACH required_table IN ARRAY ARRAY[
        'users','roles','countries','universities','programs','leads','applications',
        'documents','courses','enrolments','orders','payments','tickets',
        'notifications','integration_outbox','audit_logs','currencies','currency_translations',
        'intake_translations'
    ] LOOP
        IF to_regclass('public.' || required_table) IS NULL THEN
            RAISE EXCEPTION 'Required table % is missing', required_table;
        END IF;
    END LOOP;
END $$;

DO $$
BEGIN
    BEGIN
        INSERT INTO users (status) VALUES ('invalid_status');
        RAISE EXCEPTION 'users.status CHECK constraint did not reject invalid value';
    EXCEPTION WHEN check_violation THEN
        NULL;
    END;
END $$;

DO $$
BEGIN
    BEGIN
        INSERT INTO orders (public_reference, user_id, currency, subtotal_minor, discount_minor, tax_minor, total_minor)
        VALUES ('TEST-INVALID', gen_random_uuid(), 'EUR', 1000, 0, 0, 900);
        RAISE EXCEPTION 'orders total/FK constraints did not reject invalid row';
    EXCEPTION WHEN check_violation OR foreign_key_violation THEN
        NULL;
    END;
END $$;

ROLLBACK;
