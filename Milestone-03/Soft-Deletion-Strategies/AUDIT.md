# Deletion Audit – LedgerApp

This document lists every hard delete in the codebase before the soft-delete refactor.

| File          | Line | Table        | What is permanently lost |
| ------------- | ----:| ------------ | ------------------------- |
| accounts.js   | 43   | accounts     | Permanently removes an account row so the user’s account record and any historical context about that account cannot be recovered for audits. |
| transactions.js | 43 | transactions | Permanently removes a transaction row so the financial movement (amount, date, account linkage) is lost, breaking any future reconciliation or dispute checks. |
| users.js      | 44   | users        | Permanently removes a user record so their identity, associated accounts, and history can no longer be inspected or restored. |