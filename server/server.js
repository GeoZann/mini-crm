const express = require('express');
const cors = require('cors');
const sql = require('seriate');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_key_123'; 

// Set up database connection using seriate
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

// Middleware for JWT Authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// AUTH & USERS ROUTES
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const queryText = `SELECT * FROM Users WHERE Username = '${username}' AND Password = '${password}'`;
        const result = await sql.execute({ query: queryText });
        
        if (result && result.length > 0) {
            const user = result[0];
            const token = jwt.sign({ id: user.ID, username: user.Username }, JWT_SECRET, { expiresIn: '2h' });
            res.json({ token, user: { id: user.ID, username: user.Username } });
        } else {
            res.status(401).send("Invalid credentials");
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).send("Server error");
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    const { username, password } = req.body;
    try {
        const queryText = `INSERT INTO Users (Username, Password) VALUES ('${username}', '${password}')`;
        await sql.execute({ query: queryText });
        res.status(201).send("User created");
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const result = await sql.execute({ query: 'SELECT ID, Username FROM Users' });
        res.json(result);
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// CUSTOMERS ROUTES
app.get('/api/customers', authenticateToken, async (req, res) => {
    const searchName = req.query.name || '';
    try {
        const queryText = `SELECT * FROM Customers WHERE FirstName LIKE '%${searchName}%' OR LastName LIKE '%${searchName}%' ORDER BY RegistrationDate DESC`;
        const result = await sql.execute({ query: queryText });
        res.json(result);
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
    const { firstName, lastName, email } = req.body;
    try {
        const queryText = `INSERT INTO Customers (FirstName, LastName, Email) VALUES ('${firstName}', '${lastName}', '${email}')`;
        await sql.execute({ query: queryText });
        res.status(201).send("Customer added");
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
    try {
        await sql.execute({ query: `DELETE FROM Customers WHERE ID = ${req.params.id}` });
        res.send("Customer deleted");
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// TASKS ROUTES
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const queryText = `
            SELECT t.ID, t.Description, t.StartDate, t.EndDate, t.Status,
                   c.FirstName + ' ' + c.LastName AS CustomerName,
                   u.Username AS EmployeeName
            FROM Tasks t
            INNER JOIN Customers c ON t.CustomerID = c.ID
            INNER JOIN Users u ON t.EmployeeID = u.ID
            ORDER BY t.StartDate DESC
        `;
        const result = await sql.execute({ query: queryText });
        res.json(result);
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { customerId, employeeId, description, endDate } = req.body;
    const safeDescription = description.replace(/'/g, "''");
    const endDateSql = endDate ? `'${endDate}'` : 'NULL';
    try {
        const queryText = `
            INSERT INTO Tasks (CustomerID, EmployeeID, Description, EndDate)
            VALUES (${customerId}, ${employeeId}, '${safeDescription}', ${endDateSql})
        `;
        await sql.execute({ query: queryText });
        res.status(201).send("Task created");
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.put('/api/tasks/:id/complete', authenticateToken, async (req, res) => {
    try {
        await sql.execute({ query: `UPDATE Tasks SET Status = N'Ολοκληρωμένο' WHERE ID = ${req.params.id}` });
        res.send("Task updated");
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        await sql.execute({ query: `DELETE FROM Tasks WHERE ID = ${req.params.id}` });
        res.send("Task deleted");
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// CATEGORIES ROUTE
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const result = await sql.execute({ query: 'SELECT * FROM Categories ORDER BY Name' });
        res.json(result);
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// INTERACTIONS ROUTES
app.get('/api/customers/:id/interactions', authenticateToken, async (req, res) => {
    try {
        const queryText = `
            SELECT i.ID, i.InteractionDate, i.Notes,
                   u.Username AS EmployeeName,
                   cat.Name AS CategoryName
            FROM Interactions i
            INNER JOIN Users u ON i.EmployeeID = u.ID
            INNER JOIN Categories cat ON i.CategoryID = cat.ID
            WHERE i.CustomerID = ${req.params.id}
            ORDER BY i.InteractionDate DESC
        `;
        const result = await sql.execute({ query: queryText });
        res.json(result);
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.post('/api/customers/:id/interactions', authenticateToken, async (req, res) => {
    const customerId = req.params.id;
    const employeeId = req.user.id; 
    const { categoryId, notes } = req.body;
    const safeNotes = notes.replace(/'/g, "''");

    try {
        const queryText = `
            INSERT INTO Interactions (CustomerID, EmployeeID, CategoryID, Notes)
            VALUES (${customerId}, ${employeeId}, ${categoryId}, '${safeNotes}')
        `;
        await sql.execute({ query: queryText });
        res.status(201).send("Interaction logged");
    } catch (error) {
        res.status(500).send("Server error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});