const express = require('express');
const cors = require('cors');
const sql = require('seriate');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'; 

// Set up database connection using seriate
sql.setDefaultConfig({
    server: process.env.DB_SERVER || "localhost", 
    user: process.env.DB_USER || "crm_user",
    password: process.env.DB_PASSWORD || "CrmPassword123!",
    database: process.env.DB_NAME || "MiniCRM",
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', 
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
    }
});

// Rate Limiting Middleware
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: { error: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per 15 minutes
    message: { error: "Too many requests, please try again later" },
});

app.use(generalLimiter);

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
app.post('/api/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    
    try {
        const queryText = `SELECT * FROM Users WHERE Username = @username`;
        const result = await sql.execute({ 
            query: queryText,
            params: { 
                username: { val: username, type: sql.VARCHAR(255) }
            }
        });
        
        if (result && result.length > 0) {
            const user = result[0];
            
            // Compare passwords using bcrypt
            const isPasswordValid = await bcrypt.compare(password, user.Password);
            
            if (isPasswordValid) {
                const token = jwt.sign({ id: user.ID, username: user.Username }, JWT_SECRET, { expiresIn: '2h' });
                res.json({ token, user: { id: user.ID, username: user.Username } });
            } else {
                res.status(401).json({ error: "Invalid credentials" });
            }
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const queryText = `INSERT INTO Users (Username, Password) VALUES (@username, @password)`;
        await sql.execute({ 
            query: queryText,
            params: {
                username: { val: username, type: sql.VARCHAR(255) },
                password: { val: hashedPassword, type: sql.VARCHAR(255) }
            }
        });
        res.status(201).json({ message: "User created" });
    } catch (error) {
        console.error("Create user error:", error);
        if (error.message && error.message.includes('Unique')) {
            return res.status(409).json({ error: "Username already exists" });
        }
        res.status(500).json({ error: "Server error" });
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
        const queryText = `SELECT * FROM Customers WHERE FirstName LIKE @searchName OR LastName LIKE @searchName ORDER BY RegistrationDate DESC`;
        const result = await sql.execute({ 
            query: queryText,
            params: {
                searchName: { val: `%${searchName}%`, type: sql.VARCHAR(255) }
            }
        });
        res.json(result);
    } catch (error) {
        console.error("Fetch customers error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
    const { firstName, lastName, email } = req.body;
    
    // Basic validation
    if (!firstName || !lastName) {
        return res.status(400).json({ error: "First name and last name are required" });
    }
    
    try {
        const queryText = `INSERT INTO Customers (FirstName, LastName, Email) VALUES (@firstName, @lastName, @email)`;
        await sql.execute({ 
            query: queryText,
            params: {
                firstName: { val: firstName, type: sql.VARCHAR(255) },
                lastName: { val: lastName, type: sql.VARCHAR(255) },
                email: { val: email || null, type: sql.VARCHAR(255) }
            }
        });
        res.status(201).json({ message: "Customer added" });
    } catch (error) {
        console.error("Add customer error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
    const customerId = req.params.id;
    
    // Validate ID is a number
    if (isNaN(customerId)) {
        return res.status(400).json({ error: "Invalid customer ID" });
    }
    
    try {
        const queryText = `DELETE FROM Customers WHERE ID = @id`;
        await sql.execute({ 
            query: queryText,
            params: {
                id: { val: customerId, type: sql.INT }
            }
        });
        res.json({ message: "Customer deleted" });
    } catch (error) {
        console.error("Delete customer error:", error);
        res.status(500).json({ error: "Server error" });
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
    
    // Validate required fields
    if (!customerId || !employeeId || !description) {
        return res.status(400).json({ error: "customerId, employeeId, and description are required" });
    }
    
    if (isNaN(customerId) || isNaN(employeeId)) {
        return res.status(400).json({ error: "Invalid customerId or employeeId" });
    }
    
    try {
        const queryText = `
            INSERT INTO Tasks (CustomerID, EmployeeID, Description, EndDate)
            VALUES (@customerId, @employeeId, @description, @endDate)
        `;
        await sql.execute({ 
            query: queryText,
            params: {
                customerId: { val: customerId, type: sql.INT },
                employeeId: { val: employeeId, type: sql.INT },
                description: { val: description, type: sql.VARCHAR(500) },
                endDate: { val: endDate || null, type: sql.DATETIME }
            }
        });
        res.status(201).json({ message: "Task created" });
    } catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.put('/api/tasks/:id/complete', authenticateToken, async (req, res) => {
    const taskId = req.params.id;
    
    if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }
    
    try {
        const queryText = `UPDATE Tasks SET Status = @status WHERE ID = @id`;
        await sql.execute({ 
            query: queryText,
            params: {
                status: { val: 'Ολοκληρωμένο', type: sql.NVARCHAR(50) },
                id: { val: taskId, type: sql.INT }
            }
        });
        res.json({ message: "Task updated" });
    } catch (error) {
        console.error("Update task error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    const taskId = req.params.id;
    
    if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }
    
    try {
        const queryText = `DELETE FROM Tasks WHERE ID = @id`;
        await sql.execute({ 
            query: queryText,
            params: {
                id: { val: taskId, type: sql.INT }
            }
        });
        res.json({ message: "Task deleted" });
    } catch (error) {
        console.error("Delete task error:", error);
        res.status(500).json({ error: "Server error" });
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
    const customerId = req.params.id;
    
    if (isNaN(customerId)) {
        return res.status(400).json({ error: "Invalid customer ID" });
    }
    
    try {
        const queryText = `
            SELECT i.ID, i.InteractionDate, i.Notes,
                   u.Username AS EmployeeName,
                   cat.Name AS CategoryName
            FROM Interactions i
            INNER JOIN Users u ON i.EmployeeID = u.ID
            INNER JOIN Categories cat ON i.CategoryID = cat.ID
            WHERE i.CustomerID = @customerId
            ORDER BY i.InteractionDate DESC
        `;
        const result = await sql.execute({ 
            query: queryText,
            params: {
                customerId: { val: customerId, type: sql.INT }
            }
        });
        res.json(result);
    } catch (error) {
        console.error("Fetch interactions error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/customers/:id/interactions', authenticateToken, async (req, res) => {
    const customerId = req.params.id;
    const employeeId = req.user.id; 
    const { categoryId, notes } = req.body;
    
    if (isNaN(customerId) || isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid customer ID or category ID" });
    }
    
    if (!notes) {
        return res.status(400).json({ error: "Notes are required" });
    }

    try {
        const queryText = `
            INSERT INTO Interactions (CustomerID, EmployeeID, CategoryID, Notes)
            VALUES (@customerId, @employeeId, @categoryId, @notes)
        `;
        await sql.execute({ 
            query: queryText,
            params: {
                customerId: { val: customerId, type: sql.INT },
                employeeId: { val: employeeId, type: sql.INT },
                categoryId: { val: categoryId, type: sql.INT },
                notes: { val: notes, type: sql.VARCHAR(500) }
            }
        });
        res.status(201).json({ message: "Interaction logged" });
    } catch (error) {
        console.error("Create interaction error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});