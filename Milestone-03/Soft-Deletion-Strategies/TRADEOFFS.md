# Soft Deletion Tradeoffs – LedgerApp

## Storage growth over time

With hard deletes, the `users`, `accounts`, and `transactions` tables would roughly track only currently active records, because deleted rows are physically removed. With soft deletes, **every deletion becomes a retained row**, which means the tables grow monotonically over time instead of stabilizing. [web:71][web:76]

For LedgerApp, if we assume:

- 1,000 active users.
- Each user has 2 accounts on average.
- Each account records 50 transactions per month.

That produces `1,000 * 2 * 50 = 100,000` new transaction rows per month. If 10% of those transactions are later “deleted” by users (corrections, disputes, cleanup), that adds **10,000 soft-deleted transactions per month** that never leave the `transactions` table. Over a year, that is about **120,000 deleted + 1.2 million active transaction rows**, and everything stays in a single table. [web:69][web:71]

The same pattern applies to `users` and `accounts`: even though the absolute volumes are smaller, we retain all historical rows instead of physically trimming the table. The benefit is auditability; the cost is larger tables on disk and more rows for the query planner to consider.

## What the partial index fixes

All typical LedgerApp queries filter only active records by `deleted_at IS NULL`. Without any indexes on this condition, PostgreSQL would increasingly need to scan a large table where many rows are soft deleted. [web:51][web:70][web:73]

The partial indexes:

```sql
CREATE INDEX idx_users_active ON users (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_active ON accounts (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_active ON transactions (id) WHERE deleted_at IS NULL;
```

(or their more realistic `email`, `user_id`, `account_id` variants)

only include **active rows**, so if 80% of historical records are soft-deleted, the index is built on the remaining 20%. That makes lookups like `SELECT * FROM transactions WHERE account_id = $1 AND deleted_at IS NULL` much faster, because the planner can use a small, dense index instead of scanning or using a massive index that includes deleted rows. [web:51][web:68][web:70][web:72]

In other words, the partial index solves the problem that soft deletes gradually degrade query performance by bloating tables and full indexes with mostly inactive data. It concentrates the index only on rows the application actually needs in normal traffic.

## When soft delete performance becomes a concern

Soft deletes start to hurt when the number of retained historical rows is large compared to currently active rows, and queries still hit the main table. A rough rule of thumb from real-world discussions is that once you are in the **millions of rows** range, and especially when >70–80% of them are soft-deleted, you must actively manage performance. [web:69][web:74][web:79]

For LedgerApp, using the earlier example:

- 100,000 new transactions per month.
- 12 months → about 1.2 million total transaction rows.
- If 30% of them are soft-deleted (corrections, reversals, account closures), you have ~360,000 deleted and ~840,000 active rows.

At around **1–2 million rows** in a single `transactions` table, simple queries like `SELECT * FROM transactions WHERE account_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50` will start to show noticeable latency without partial or composite indexes tailored for the soft-delete pattern. Beyond that (say 5–10 million rows), you would likely need a periodic archival strategy (moving very old deleted rows into separate archive tables) to avoid unbounded growth. [web:69][web:74][web:79]