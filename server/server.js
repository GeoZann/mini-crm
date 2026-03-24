const express = require('express');
const cors = require('cors');
const sql = require('seriate');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors()); // Επιτρέπει κλήσεις από άλλο port (π.χ. από τη React)
app.use(express.json()); // Επιτρέπει στον server να διαβάζει JSON δεδομένα (για τα POST)

// Ρύθμιση σύνδεσης Seriate με τη Βάση (με τον user που φτιάξαμε)
sql.setDefaultConfig({
    server: "localhost", 
    user: "crm_user",
    password: "CrmPassword123!",
    database: "MiniCRM",
    options: {
        encrypt: false, 
        trustServerCertificate: true
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer

    if (!token) return res.status(401).send("Δεν παρέχεται token!");

    jwt.verify(token, 'my_super_secret_key', (err, user) => {
        if (err) return res.status(403).send("Μη έγκυρο token!");
        req.user = user;
        next();
    });
};

// ---------------------------------------------------------
// 1. GET: Αναζήτηση Πελατών (Καλεί το sp_SearchCustomers)
// ---------------------------------------------------------
app.get('/api/customers', authenticateToken, async (req, res) => {
    try {
        // Παίρνουμε το φίλτρο από το URL (π.χ. /api/customers?name=ZAN)
        const nameFilter = req.query.name || ''; 

        const results = await sql.execute({
            procedure: "sp_SearchCustomers",
            params: {
                LastNameStart: {
                    type: sql.VARCHAR,
                    val: nameFilter
                }
            }
        });

        // Στέλνουμε τα αποτελέσματα ως JSON στον client
        res.json(results[0] || []); 
    } catch (err) {
        console.error("Σφάλμα στην αναζήτηση:", err);
        res.status(500).send("Πρόβλημα με τον server");
    }
});

// ---------------------------------------------------------
// 2. POST: Νέος Πελάτης (Καλεί το sp_InsertCustomer)
// ---------------------------------------------------------
app.post('/api/customers', authenticateToken, async (req, res) => {
    try {
        // Τα δεδομένα έρχονται στο req.body από τη React
        const { firstName, lastName, email } = req.body;

        const results = await sql.execute({
            procedure: "sp_InsertCustomer",
            params: {
                FirstName: { type: sql.VARCHAR, val: firstName },
                LastName: { type: sql.VARCHAR, val: lastName },
                Email: { type: sql.VARCHAR, val: email }
            }
        });

        res.json(results[0]);
    } catch (err) {
        console.error("Σφάλμα στην εισαγωγή:", err);
        res.status(500).send("Πρόβλημα με τον server");
    }
});


// ΕΙΣΟΔΟΣ ΧΡΗΣΤΗ (LOGIN) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const queryText = `SELECT * FROM Users WHERE Username = '${username}' AND Password = '${password}'`;
        
        
        const result = await sql.execute({
            query: queryText
        });
        
        // Το Seriate επιστρέφει απευθείας τα δεδομένα σε πίνακα (array)
        if (result && result.length > 0) {
            // Δημιουργούμε το ψηφιακό πάσο (Token)
            const token = jwt.sign({ username: username }, 'my_super_secret_key', { expiresIn: '2h' });
            res.json({ token: token });
        } else {
            res.status(401).send("Λάθος όνομα χρήστη ή κωδικός!");
        }
    } catch (error) {
        console.error("Σφάλμα στο Login:", error);
        res.status(500).send("Σφάλμα διακομιστή");
    }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {

    const customerId = req.params.id;

    try {

        const queryText = `DELETE FROM Customers WHERE ID = ${customerId}`;
        await sql.execute({
            query: queryText
        });
        res.status(200).send("Ο πελάτης διαγράφηκε με επιτυχία!");
    } catch (error) {
        console.error("Σφάλμα στη διαγραφή:", error);
        res.status(500).send("Σφάλμα διακομιστή");

    }
});

// ==========================================================
// --- ΝΕΑ ENDPOINTS: ΣΗΜΕΙΩΣΕΙΣ ΠΕΛΑΤΩΝ (CUSTOMER NOTES) ---
// ==========================================================

// 1. Λήψη (Διάβασμα) των σημειώσεων ενός πελάτη
app.get('/api/customers/:id/notes', authenticateToken, async (req, res) => {
    const customerId = req.params.id; // Παίρνουμε το ID από το URL

    try {
        // Φέρνουμε τις σημειώσεις και τις βάζουμε στη σειρά: οι πιο πρόσφατες ΠΑΝΩ (DESC)
        const queryText = `
            SELECT ID, NoteText, CreatedAt 
            FROM CustomerNotes 
            WHERE CustomerID = ${customerId} 
            ORDER BY CreatedAt DESC
        `;
        
        const response = await sql.execute({ query: queryText });
        
        // Στέλνουμε τις σημειώσεις στη React
        res.json(response);
    } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση σημειώσεων:", error);
        res.status(500).send("Σφάλμα διακομιστή.");
    }
});

// 2. Προσθήκη νέας σημείωσης σε έναν πελάτη
app.post('/api/customers/:id/notes', authenticateToken, async (req, res) => {
    const customerId = req.params.id;
    
    // Προστασία από "σπάσιμο" κώδικα: Αν ο χρήστης γράψει απόστροφο (π.χ. "δεν τ' ακούω"), 
    // το .replace το κάνει διπλή απόστροφο για να μην μπερδευτεί η SQL!
    const safeNoteText = req.body.noteText.replace(/'/g, "''"); 

    try {
        const queryText = `
            INSERT INTO CustomerNotes (CustomerID, NoteText) 
            VALUES (${customerId}, '${safeNoteText}')
        `;
        
        await sql.execute({ query: queryText });
        
        res.status(201).send("Η σημείωση αποθηκεύτηκε επιτυχώς!");
    } catch (error) {
        console.error("Σφάλμα κατά την αποθήκευση σημείωσης:", error);
        res.status(500).send("Σφάλμα διακομιστή.");
    }
});

// ==========================================================
// --- ΝΕΑ ENDPOINTS: ΔΙΑΧΕΙΡΙΣΗ TASKS (ΕΡΓΑΣΙΩΝ) ---
// ==========================================================

// 1. Φέρνουμε όλους τους χρήστες (Για το Dropdown επιλογής υπαλλήλου στη React)
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const queryText = `SELECT ID, Username FROM Users ORDER BY Username ASC`;
        const response = await sql.execute({ query: queryText });
        res.json(response);
    } catch (error) {
        console.error("Σφάλμα:", error);
        res.status(500).send("Σφάλμα ανάκτησης χρηστών.");
    }
});

// 2. Δημιουργία Νέου Χρήστη
app.post('/api/users', authenticateToken, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Ελέγχουμε αν ο χρήστης υπάρχει ήδη
        const checkQuery = `SELECT COUNT(*) as count FROM Users WHERE Username = '${username}'`;
        const checkResult = await sql.execute({ query: checkQuery });
        
        if (checkResult && checkResult[0] && checkResult[0].count > 0) {
            return res.status(400).send("Ο χρήστης υπάρχει ήδη!");
        }
        
        // Εισάγουμε τον νέο χρήστη
        const insertQuery = `INSERT INTO Users (Username, Password) VALUES ('${username}', '${password}')`;
        await sql.execute({ query: insertQuery });
        
        res.status(201).send("Ο χρήστης δημιουργήθηκε επιτυχώς!");
    } catch (error) {
        console.error("Σφάλμα:", error);
        res.status(500).send("Σφάλμα δημιουργίας χρήστη.");
    }
});

// 2. Φέρνουμε όλα τα Tasks ΕΝΩΜΕΝΑ με τα ονόματα Πελατών και Χρηστών (JOIN)
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const queryText = `
            SELECT 
                t.ID, 
                t.Description, 
                t.StartDate, 
                t.EndDate, 
                t.Status,
                c.FirstName + ' ' + c.LastName AS CustomerName,
                u.Username AS AssignedTo
            FROM Tasks t
            INNER JOIN Customers c ON t.CustomerID = c.ID
            INNER JOIN Users u ON t.EmployeeID = u.ID
            ORDER BY t.StartDate DESC
        `;
        const response = await sql.execute({ query: queryText });
        res.json(response);
    } catch (error) {
        console.error("Σφάλμα:", error);
        res.status(500).send("Σφάλμα ανάκτησης tasks.");
    }
});

// 3. Δημιουργία Νέου Task
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { customerId, userId, description, endDate } = req.body;
    
    const safeDescription = description.replace(/'/g, "''");
    // Αν δεν έβαλε ημερομηνία λήξης, στέλνουμε NULL στην SQL. Αλλιώς, τη βάζουμε σε 'αυτάκια'
    const endDateSql = endDate ? `'${endDate}'` : 'NULL';

    try {
        const queryText = `
            INSERT INTO Tasks (CustomerID, EmployeeID, Description, EndDate)
            VALUES (${customerId}, ${userId}, '${safeDescription}', ${endDateSql})
        `;
        await sql.execute({ query: queryText });
        res.status(201).send("Το Task αποθηκεύτηκε επιτυχώς!");
    } catch (error) {
        console.error("Σφάλμα:", error);
        res.status(500).send("Σφάλμα αποθήκευσης task.");
    }
});

// 4. Ενημέρωση Task (Αλλαγή σε 'Ολοκληρωμένο')
app.put('/api/tasks/:id/complete', authenticateToken, async (req, res) => {
    const taskId = req.params.id;
    try {
        // Αλλάζουμε το Status
        const queryText = `UPDATE Tasks SET Status = N'Ολοκληρωμένο' WHERE ID = ${taskId}`;
        await sql.execute({ query: queryText });
        res.send("Το Task ολοκληρώθηκε!");
    } catch (error) {
        console.error("Σφάλμα:", error);
        res.status(500).send("Σφάλμα ενημέρωσης task.");
    }
});

// 5. Διαγραφή Task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    const taskId = req.params.id;
    try {
        const queryText = `DELETE FROM Tasks WHERE ID = ${taskId}`;
        await sql.execute({ query: queryText });
        res.send("Το Task διαγράφηκε επιτυχώς!");
    } catch (error) {
        console.error("Σφάλμα διαγραφής task:", error);
        res.status(500).send("Σφάλμα διακομιστή.");
    }
});

// Ξεκινάμε τον server να ακούει στην πόρτα 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Ο Server τρέχει με επιτυχία στο http://localhost:${PORT}`);
});