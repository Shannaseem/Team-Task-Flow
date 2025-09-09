-- Create tenants table
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    tenant_id INTEGER REFERENCES tenants(id),
    role VARCHAR(50) NOT NULL DEFAULT 'member'
);

-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(50) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    user_id INTEGER NOT NULL,
    assigned_user_id INTEGER,
    tenant_id INTEGER NOT NULL,
    due_date TIMESTAMP,  -- Added
    priority VARCHAR(50) DEFAULT 'medium',  -- Added
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create indexes
CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);