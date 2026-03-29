# Password Migration Guide

Αυτό το script μετατρέπει όλα τα plaintext passwords σε encrypted passwords χρησιμοποιώντας bcrypt.

## Πώς να το τρέξετε:

```bash
cd server
node migrate-passwords.js
```

## Τι κάνει:

1. ✅ Διαβάζει όλους τους χρήστες από τη database
2. ✅ Χαρακτηρίζει ποια passwords είναι ήδη hashed (πηδάει αυτά)
3. ✅ Hash τα plaintext passwords χρησιμοποιώντας bcrypt (rounds: 10)
4. ✅ Ενημερώνει τη database με τα νέα encrypted passwords
5. ✅ Εμφανίζει αναφορά με τα αποτελέσματα

## Αποτέλεσμα:

```
🔄 Starting password migration...

📋 Found 3 user(s) to migrate:

✅ Migrated "admin"
✅ Migrated "user1"
⏭️  Skipping "user2" - password already hashed

📊 Migration complete!
   ✅ Migrated: 2
   ⏭️  Skipped: 1
```

## ⚠️ Σημαντικό:

- Χρειάζεται να δουλεύει το server (connection στη database)
- Αν προκληθεί λάθος, δε θα αλλάξει κανένα password
- Μπορεί να τρέξει πολλές φορές με ασφάλεια (θα skip τα ήδη hashed)

## 🔒 Μετά τη migration:

Όλοι οι χρήστες θα πρέπει να ξανακάνουν login και το σύστημα θα χρησιμοποιήσει bcrypt για σύγκριση.
