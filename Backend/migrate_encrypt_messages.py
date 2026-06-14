"""One-time migration: encrypt plaintext chat messages already stored in MySQL.

Usage:
    python migrate_encrypt_messages.py --dry-run
    python migrate_encrypt_messages.py
"""

import argparse

from config import get_db_connection
from utils.message_encryption import encrypt_message_text


def _is_already_encrypted(value):
    return isinstance(value, str) and value.startswith("enc:")


def _migrate_table(connection, table_name, id_column):
    """Encrypt plaintext MessageText values for one table."""
    select_sql = f"SELECT {id_column}, MessageText FROM {table_name}"
    update_sql = f"UPDATE {table_name} SET MessageText = %s WHERE {id_column} = %s"

    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(select_sql)
        rows = cursor.fetchall()
    finally:
        cursor.close()

    total = len(rows)
    already_encrypted = 0
    to_encrypt = []

    for row in rows:
        message_id = row[id_column]
        message_text = row.get("MessageText")

        if _is_already_encrypted(message_text):
            already_encrypted += 1
            continue

        if message_text is None:
            # Defensive skip, schema says NOT NULL but old data may vary.
            continue

        encrypted = encrypt_message_text(message_text)
        to_encrypt.append((encrypted, message_id))

    return {
        "table": table_name,
        "total": total,
        "already_encrypted": already_encrypted,
        "to_encrypt": to_encrypt,
        "update_sql": update_sql,
    }


def run_migration(dry_run=False):
    connection = get_db_connection()
    if not connection:
        print("Database connection failed.")
        return 1

    plans = []
    try:
        plans.append(_migrate_table(connection, "Messages", "MessageID"))
        plans.append(_migrate_table(connection, "AdminMessages", "AdminMessageID"))

        total_rows = sum(plan["total"] for plan in plans)
        total_already = sum(plan["already_encrypted"] for plan in plans)
        total_to_encrypt = sum(len(plan["to_encrypt"]) for plan in plans)

        print("Message encryption migration summary")
        print("----------------------------------")
        for plan in plans:
            print(
                f"{plan['table']}: total={plan['total']}, "
                f"already_encrypted={plan['already_encrypted']}, "
                f"to_encrypt={len(plan['to_encrypt'])}"
            )
        print(f"All tables: total={total_rows}, already_encrypted={total_already}, to_encrypt={total_to_encrypt}")

        if dry_run:
            print("Dry run mode enabled. No rows were updated.")
            return 0

        if total_to_encrypt == 0:
            print("No plaintext rows found. Nothing to migrate.")
            return 0

        write_cursor = connection.cursor()
        try:
            for plan in plans:
                if not plan["to_encrypt"]:
                    continue
                write_cursor.executemany(plan["update_sql"], plan["to_encrypt"])
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            write_cursor.close()

        print("Migration complete. Plaintext messages have been encrypted.")
        return 0

    except Exception as exc:
        print(f"Migration failed: {exc}")
        return 1
    finally:
        connection.close()


def main():
    parser = argparse.ArgumentParser(
        description="Encrypt existing plaintext rows in Messages/AdminMessages"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show counts without updating rows",
    )
    args = parser.parse_args()

    raise SystemExit(run_migration(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
