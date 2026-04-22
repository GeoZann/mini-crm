const express = require('express');
const cors = require('cors');
const sql = require('seriate');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_key_123'; 

// Database configuration
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

// --- HELPER FUNCTION: THE CLEANER ---
// Isopedwnei tis "mpampouskes" tou Seriate kai epistrefei mono ta kathara dedomena (Objects)
function extractData(result) {
    if (!result) return [];
    return result.flat(Infinity).filter(item => item && typeof item === 'object');
}

// JWT Authentication Middleware
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
    
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    
    try {
        const result = await sql.execute({ 
            procedure: "sp_GetUserByUsername",
            params: { 
                username: { val: username, type: sql.VARCHAR }
            }
        });
        
        const flatResult = extractData(result);
        const user = flatResult.find(item => item.Password !== undefined);
        
        if (user) {
            const safeInputPassword = String(password).trim();
            const safeDbPassword = String(user.Password).trim();
            
            if (safeInputPassword === safeDbPassword) {
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
    
    try {
        await sql.execute({ 
            procedure: "sp_InsertUser",
            params: {
                username: { val: username, type: sql.VARCHAR },
                password: { val: password, type: sql.VARCHAR }
            }
        });
        res.status(201).json({ message: "User created" });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const result = await sql.execute({ procedure: 'sp_GetUsers' });
        res.json(extractData(result));
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// CUSTOMERS ROUTES
app.get('/api/customers', authenticateToken, async (req, res) => {
    const searchName = req.query.name || '';
    try {
        const result = await sql.execute({ 
            procedure: "sp_SearchCustomers",
            params: {
                searchName: { val: `%${searchName}%`, type: sql.VARCHAR }
            }
        });
        res.json(extractData(result));
    } catch (error) {
        console.error("Fetch customers error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
    const { firstName, lastName, email } = req.body;
    
    try {
        await sql.execute({ 
            procedure: "sp_InsertCustomer",
            params: {
                firstName: { val: firstName, type: sql.VARCHAR },
                lastName: { val: lastName, type: sql.VARCHAR },
                email: { val: email || null, type: sql.VARCHAR }
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
    
    try {
        await sql.execute({ 
            procedure: "sp_DeleteCustomer",
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
        const result = await sql.execute({ procedure: 'sp_GetTasks' });
        res.json(extractData(result));
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { customerId, employeeId, description, endDate } = req.body;
    
    try {
        await sql.execute({ 
            procedure: "sp_InsertTask",
            params: {
                customerId: { val: customerId, type: sql.INT },
                employeeId: { val: employeeId, type: sql.INT },
                description: { val: description, type: sql.VARCHAR },
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
    
    try {
        await sql.execute({ 
            procedure: "sp_CompleteTask",
            params: {
                status: { val: 'Ολοκληρωμένο', type: sql.NVARCHAR },
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
    
    try {
        await sql.execute({ 
            procedure: "sp_DeleteTask",
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
        const result = await sql.execute({ procedure: 'sp_GetCategories' });
        res.json(extractData(result));
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// INTERACTIONS ROUTES
app.get('/api/customers/:id/interactions', authenticateToken, async (req, res) => {
    const customerId = req.params.id;
    
    try {
        const result = await sql.execute({ 
            procedure: "sp_GetCustomerInteractions",
            params: {
                customerId: { val: customerId, type: sql.INT }
            }
        });
        res.json(extractData(result));
    } catch (error) {
        console.error("Fetch interactions error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/customers/:id/interactions', authenticateToken, async (req, res) => {
    const customerId = req.params.id;
    const employeeId = req.user.id; 
    const { categoryId, notes } = req.body;
    
    try {
        await sql.execute({ 
            procedure: "sp_InsertInteraction",
            params: {
                customerId: { val: customerId, type: sql.INT },
                employeeId: { val: employeeId, type: sql.INT },
                categoryId: { val: categoryId, type: sql.INT },
                notes: { val: notes, type: sql.VARCHAR }
            }
        });
        res.status(201).json({ message: "Interaction logged" });
    } catch (error) {
        console.error("Create interaction error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});