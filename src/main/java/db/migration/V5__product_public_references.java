package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import java.util.UUID;

/** Assign stable random references without changing internal IDs or order relationships. */
public class V5__product_public_references extends BaseJavaMigration {
    @Override public Integer getChecksum() { return 1; }

    @Override public void migrate(Context context) throws Exception {
        var connection = context.getConnection();
        try (var statement = connection.createStatement()) {
            statement.execute("ALTER TABLE products ADD COLUMN public_id VARCHAR(36)");
        }
        try (var select = connection.createStatement();
             var rows = select.executeQuery("SELECT id FROM products ORDER BY id");
             var update = connection.prepareStatement("UPDATE products SET public_id=? WHERE id=?")) {
            while (rows.next()) {
                update.setString(1, UUID.randomUUID().toString());
                update.setLong(2, rows.getLong(1));
                update.executeUpdate();
            }
        }
        try (var statement = connection.createStatement()) {
            statement.execute("ALTER TABLE products ALTER COLUMN public_id SET NOT NULL");
            statement.execute("ALTER TABLE products ADD CONSTRAINT products_public_id_unique UNIQUE (public_id)");
        }
    }
}
