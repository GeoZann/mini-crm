const sql = require('seriate');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Set up database connection
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

async function migratePasswords() {
    try {
        console.log('🔄 Starting password migration...');
        
        // Fetch all users
        const users = await sql.execute({ 
            query: 'SELECT ID, Username, Password FROM Users' 
        });
        
        if (!users || users.length === 0) {
            console.log('ℹ️ No users found in database');
            return;
        }
        
        console.log(`\n📋 Found ${users.length} user(s) to migrate:\n`);
        
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
            if (user.Password && (user.Password.startsWith('$2a$') || user.Password.startsWith('$2b$') || user.Password.startsWith('$2y$'))) {
                console.log(`⏭️  Skipping "${user.Username}" - password already hashed`);
                skippedCount++;
            } else {
                try {
                    // Hash the plaintext password
                    const hashedPassword = await bcrypt.hash(user.Password, 10);
                    
                    // Update user with hashed password
                    await sql.execute({ 
                        query: 'UPDATE Users SET Password = @password WHERE ID = @id',
                        params: {
                            password: { val: hashedPassword, type: sql.VARCHAR(255) },
                            id: { val: user.ID, type: sql.INT }
                        }
                    });
                    
                    console.log(`✅ Migrated "${user.Username}"`);
                    migratedCount++;
                } catch (error) {
                    console.error(`❌ Failed to migrate "${user.Username}": ${error.message}`);
                }
            }
        }
        
        console.log(`\n📊 Migration complete!`);
        console.log(`   ✅ Migrated: ${migratedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migratePasswords();
