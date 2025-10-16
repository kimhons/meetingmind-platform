const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class DatabaseService {
    constructor() {
        this.pool = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Database configuration
            const config = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'meetingmind',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password',
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 20, // Maximum number of clients in the pool
                idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
                connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
            };

            // Create connection pool
            this.pool = new Pool(config);

            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            console.log('✅ Database connection established');

            // Run migrations
            await this.runMigrations();

            this.isInitialized = true;
            console.log('✅ Database service initialized successfully');

        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    async runMigrations() {
        try {
            console.log('🔄 Running database migrations...');

            // Create migrations table if it doesn't exist
            await this.query(`
                CREATE TABLE IF NOT EXISTS migrations (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL UNIQUE,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Get list of executed migrations
            const executedMigrations = await this.query('SELECT filename FROM migrations');
            const executedFiles = executedMigrations.rows.map(row => row.filename);

            // Read migration files
            const migrationsDir = path.join(__dirname, '../migrations');
            
            try {
                const files = await fs.readdir(migrationsDir);
                const migrationFiles = files
                    .filter(file => file.endsWith('.sql'))
                    .sort();

                for (const file of migrationFiles) {
                    if (!executedFiles.includes(file)) {
                        console.log(`🔄 Running migration: ${file}`);
                        
                        const migrationSQL = await fs.readFile(
                            path.join(migrationsDir, file), 
                            'utf8'
                        );
                        
                        // Execute migration in a transaction
                        const client = await this.pool.connect();
                        try {
                            await client.query('BEGIN');
                            await client.query(migrationSQL);
                            await client.query(
                                'INSERT INTO migrations (filename) VALUES ($1)',
                                [file]
                            );
                            await client.query('COMMIT');
                            console.log(`✅ Migration completed: ${file}`);
                        } catch (error) {
                            await client.query('ROLLBACK');
                            throw error;
                        } finally {
                            client.release();
                        }
                    }
                }

                console.log('✅ All migrations completed successfully');
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.log('📁 No migrations directory found, creating initial schema...');
                    await this.createInitialSchema();
                } else {
                    throw error;
                }
            }

        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    async createInitialSchema() {
        const initialSchema = `
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                role VARCHAR(50) DEFAULT 'user',
                subscription_tier VARCHAR(50) DEFAULT 'free',
                is_active BOOLEAN DEFAULT true,
                email_verified BOOLEAN DEFAULT false,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Organizations table
            CREATE TABLE IF NOT EXISTS organizations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                domain VARCHAR(255),
                subscription_tier VARCHAR(50) DEFAULT 'free',
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- User organization memberships
            CREATE TABLE IF NOT EXISTS user_organizations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
                role VARCHAR(50) DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, organization_id)
            );

            -- Meetings table
            CREATE TABLE IF NOT EXISTS meetings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                platform VARCHAR(50),
                platform_meeting_id VARCHAR(255),
                meeting_url TEXT,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                duration INTEGER, -- in minutes
                status VARCHAR(50) DEFAULT 'scheduled',
                host_id UUID REFERENCES users(id),
                organization_id UUID REFERENCES organizations(id),
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Meeting participants
            CREATE TABLE IF NOT EXISTS meeting_participants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id),
                email VARCHAR(255),
                name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'participant',
                joined_at TIMESTAMP,
                left_at TIMESTAMP,
                duration INTEGER, -- in minutes
                UNIQUE(meeting_id, user_id, email)
            );

            -- Meeting transcripts
            CREATE TABLE IF NOT EXISTS meeting_transcripts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
                speaker_name VARCHAR(255),
                speaker_email VARCHAR(255),
                content TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                confidence DECIMAL(3,2),
                language VARCHAR(10) DEFAULT 'en',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- AI analysis results
            CREATE TABLE IF NOT EXISTS ai_analyses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
                analysis_type VARCHAR(100) NOT NULL,
                model_used VARCHAR(100),
                input_data JSONB,
                output_data JSONB NOT NULL,
                confidence DECIMAL(3,2),
                processing_time INTEGER, -- in milliseconds
                cost DECIMAL(10,6), -- in USD
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Action items
            CREATE TABLE IF NOT EXISTS action_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                assigned_to UUID REFERENCES users(id),
                assigned_email VARCHAR(255),
                due_date DATE,
                priority VARCHAR(20) DEFAULT 'medium',
                status VARCHAR(50) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Notifications
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                data JSONB DEFAULT '{}',
                is_read BOOLEAN DEFAULT false,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Analytics events
            CREATE TABLE IF NOT EXISTS analytics_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                session_id VARCHAR(255),
                event_type VARCHAR(100) NOT NULL,
                event_name VARCHAR(255) NOT NULL,
                properties JSONB DEFAULT '{}',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address INET,
                user_agent TEXT
            );

            -- API keys for external integrations
            CREATE TABLE IF NOT EXISTS api_keys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
                service VARCHAR(100) NOT NULL,
                key_name VARCHAR(255) NOT NULL,
                encrypted_key TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                last_used TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Indexes for performance
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON meetings(host_id);
            CREATE INDEX IF NOT EXISTS idx_meetings_organization_id ON meetings(organization_id);
            CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
            CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting_id ON meeting_transcripts(meeting_id);
            CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_timestamp ON meeting_transcripts(timestamp);
            CREATE INDEX IF NOT EXISTS idx_ai_analyses_meeting_id ON ai_analyses(meeting_id);
            CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
            CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON action_items(assigned_to);
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
            CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

            -- Update triggers
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

            CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

            CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

            CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

            CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;

        await this.query(initialSchema);
        
        // Mark initial schema as migration
        await this.query(
            'INSERT INTO migrations (filename) VALUES ($1)',
            ['001_initial_schema.sql']
        );

        console.log('✅ Initial schema created successfully');
    }

    async query(text, params = []) {
        if (!this.isInitialized) {
            throw new Error('Database service not initialized');
        }

        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            if (process.env.NODE_ENV === 'development' && duration > 100) {
                console.log(`🐌 Slow query (${duration}ms):`, text.substring(0, 100));
            }
            
            return result;
        } catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }
    }

    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    isConnected() {
        return this.isInitialized && this.pool && !this.pool.ending;
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.isInitialized = false;
            console.log('✅ Database connection closed');
        }
    }

    // Helper methods for common operations
    async findById(table, id) {
        const result = await this.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        return result.rows[0];
    }

    async findByEmail(table, email) {
        const result = await this.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
        return result.rows[0];
    }

    async create(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        
        const query = `
            INSERT INTO ${table} (${keys.join(', ')})
            VALUES (${placeholders})
            RETURNING *
        `;
        
        const result = await this.query(query, values);
        return result.rows[0];
    }

    async update(table, id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        
        const query = `
            UPDATE ${table}
            SET ${setClause}
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await this.query(query, [id, ...values]);
        return result.rows[0];
    }

    async delete(table, id) {
        const result = await this.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
        return result.rows[0];
    }
}

module.exports = new DatabaseService();
