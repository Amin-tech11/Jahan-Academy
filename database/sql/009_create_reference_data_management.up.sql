ALTER TABLE cities
    ADD COLUMN active boolean NOT NULL DEFAULT true,
    ADD COLUMN display_order integer NOT NULL DEFAULT 0,
    ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    ADD COLUMN deleted_at timestamptz;

ALTER TABLE countries
    ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0);

ALTER TABLE city_translations
    ADD COLUMN description text,
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE academic_levels
    ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE academic_level_translations
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE fields_of_study
    ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE field_of_study_translations
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE intakes
    ADD COLUMN active boolean NOT NULL DEFAULT true,
    ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE intake_translations (
    intake_id uuid NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(120) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (intake_id, locale)
);

CREATE TABLE currencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code char(3) NOT NULL UNIQUE CHECK (code = upper(code)),
    numeric_code char(3),
    symbol varchar(12) NOT NULL,
    decimal_places smallint NOT NULL DEFAULT 2 CHECK (decimal_places BETWEEN 0 AND 4),
    active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE currency_translations (
    currency_id uuid NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    locale varchar(5) NOT NULL CHECK (locale IN ('fa','en')),
    name varchar(120) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (currency_id, locale)
);

CREATE INDEX ix_cities_reference_list ON cities(country_id, active, display_order)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_academic_levels_reference_list ON academic_levels(active, display_order);
CREATE INDEX ix_fields_of_study_reference_list ON fields_of_study(active, display_order);
CREATE INDEX ix_intakes_reference_list ON intakes(active, display_order);
CREATE INDEX ix_currencies_reference_list ON currencies(active, display_order);

INSERT INTO intake_translations (intake_id, locale, name)
SELECT id, values.locale, values.name
FROM intakes
JOIN (VALUES
    ('spring', 'fa', 'بهار'), ('spring', 'en', 'Spring'),
    ('summer', 'fa', 'تابستان'), ('summer', 'en', 'Summer'),
    ('fall', 'fa', 'پاییز'), ('fall', 'en', 'Fall'),
    ('winter', 'fa', 'زمستان'), ('winter', 'en', 'Winter'),
    ('unknown', 'fa', 'نامشخص'), ('unknown', 'en', 'Unknown')
) AS values(code, locale, name) ON values.code = intakes.code
ON CONFLICT (intake_id, locale) DO NOTHING;

INSERT INTO academic_levels (code, display_order) VALUES
    ('foundation', 10), ('bachelor', 20), ('master', 30), ('phd', 40)
ON CONFLICT (code) DO NOTHING;

INSERT INTO academic_level_translations (academic_level_id, locale, name)
SELECT id, values.locale, values.name
FROM academic_levels
JOIN (VALUES
    ('foundation', 'fa', 'دوره آماده‌سازی'), ('foundation', 'en', 'Foundation'),
    ('bachelor', 'fa', 'کارشناسی'), ('bachelor', 'en', 'Bachelor'),
    ('master', 'fa', 'کارشناسی ارشد'), ('master', 'en', 'Master'),
    ('phd', 'fa', 'دکتری'), ('phd', 'en', 'PhD')
) AS values(code, locale, name) ON values.code = academic_levels.code
ON CONFLICT (academic_level_id, locale) DO NOTHING;

INSERT INTO currencies (code, numeric_code, symbol, decimal_places, display_order) VALUES
    ('EUR', '978', '€', 2, 10),
    ('USD', '840', '$', 2, 20),
    ('GBP', '826', '£', 2, 30),
    ('CAD', '124', 'C$', 2, 40),
    ('AUD', '036', 'A$', 2, 50),
    ('IRR', '364', '﷼', 0, 60)
ON CONFLICT (code) DO NOTHING;

INSERT INTO currency_translations (currency_id, locale, name)
SELECT id, values.locale, values.name
FROM currencies
JOIN (VALUES
    ('EUR', 'fa', 'یورو'), ('EUR', 'en', 'Euro'),
    ('USD', 'fa', 'دلار آمریکا'), ('USD', 'en', 'US Dollar'),
    ('GBP', 'fa', 'پوند استرلینگ'), ('GBP', 'en', 'Pound Sterling'),
    ('CAD', 'fa', 'دلار کانادا'), ('CAD', 'en', 'Canadian Dollar'),
    ('AUD', 'fa', 'دلار استرالیا'), ('AUD', 'en', 'Australian Dollar'),
    ('IRR', 'fa', 'ریال ایران'), ('IRR', 'en', 'Iranian Rial')
) AS values(code, locale, name) ON values.code = currencies.code
ON CONFLICT (currency_id, locale) DO NOTHING;

INSERT INTO permissions (code, description) VALUES
    ('reference_data.read', 'View all reference data including inactive records'),
    ('reference_data.write', 'Create, edit, and archive reference data')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'super_admin'
  AND permissions.code IN ('reference_data.read', 'reference_data.write')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'content_editor'
  AND permissions.code IN ('reference_data.read', 'reference_data.write')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'support'
  AND permissions.code = 'reference_data.read'
ON CONFLICT DO NOTHING;
