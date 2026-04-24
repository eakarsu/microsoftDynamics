const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop all tables
    await client.query(`
      DROP TABLE IF EXISTS activities CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS employees CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS quote_items CASCADE;
      DROP TABLE IF EXISTS quotes CASCADE;
      DROP TABLE IF EXISTS invoice_items CASCADE;
      DROP TABLE IF EXISTS invoices CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS campaigns CASCADE;
      DROP TABLE IF EXISTS knowledge_articles CASCADE;
      DROP TABLE IF EXISTS cases CASCADE;
      DROP TABLE IF EXISTS opportunities CASCADE;
      DROP TABLE IF EXISTS leads CASCADE;
      DROP TABLE IF EXISTS accounts CASCADE;
      DROP TABLE IF EXISTS contacts CASCADE;
      DROP TABLE IF EXISTS territories CASCADE;
      DROP TABLE IF EXISTS competitors CASCADE;
      DROP TABLE IF EXISTS goals CASCADE;
      DROP TABLE IF EXISTS departments CASCADE;
      DROP TABLE IF EXISTS performance_reviews CASCADE;
      DROP TABLE IF EXISTS leave_requests CASCADE;
      DROP TABLE IF EXISTS work_orders CASCADE;
      DROP TABLE IF EXISTS sla_policies CASCADE;
      DROP TABLE IF EXISTS email_templates CASCADE;
      DROP TABLE IF EXISTS expense_reports CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS vendors CASCADE;
      DROP TABLE IF EXISTS price_lists CASCADE;
      DROP TABLE IF EXISTS discounts CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS customer_segments CASCADE;
      DROP TABLE IF EXISTS training_courses CASCADE;
      DROP TABLE IF EXISTS contracts CASCADE;
      DROP TABLE IF EXISTS forecasts CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create contacts table
    await client.query(`
      CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        job_title VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create accounts table
    await client.query(`
      CREATE TABLE accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        website VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        annual_revenue DECIMAL(15,2),
        employee_count INTEGER,
        status VARCHAR(50) DEFAULT 'Active',
        type VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create leads table
    await client.query(`
      CREATE TABLE leads (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        job_title VARCHAR(255),
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'New',
        rating VARCHAR(50),
        estimated_value DECIMAL(15,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create opportunities table
    await client.query(`
      CREATE TABLE opportunities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        account_name VARCHAR(255),
        contact_name VARCHAR(255),
        amount DECIMAL(15,2),
        stage VARCHAR(100) DEFAULT 'Qualify',
        probability INTEGER DEFAULT 10,
        close_date DATE,
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Open',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create cases table
    await client.query(`
      CREATE TABLE cases (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255),
        account_name VARCHAR(255),
        priority VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'New',
        category VARCHAR(100),
        description TEXT,
        resolution TEXT,
        assigned_to VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create knowledge_articles table
    await client.query(`
      CREATE TABLE knowledge_articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Draft',
        author VARCHAR(255),
        views INTEGER DEFAULT 0,
        helpful_votes INTEGER DEFAULT 0,
        tags TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create campaigns table
    await client.query(`
      CREATE TABLE campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Draft',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(15,2),
        actual_cost DECIMAL(15,2),
        expected_revenue DECIMAL(15,2),
        target_audience VARCHAR(255),
        channel VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create products table
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        category VARCHAR(100),
        price DECIMAL(15,2),
        cost DECIMAL(15,2),
        quantity_in_stock INTEGER DEFAULT 0,
        unit VARCHAR(50),
        description TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        vendor VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create invoices table
    await client.query(`
      CREATE TABLE invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE,
        account_name VARCHAR(255),
        contact_name VARCHAR(255),
        amount DECIMAL(15,2),
        tax DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'Draft',
        due_date DATE,
        paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create quotes table
    await client.query(`
      CREATE TABLE quotes (
        id SERIAL PRIMARY KEY,
        quote_number VARCHAR(50) UNIQUE,
        name VARCHAR(255),
        account_name VARCHAR(255),
        contact_name VARCHAR(255),
        amount DECIMAL(15,2),
        discount DECIMAL(5,2) DEFAULT 0,
        total DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'Draft',
        valid_until DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create orders table
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE,
        account_name VARCHAR(255),
        contact_name VARCHAR(255),
        amount DECIMAL(15,2),
        tax DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'Pending',
        shipping_address TEXT,
        order_date DATE DEFAULT CURRENT_DATE,
        ship_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create employees table
    await client.query(`
      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        department VARCHAR(100),
        position VARCHAR(255),
        manager VARCHAR(255),
        hire_date DATE,
        salary DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'Active',
        office_location VARCHAR(255),
        skills TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create projects table
    await client.query(`
      CREATE TABLE projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        account_name VARCHAR(255),
        manager VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Planning',
        priority VARCHAR(50) DEFAULT 'Medium',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(15,2),
        actual_cost DECIMAL(15,2) DEFAULT 0,
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create tasks table
    await client.query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        project_name VARCHAR(255),
        assigned_to VARCHAR(255),
        priority VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'Not Started',
        due_date DATE,
        estimated_hours DECIMAL(8,2),
        actual_hours DECIMAL(8,2) DEFAULT 0,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create activities table
    await client.query(`
      CREATE TABLE activities (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        description TEXT,
        regarding VARCHAR(255),
        assigned_to VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Planned',
        priority VARCHAR(50) DEFAULT 'Normal',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create territories table
    await client.query(`
      CREATE TABLE territories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        region VARCHAR(100),
        manager VARCHAR(255),
        description TEXT,
        target_revenue DECIMAL(15,2),
        actual_revenue DECIMAL(15,2) DEFAULT 0,
        account_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create competitors table
    await client.query(`
      CREATE TABLE competitors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        website VARCHAR(255),
        industry VARCHAR(100),
        strengths TEXT,
        weaknesses TEXT,
        market_share DECIMAL(5,2),
        threat_level VARCHAR(50) DEFAULT 'Medium',
        notes TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create goals table
    await client.query(`
      CREATE TABLE goals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner VARCHAR(255),
        type VARCHAR(100),
        target_value DECIMAL(15,2),
        actual_value DECIMAL(15,2) DEFAULT 0,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'In Progress',
        progress INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create departments table
    await client.query(`
      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        manager VARCHAR(255),
        parent_department VARCHAR(255),
        employee_count INTEGER DEFAULT 0,
        budget DECIMAL(15,2),
        location VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create performance_reviews table
    await client.query(`
      CREATE TABLE performance_reviews (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255),
        reviewer VARCHAR(255),
        review_period VARCHAR(100),
        overall_rating DECIMAL(3,1),
        goals_rating DECIMAL(3,1),
        skills_rating DECIMAL(3,1),
        communication_rating DECIMAL(3,1),
        status VARCHAR(50) DEFAULT 'Draft',
        strengths TEXT,
        improvements TEXT,
        comments TEXT,
        review_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create leave_requests table
    await client.query(`
      CREATE TABLE leave_requests (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255),
        leave_type VARCHAR(100),
        start_date DATE,
        end_date DATE,
        days_requested DECIMAL(5,1),
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        approved_by VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create work_orders table
    await client.query(`
      CREATE TABLE work_orders (
        id SERIAL PRIMARY KEY,
        work_order_number VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        account_name VARCHAR(255),
        contact_name VARCHAR(255),
        type VARCHAR(100),
        priority VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'New',
        assigned_to VARCHAR(255),
        scheduled_date DATE,
        completed_date DATE,
        estimated_hours DECIMAL(8,2),
        actual_hours DECIMAL(8,2) DEFAULT 0,
        description TEXT,
        resolution TEXT,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sla_policies table
    await client.query(`
      CREATE TABLE sla_policies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        entity_type VARCHAR(100),
        priority VARCHAR(50),
        response_time_hours INTEGER,
        resolution_time_hours INTEGER,
        escalation_time_hours INTEGER,
        business_hours_only BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'Active',
        applicable_to VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create email_templates table
    await client.query(`
      CREATE TABLE email_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        body TEXT,
        category VARCHAR(100),
        type VARCHAR(100),
        language VARCHAR(50) DEFAULT 'English',
        status VARCHAR(50) DEFAULT 'Draft',
        created_by VARCHAR(255),
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create expense_reports table
    await client.query(`
      CREATE TABLE expense_reports (
        id SERIAL PRIMARY KEY,
        report_number VARCHAR(50),
        employee_name VARCHAR(255),
        department VARCHAR(100),
        purpose TEXT,
        total_amount DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'Draft',
        submitted_date DATE,
        approved_by VARCHAR(255),
        approved_date DATE,
        category VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create payments table
    await client.query(`
      CREATE TABLE payments (
        id SERIAL PRIMARY KEY,
        payment_number VARCHAR(50),
        account_name VARCHAR(255),
        invoice_number VARCHAR(50),
        amount DECIMAL(15,2),
        payment_method VARCHAR(100),
        payment_date DATE,
        reference VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Completed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create vendors table
    await client.query(`
      CREATE TABLE vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        website VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        category VARCHAR(100),
        payment_terms VARCHAR(100),
        rating DECIMAL(3,1),
        status VARCHAR(50) DEFAULT 'Active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create price_lists table
    await client.query(`
      CREATE TABLE price_lists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        currency VARCHAR(10) DEFAULT 'USD',
        effective_date DATE,
        expiry_date DATE,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        type VARCHAR(100),
        territory VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create discounts table
    await client.query(`
      CREATE TABLE discounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        type VARCHAR(100),
        value DECIMAL(15,2),
        min_quantity INTEGER DEFAULT 0,
        max_quantity INTEGER,
        start_date DATE,
        end_date DATE,
        applicable_to VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create audit_logs table
    await client.query(`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        user_name VARCHAR(255),
        changes TEXT,
        ip_address VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW(),
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(100),
        recipient VARCHAR(255),
        priority VARCHAR(50) DEFAULT 'Normal',
        status VARCHAR(50) DEFAULT 'Unread',
        link VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create customer_segments table
    await client.query(`
      CREATE TABLE customer_segments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        criteria TEXT,
        member_count INTEGER DEFAULT 0,
        type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        created_by VARCHAR(255),
        last_evaluated DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create training_courses table
    await client.query(`
      CREATE TABLE training_courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        instructor VARCHAR(255),
        duration_hours DECIMAL(8,2),
        max_participants INTEGER,
        enrolled INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        start_date DATE,
        end_date DATE,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Scheduled',
        format VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create contracts table
    await client.query(`
      CREATE TABLE contracts (
        id SERIAL PRIMARY KEY,
        contract_number VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        account_name VARCHAR(255),
        contact_name VARCHAR(255),
        type VARCHAR(100),
        value DECIMAL(15,2),
        start_date DATE,
        end_date DATE,
        renewal_date DATE,
        status VARCHAR(50) DEFAULT 'Draft',
        terms TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create forecasts table
    await client.query(`
      CREATE TABLE forecasts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        period VARCHAR(100),
        owner VARCHAR(255),
        target_amount DECIMAL(15,2),
        best_case DECIMAL(15,2),
        committed DECIMAL(15,2),
        pipeline DECIMAL(15,2),
        closed DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Open',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Seed users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, full_name, role) VALUES
      ('admin@dynamics365.com', $1, 'System Administrator', 'admin'),
      ('sarah.johnson@dynamics365.com', $1, 'Sarah Johnson', 'manager'),
      ('mike.chen@dynamics365.com', $1, 'Mike Chen', 'user')
    `, [hashedPassword]);

    // Seed contacts
    await client.query(`
      INSERT INTO contacts (first_name, last_name, email, phone, company, job_title, address, city, state, country, status, notes) VALUES
      ('James', 'Wilson', 'james.wilson@techcorp.com', '+1-555-0101', 'TechCorp Industries', 'VP of Engineering', '123 Tech Blvd', 'San Francisco', 'CA', 'United States', 'Active', 'Key decision maker for enterprise deals'),
      ('Emily', 'Rodriguez', 'emily.r@globalsoft.com', '+1-555-0102', 'GlobalSoft Solutions', 'CTO', '456 Innovation Dr', 'Austin', 'TX', 'United States', 'Active', 'Interested in cloud migration'),
      ('David', 'Kim', 'david.kim@nexgen.io', '+1-555-0103', 'NexGen Systems', 'Director of IT', '789 Digital Way', 'Seattle', 'WA', 'United States', 'Active', 'Evaluating Q1 budget allocation'),
      ('Maria', 'Santos', 'maria.s@alphaventures.com', '+1-555-0104', 'Alpha Ventures', 'CEO', '321 Enterprise Ave', 'New York', 'NY', 'United States', 'Active', 'High-value prospect'),
      ('Robert', 'Thompson', 'r.thompson@datadynamics.com', '+1-555-0105', 'Data Dynamics Inc', 'Data Architect', '654 Analytics Pkwy', 'Chicago', 'IL', 'United States', 'Active', 'Looking for BI solutions'),
      ('Sarah', 'Chen', 'sarah.chen@cloudninelabs.com', '+1-555-0106', 'CloudNine Labs', 'Product Manager', '987 Cloud St', 'Denver', 'CO', 'United States', 'Active', 'Met at tech conference'),
      ('Michael', 'O''Brien', 'michael.ob@finserve.com', '+1-555-0107', 'FinServe Global', 'CFO', '246 Finance Row', 'Boston', 'MA', 'United States', 'Active', 'Requires compliance features'),
      ('Lisa', 'Park', 'lisa.park@healthtech.com', '+1-555-0108', 'HealthTech Pro', 'VP Operations', '135 Medical Dr', 'Houston', 'TX', 'United States', 'Active', 'HIPAA compliance required'),
      ('Andrew', 'Martinez', 'a.martinez@retailplus.com', '+1-555-0109', 'RetailPlus Corp', 'Head of Digital', '864 Commerce Blvd', 'Miami', 'FL', 'United States', 'Active', 'E-commerce integration needed'),
      ('Jennifer', 'Taylor', 'j.taylor@edulearn.com', '+1-555-0110', 'EduLearn Systems', 'Director', '753 Education Ln', 'Portland', 'OR', 'United States', 'Active', 'Non-profit pricing requested'),
      ('Christopher', 'Lee', 'c.lee@aerotech.com', '+1-555-0111', 'AeroTech Solutions', 'Engineering Lead', '951 Aero Way', 'Phoenix', 'AZ', 'United States', 'Inactive', 'Previous customer, re-engaging'),
      ('Amanda', 'White', 'a.white@greenergy.com', '+1-555-0112', 'GreenErgy Corp', 'Sustainability Dir', '357 Green Ave', 'Atlanta', 'GA', 'United States', 'Active', 'Government contracts'),
      ('Daniel', 'Brown', 'daniel.b@securenet.com', '+1-555-0113', 'SecureNet Inc', 'CISO', '159 Security Blvd', 'Washington', 'DC', 'United States', 'Active', 'High security requirements'),
      ('Rachel', 'Green', 'r.green@mediaworks.com', '+1-555-0114', 'MediaWorks Agency', 'Creative Director', '462 Media Row', 'Los Angeles', 'CA', 'United States', 'Active', 'Marketing platform interest'),
      ('Thomas', 'Anderson', 't.anderson@logisticspro.com', '+1-555-0115', 'LogisticsPro Inc', 'Supply Chain VP', '753 Logistics Way', 'Dallas', 'TX', 'United States', 'Active', 'Supply chain optimization')
    `);

    // Seed accounts
    await client.query(`
      INSERT INTO accounts (name, industry, website, phone, email, address, city, state, country, annual_revenue, employee_count, status, type, notes) VALUES
      ('TechCorp Industries', 'Technology', 'www.techcorp.com', '+1-555-1001', 'info@techcorp.com', '123 Tech Blvd', 'San Francisco', 'CA', 'United States', 25000000.00, 500, 'Active', 'Enterprise', 'Strategic partner since 2020'),
      ('GlobalSoft Solutions', 'Software', 'www.globalsoft.com', '+1-555-1002', 'contact@globalsoft.com', '456 Innovation Dr', 'Austin', 'TX', 'United States', 50000000.00, 1200, 'Active', 'Enterprise', 'Multi-year contract in place'),
      ('NexGen Systems', 'Technology', 'www.nexgen.io', '+1-555-1003', 'hello@nexgen.io', '789 Digital Way', 'Seattle', 'WA', 'United States', 15000000.00, 300, 'Active', 'Mid-Market', 'Growing rapidly'),
      ('Alpha Ventures', 'Financial Services', 'www.alphaventures.com', '+1-555-1004', 'info@alphaventures.com', '321 Enterprise Ave', 'New York', 'NY', 'United States', 100000000.00, 2500, 'Active', 'Enterprise', 'Fortune 500 company'),
      ('Data Dynamics Inc', 'Analytics', 'www.datadynamics.com', '+1-555-1005', 'info@datadynamics.com', '654 Analytics Pkwy', 'Chicago', 'IL', 'United States', 8000000.00, 150, 'Active', 'Mid-Market', 'Specializes in big data'),
      ('CloudNine Labs', 'Cloud Computing', 'www.cloudninelabs.com', '+1-555-1006', 'info@cloudninelabs.com', '987 Cloud St', 'Denver', 'CO', 'United States', 30000000.00, 600, 'Active', 'Enterprise', 'AWS partner'),
      ('FinServe Global', 'Financial Services', 'www.finserve.com', '+1-555-1007', 'info@finserve.com', '246 Finance Row', 'Boston', 'MA', 'United States', 75000000.00, 1800, 'Active', 'Enterprise', 'Regulated industry'),
      ('HealthTech Pro', 'Healthcare', 'www.healthtechpro.com', '+1-555-1008', 'info@healthtech.com', '135 Medical Dr', 'Houston', 'TX', 'United States', 20000000.00, 400, 'Active', 'Mid-Market', 'HIPAA compliant solutions'),
      ('RetailPlus Corp', 'Retail', 'www.retailplus.com', '+1-555-1009', 'info@retailplus.com', '864 Commerce Blvd', 'Miami', 'FL', 'United States', 45000000.00, 950, 'Active', 'Enterprise', 'Omnichannel retail leader'),
      ('EduLearn Systems', 'Education', 'www.edulearn.com', '+1-555-1010', 'info@edulearn.com', '753 Education Ln', 'Portland', 'OR', 'United States', 5000000.00, 100, 'Active', 'SMB', 'EdTech startup'),
      ('AeroTech Solutions', 'Aerospace', 'www.aerotech.com', '+1-555-1011', 'info@aerotech.com', '951 Aero Way', 'Phoenix', 'AZ', 'United States', 60000000.00, 1500, 'Inactive', 'Enterprise', 'Government contractor'),
      ('GreenErgy Corp', 'Energy', 'www.greenergy.com', '+1-555-1012', 'info@greenergy.com', '357 Green Ave', 'Atlanta', 'GA', 'United States', 35000000.00, 700, 'Active', 'Enterprise', 'Renewable energy focus'),
      ('SecureNet Inc', 'Cybersecurity', 'www.securenet.com', '+1-555-1013', 'info@securenet.com', '159 Security Blvd', 'Washington', 'DC', 'United States', 22000000.00, 350, 'Active', 'Mid-Market', 'Zero-trust architecture'),
      ('MediaWorks Agency', 'Media', 'www.mediaworks.com', '+1-555-1014', 'info@mediaworks.com', '462 Media Row', 'Los Angeles', 'CA', 'United States', 12000000.00, 250, 'Active', 'Mid-Market', 'Digital marketing leader'),
      ('LogisticsPro Inc', 'Logistics', 'www.logisticspro.com', '+1-555-1015', 'info@logisticspro.com', '753 Logistics Way', 'Dallas', 'TX', 'United States', 40000000.00, 850, 'Active', 'Enterprise', 'Last-mile delivery expert')
    `);

    // Seed leads
    await client.query(`
      INSERT INTO leads (first_name, last_name, email, phone, company, job_title, source, status, rating, estimated_value, notes) VALUES
      ('Alex', 'Turner', 'a.turner@startupx.com', '+1-555-2001', 'StartupX Inc', 'Founder & CEO', 'Website', 'New', 'Hot', 150000.00, 'Downloaded enterprise whitepaper'),
      ('Olivia', 'Wang', 'o.wang@megacorp.com', '+1-555-2002', 'MegaCorp Ltd', 'VP Technology', 'Referral', 'Contacted', 'Hot', 500000.00, 'Referred by existing customer'),
      ('Nathan', 'Davis', 'n.davis@innovate.co', '+1-555-2003', 'Innovate Co', 'Head of Strategy', 'LinkedIn', 'Qualified', 'Warm', 75000.00, 'Engaged with content marketing'),
      ('Sophie', 'Miller', 's.miller@futuretech.com', '+1-555-2004', 'FutureTech Labs', 'CTO', 'Trade Show', 'New', 'Hot', 300000.00, 'Met at CES 2024'),
      ('Ryan', 'Garcia', 'r.garcia@smartsys.com', '+1-555-2005', 'SmartSys Corp', 'IT Director', 'Cold Call', 'Contacted', 'Warm', 120000.00, 'Follow up scheduled Q2'),
      ('Emma', 'Johnson', 'e.johnson@biomedical.com', '+1-555-2006', 'BioMedical Inc', 'Research Director', 'Website', 'New', 'Cold', 200000.00, 'Exploring AI capabilities'),
      ('Liam', 'Wilson', 'l.wilson@quantum.io', '+1-555-2007', 'Quantum Dynamics', 'CEO', 'Event', 'Qualified', 'Hot', 450000.00, 'Needs Q1 implementation'),
      ('Isabella', 'Thomas', 'i.thomas@urbandev.com', '+1-555-2008', 'Urban Development Co', 'Project Director', 'Partner', 'Contacted', 'Warm', 180000.00, 'Real estate platform needs'),
      ('Ethan', 'Harris', 'e.harris@foodchain.com', '+1-555-2009', 'FoodChain Inc', 'Operations VP', 'Referral', 'New', 'Cold', 90000.00, 'Supply chain management'),
      ('Ava', 'Clark', 'a.clark@mediasphere.com', '+1-555-2010', 'MediaSphere', 'Marketing VP', 'LinkedIn', 'Qualified', 'Warm', 60000.00, 'Content management needs'),
      ('Mason', 'Lewis', 'm.lewis@buildright.com', '+1-555-2011', 'BuildRight Corp', 'COO', 'Website', 'Contacted', 'Hot', 250000.00, 'Construction project management'),
      ('Charlotte', 'Robinson', 'c.robinson@pharmaplus.com', '+1-555-2012', 'PharmaPlus Ltd', 'VP R&D', 'Trade Show', 'New', 'Warm', 350000.00, 'Clinical trial management'),
      ('Jack', 'Hall', 'j.hall@automate.ai', '+1-555-2013', 'Automate.AI', 'CTO', 'Cold Call', 'Qualified', 'Hot', 400000.00, 'AI integration project'),
      ('Mia', 'Young', 'm.young@ecogreen.com', '+1-555-2014', 'EcoGreen Solutions', 'Director', 'Partner', 'Contacted', 'Cold', 55000.00, 'Sustainability tracking'),
      ('William', 'King', 'w.king@techbridge.com', '+1-555-2015', 'TechBridge Inc', 'VP Sales', 'Event', 'New', 'Warm', 175000.00, 'Looking for CRM solution')
    `);

    // Seed opportunities
    await client.query(`
      INSERT INTO opportunities (name, account_name, contact_name, amount, stage, probability, close_date, source, status, notes) VALUES
      ('TechCorp Enterprise License', 'TechCorp Industries', 'James Wilson', 250000.00, 'Proposal', 75, '2025-03-15', 'Direct', 'Open', 'Multi-year enterprise license deal'),
      ('GlobalSoft Cloud Migration', 'GlobalSoft Solutions', 'Emily Rodriguez', 500000.00, 'Negotiate', 85, '2025-02-28', 'Referral', 'Open', 'Full cloud migration project'),
      ('NexGen Platform Upgrade', 'NexGen Systems', 'David Kim', 150000.00, 'Qualify', 30, '2025-06-30', 'Website', 'Open', 'Platform modernization initiative'),
      ('Alpha Ventures CRM Suite', 'Alpha Ventures', 'Maria Santos', 750000.00, 'Proposal', 60, '2025-04-15', 'Direct', 'Open', 'Complete CRM implementation'),
      ('Data Dynamics BI Package', 'Data Dynamics Inc', 'Robert Thompson', 180000.00, 'Develop', 50, '2025-05-01', 'Partner', 'Open', 'Business intelligence deployment'),
      ('CloudNine Infrastructure', 'CloudNine Labs', 'Sarah Chen', 350000.00, 'Negotiate', 90, '2025-02-15', 'Direct', 'Open', 'Infrastructure as a service deal'),
      ('FinServe Compliance Module', 'FinServe Global', 'Michael O''Brien', 420000.00, 'Proposal', 65, '2025-03-31', 'Referral', 'Open', 'Regulatory compliance solution'),
      ('HealthTech EHR Integration', 'HealthTech Pro', 'Lisa Park', 280000.00, 'Qualify', 25, '2025-07-15', 'Trade Show', 'Open', 'Electronic health records integration'),
      ('RetailPlus Omnichannel', 'RetailPlus Corp', 'Andrew Martinez', 600000.00, 'Develop', 55, '2025-04-30', 'Direct', 'Open', 'Omnichannel retail platform'),
      ('EduLearn LMS Platform', 'EduLearn Systems', 'Jennifer Taylor', 95000.00, 'Proposal', 70, '2025-03-01', 'Website', 'Open', 'Learning management system'),
      ('AeroTech Defense Contract', 'AeroTech Solutions', 'Christopher Lee', 1200000.00, 'Qualify', 20, '2025-09-30', 'Direct', 'Open', 'Government defense project'),
      ('GreenErgy Smart Grid', 'GreenErgy Corp', 'Amanda White', 450000.00, 'Develop', 45, '2025-05-15', 'Partner', 'Open', 'Smart grid management system'),
      ('SecureNet Zero Trust', 'SecureNet Inc', 'Daniel Brown', 320000.00, 'Negotiate', 80, '2025-02-20', 'Referral', 'Open', 'Zero-trust security implementation'),
      ('MediaWorks Campaign Suite', 'MediaWorks Agency', 'Rachel Green', 175000.00, 'Proposal', 60, '2025-04-01', 'LinkedIn', 'Open', 'Marketing campaign management'),
      ('LogisticsPro Fleet Mgmt', 'LogisticsPro Inc', 'Thomas Anderson', 380000.00, 'Develop', 40, '2025-06-15', 'Direct', 'Open', 'Fleet management solution')
    `);

    // Seed cases
    await client.query(`
      INSERT INTO cases (title, contact_name, account_name, priority, status, category, description, resolution, assigned_to) VALUES
      ('Login authentication failure', 'James Wilson', 'TechCorp Industries', 'High', 'In Progress', 'Technical', 'Users unable to authenticate via SSO after recent update', NULL, 'Mike Chen'),
      ('Data export not working', 'Emily Rodriguez', 'GlobalSoft Solutions', 'Medium', 'New', 'Technical', 'CSV export timing out for large datasets over 10k records', NULL, 'Sarah Johnson'),
      ('Billing discrepancy Q4', 'Maria Santos', 'Alpha Ventures', 'High', 'In Progress', 'Billing', 'Invoice amount does not match contracted rate', NULL, 'Mike Chen'),
      ('Feature request: Dark mode', 'David Kim', 'NexGen Systems', 'Low', 'New', 'Feature Request', 'Customer requesting dark mode UI option for all dashboards', NULL, 'Sarah Johnson'),
      ('API rate limiting issues', 'Sarah Chen', 'CloudNine Labs', 'Critical', 'In Progress', 'Technical', 'API calls being throttled below agreed SLA limits', NULL, 'Mike Chen'),
      ('Mobile app crash on iOS 18', 'Lisa Park', 'HealthTech Pro', 'High', 'New', 'Bug', 'Application crashes when opening reports on iOS 18 devices', NULL, 'Sarah Johnson'),
      ('Custom report template error', 'Robert Thompson', 'Data Dynamics Inc', 'Medium', 'Resolved', 'Technical', 'Custom report templates showing incorrect date formatting', 'Fixed date format parser in template engine v2.3.1', 'Mike Chen'),
      ('Integration setup assistance', 'Michael O''Brien', 'FinServe Global', 'Medium', 'In Progress', 'Support', 'Need help configuring Salesforce to Dynamics integration', NULL, 'Sarah Johnson'),
      ('Performance degradation', 'Andrew Martinez', 'RetailPlus Corp', 'Critical', 'New', 'Technical', 'Dashboard load times increased 300% in last 48 hours', NULL, 'Mike Chen'),
      ('License activation problem', 'Jennifer Taylor', 'EduLearn Systems', 'High', 'In Progress', 'Licensing', 'New licenses not activating for recently onboarded users', NULL, 'Sarah Johnson'),
      ('GDPR data deletion request', 'Daniel Brown', 'SecureNet Inc', 'High', 'New', 'Compliance', 'Customer requesting complete data deletion per GDPR Article 17', NULL, 'Mike Chen'),
      ('Workflow automation bug', 'Rachel Green', 'MediaWorks Agency', 'Medium', 'Resolved', 'Bug', 'Automated email workflows triggering duplicate sends', 'Fixed race condition in workflow trigger queue', 'Sarah Johnson'),
      ('Training session request', 'Amanda White', 'GreenErgy Corp', 'Low', 'New', 'Training', 'Request for advanced admin training for 15 team members', NULL, 'Mike Chen'),
      ('Calendar sync issues', 'Thomas Anderson', 'LogisticsPro Inc', 'Medium', 'In Progress', 'Technical', 'Outlook calendar events not syncing bidirectionally', NULL, 'Sarah Johnson'),
      ('Single sign-on configuration', 'Christopher Lee', 'AeroTech Solutions', 'High', 'New', 'Technical', 'Need to configure SAML SSO with corporate identity provider', NULL, 'Mike Chen')
    `);

    // Seed knowledge_articles
    await client.query(`
      INSERT INTO knowledge_articles (title, content, category, status, author, views, helpful_votes, tags) VALUES
      ('Getting Started with Dynamics 365', 'Welcome to Microsoft Dynamics 365. This guide covers initial setup, user configuration, and basic navigation. Start by configuring your organization settings in the Admin Center...', 'Getting Started', 'Published', 'Sarah Johnson', 1250, 89, 'setup,onboarding,basics'),
      ('Configuring Email Integration', 'Learn how to set up email synchronization with Exchange Online or IMAP/SMTP servers. Navigate to Settings > Email Configuration to begin. Support for OAuth2 authentication is built-in...', 'Configuration', 'Published', 'Mike Chen', 890, 67, 'email,integration,exchange'),
      ('Creating Custom Dashboards', 'Build powerful dashboards using the drag-and-drop designer. Access Dashboard Editor from the main menu. You can combine charts, lists, and KPI widgets into a single view...', 'Customization', 'Published', 'Sarah Johnson', 756, 54, 'dashboards,customization,analytics'),
      ('API Documentation Overview', 'The Dynamics 365 REST API supports full CRUD operations on all entities. Authentication uses OAuth 2.0 Bearer tokens. Rate limits are 60,000 requests per hour per organization...', 'Development', 'Published', 'Mike Chen', 2100, 134, 'api,development,rest'),
      ('Workflow Automation Guide', 'Automate business processes using Power Automate integration. Create flows triggered by record creation, updates, or scheduled events. Support for conditional branching and parallel execution...', 'Automation', 'Published', 'Sarah Johnson', 1680, 98, 'automation,workflow,power-automate'),
      ('Security Roles and Permissions', 'Manage access control through security roles. Each role defines CRUD permissions at entity level. Business units provide hierarchical data isolation. Field-level security is also available...', 'Administration', 'Published', 'Mike Chen', 945, 72, 'security,roles,permissions'),
      ('Data Import Best Practices', 'Follow these steps for successful data migration: 1) Clean and validate source data, 2) Map fields correctly, 3) Use batch processing for large datasets, 4) Validate imported records...', 'Data Management', 'Published', 'Sarah Johnson', 1320, 85, 'import,migration,data'),
      ('Troubleshooting Common Issues', 'This article covers resolution steps for frequently encountered problems including login failures, sync issues, performance problems, and data inconsistencies...', 'Troubleshooting', 'Published', 'Mike Chen', 3200, 178, 'troubleshooting,fixes,common-issues'),
      ('Mobile App Setup Guide', 'Install the Dynamics 365 mobile app from App Store or Google Play. Sign in with your organizational credentials. Offline mode supports viewing and editing records without connectivity...', 'Mobile', 'Published', 'Sarah Johnson', 670, 45, 'mobile,app,setup'),
      ('Report Builder Tutorial', 'Create custom reports using the built-in report designer. Choose from tabular, matrix, or chart formats. Add filters, grouping, and calculated fields. Schedule automated report delivery...', 'Reporting', 'Published', 'Mike Chen', 1100, 76, 'reports,analytics,builder'),
      ('Integration with Power BI', 'Connect Dynamics 365 data to Power BI for advanced analytics. Use the Dynamics 365 connector in Power BI Desktop. Create real-time dashboards with automatic data refresh...', 'Integration', 'Published', 'Sarah Johnson', 890, 63, 'powerbi,analytics,integration'),
      ('Managing Sales Pipelines', 'Optimize your sales process by configuring pipeline stages, probability settings, and forecasting rules. Use the Kanban view for visual pipeline management...', 'Sales', 'Published', 'Mike Chen', 1450, 92, 'sales,pipeline,forecasting'),
      ('Customer Service Best Practices', 'Improve customer satisfaction with case routing rules, SLA management, and knowledge base integration. Configure automatic escalation for overdue cases...', 'Customer Service', 'Published', 'Sarah Johnson', 780, 56, 'service,cases,sla'),
      ('Advanced Search and Filters', 'Master the advanced find feature to create complex queries. Use AND/OR logic, related entity filters, and saved views. Export results to Excel for further analysis...', 'Tips & Tricks', 'Published', 'Mike Chen', 1650, 110, 'search,filters,advanced-find'),
      ('Backup and Recovery Procedures', 'Ensure data protection with regular backups. System backups run automatically every 12 hours. Point-in-time restore is available for the last 28 days. Manual backups can be triggered from Admin Center...', 'Administration', 'Draft', 'Sarah Johnson', 420, 31, 'backup,recovery,admin')
    `);

    // Seed campaigns
    await client.query(`
      INSERT INTO campaigns (name, type, status, start_date, end_date, budget, actual_cost, expected_revenue, target_audience, channel, description) VALUES
      ('Q1 Enterprise Launch', 'Product Launch', 'Active', '2025-01-15', '2025-03-31', 150000.00, 87500.00, 750000.00, 'Enterprise IT Leaders', 'Multi-Channel', 'Launch campaign for new enterprise features including AI copilot and advanced analytics'),
      ('Cloud Migration Webinar Series', 'Webinar', 'Active', '2025-02-01', '2025-04-30', 25000.00, 12000.00, 200000.00, 'IT Decision Makers', 'Digital', 'Monthly webinar series covering cloud migration strategies and best practices'),
      ('Partner Enablement Program', 'Partner', 'Active', '2025-01-01', '2025-06-30', 80000.00, 35000.00, 500000.00, 'Solution Partners', 'Direct', 'Training and certification program for channel partners'),
      ('Digital Transformation Summit', 'Event', 'Planning', '2025-05-15', '2025-05-17', 200000.00, 0.00, 1000000.00, 'C-Suite Executives', 'Event', 'Annual digital transformation conference with keynotes and workshops'),
      ('SMB Growth Campaign', 'Advertising', 'Active', '2025-01-10', '2025-12-31', 100000.00, 42000.00, 350000.00, 'Small Business Owners', 'Digital', 'Year-long digital advertising campaign targeting SMB market segment'),
      ('Customer Success Stories', 'Content', 'Active', '2025-01-01', '2025-12-31', 30000.00, 15000.00, 100000.00, 'Prospects', 'Content Marketing', 'Case study series featuring successful customer implementations'),
      ('Healthcare Vertical Push', 'Industry', 'Active', '2025-02-15', '2025-05-31', 60000.00, 28000.00, 400000.00, 'Healthcare Organizations', 'Multi-Channel', 'Targeted campaign for healthcare industry with HIPAA compliance messaging'),
      ('Annual User Conference', 'Event', 'Planning', '2025-09-10', '2025-09-12', 350000.00, 25000.00, 2000000.00, 'Existing Customers', 'Event', 'Flagship annual user conference with product announcements'),
      ('LinkedIn Thought Leadership', 'Social Media', 'Active', '2025-01-01', '2025-12-31', 20000.00, 8500.00, 75000.00, 'Business Professionals', 'Social', 'LinkedIn content strategy with executive thought leadership posts'),
      ('Email Nurture - Trial Users', 'Email', 'Active', '2025-01-15', '2025-12-31', 15000.00, 6000.00, 250000.00, 'Trial Users', 'Email', 'Automated email nurture sequence for free trial sign-ups'),
      ('Competitive Displacement', 'Advertising', 'Active', '2025-02-01', '2025-07-31', 75000.00, 30000.00, 600000.00, 'Competitor Customers', 'Digital', 'Targeted ads for users of competing CRM platforms'),
      ('Developer Community Launch', 'Community', 'Active', '2025-01-01', '2025-12-31', 40000.00, 18000.00, 150000.00, 'Developers', 'Community', 'Building developer community with documentation, forums, and hackathons'),
      ('Financial Services Roadshow', 'Event', 'Planning', '2025-04-01', '2025-06-30', 120000.00, 10000.00, 800000.00, 'Financial Institutions', 'Event', 'City-by-city roadshow targeting financial services companies'),
      ('Product Demo Video Series', 'Content', 'Active', '2025-01-15', '2025-06-30', 35000.00, 20000.00, 180000.00, 'All Prospects', 'Video', 'Professional product demonstration videos for each module'),
      ('Referral Rewards Program', 'Referral', 'Active', '2025-01-01', '2025-12-31', 50000.00, 22000.00, 300000.00, 'Existing Customers', 'Direct', 'Customer referral program with tiered rewards structure')
    `);

    // Seed products
    await client.query(`
      INSERT INTO products (name, sku, category, price, cost, quantity_in_stock, unit, description, status, vendor) VALUES
      ('Dynamics 365 Sales Enterprise', 'D365-SE-001', 'CRM', 95.00, 25.00, 999, 'Per User/Month', 'Full-featured sales automation with AI insights, pipeline management, and forecasting', 'Active', 'Microsoft'),
      ('Dynamics 365 Customer Service', 'D365-CS-001', 'Service', 95.00, 25.00, 999, 'Per User/Month', 'Omnichannel customer service with AI-powered case routing and knowledge base', 'Active', 'Microsoft'),
      ('Dynamics 365 Marketing', 'D365-MK-001', 'Marketing', 1500.00, 400.00, 999, 'Per Tenant/Month', 'Marketing automation with customer journeys, email campaigns, and event management', 'Active', 'Microsoft'),
      ('Dynamics 365 Finance', 'D365-FN-001', 'ERP', 180.00, 50.00, 999, 'Per User/Month', 'Financial management with general ledger, accounts payable/receivable, and budgeting', 'Active', 'Microsoft'),
      ('Dynamics 365 Supply Chain', 'D365-SC-001', 'ERP', 180.00, 50.00, 999, 'Per User/Month', 'Supply chain management with inventory, warehouse, and manufacturing operations', 'Active', 'Microsoft'),
      ('Dynamics 365 HR', 'D365-HR-001', 'HR', 120.00, 35.00, 999, 'Per User/Month', 'Human resources management with employee self-service and talent acquisition', 'Active', 'Microsoft'),
      ('Dynamics 365 Project Operations', 'D365-PO-001', 'Projects', 120.00, 35.00, 999, 'Per User/Month', 'End-to-end project management with resource scheduling and time tracking', 'Active', 'Microsoft'),
      ('Power BI Pro', 'PBI-PRO-001', 'Analytics', 10.00, 3.00, 999, 'Per User/Month', 'Business intelligence and data visualization with interactive dashboards', 'Active', 'Microsoft'),
      ('Power Automate', 'PA-STD-001', 'Automation', 15.00, 4.00, 999, 'Per User/Month', 'Workflow automation with 500+ pre-built connectors and AI builder', 'Active', 'Microsoft'),
      ('Dynamics 365 Commerce', 'D365-CM-001', 'Commerce', 180.00, 50.00, 999, 'Per User/Month', 'Unified commerce platform for online and in-store retail operations', 'Active', 'Microsoft'),
      ('Customer Insights', 'D365-CI-001', 'Analytics', 1500.00, 400.00, 999, 'Per Tenant/Month', 'Customer data platform with AI-driven insights and segmentation', 'Active', 'Microsoft'),
      ('Dynamics 365 Field Service', 'D365-FS-001', 'Service', 95.00, 25.00, 999, 'Per User/Month', 'Field service management with scheduling, IoT integration, and mobile workforce', 'Active', 'Microsoft'),
      ('Azure AI Services Add-on', 'AZ-AI-001', 'AI', 500.00, 150.00, 999, 'Per Tenant/Month', 'Advanced AI capabilities including copilot, document intelligence, and predictions', 'Active', 'Microsoft'),
      ('Dataverse Storage (1GB)', 'DV-STR-001', 'Storage', 40.00, 10.00, 999, 'Per GB/Month', 'Additional Dataverse database storage capacity', 'Active', 'Microsoft'),
      ('Premier Support Plan', 'SUP-PRM-001', 'Support', 2500.00, 800.00, 999, 'Per Month', 'Premium support with dedicated account manager, 1-hour response SLA, and proactive monitoring', 'Active', 'Microsoft')
    `);

    // Seed invoices
    await client.query(`
      INSERT INTO invoices (invoice_number, account_name, contact_name, amount, tax, total, status, due_date, paid_date, notes) VALUES
      ('INV-2025-001', 'TechCorp Industries', 'James Wilson', 47500.00, 4275.00, 51775.00, 'Paid', '2025-02-15', '2025-02-10', 'Q1 enterprise license - 500 users'),
      ('INV-2025-002', 'GlobalSoft Solutions', 'Emily Rodriguez', 114000.00, 10260.00, 124260.00, 'Paid', '2025-02-28', '2025-02-25', 'Annual cloud migration services'),
      ('INV-2025-003', 'Alpha Ventures', 'Maria Santos', 237500.00, 21375.00, 258875.00, 'Pending', '2025-03-15', NULL, 'CRM suite implementation - Phase 1'),
      ('INV-2025-004', 'NexGen Systems', 'David Kim', 45000.00, 4050.00, 49050.00, 'Overdue', '2025-01-31', NULL, 'Platform upgrade services'),
      ('INV-2025-005', 'CloudNine Labs', 'Sarah Chen', 87500.00, 7875.00, 95375.00, 'Paid', '2025-01-15', '2025-01-12', 'Infrastructure setup and configuration'),
      ('INV-2025-006', 'FinServe Global', 'Michael O''Brien', 168000.00, 15120.00, 183120.00, 'Pending', '2025-03-31', NULL, 'Compliance module implementation'),
      ('INV-2025-007', 'HealthTech Pro', 'Lisa Park', 56000.00, 5040.00, 61040.00, 'Draft', '2025-04-15', NULL, 'EHR integration services'),
      ('INV-2025-008', 'RetailPlus Corp', 'Andrew Martinez', 150000.00, 13500.00, 163500.00, 'Pending', '2025-03-01', NULL, 'Omnichannel platform Phase 1'),
      ('INV-2025-009', 'EduLearn Systems', 'Jennifer Taylor', 28500.00, 2565.00, 31065.00, 'Paid', '2025-02-01', '2025-01-28', 'LMS platform setup'),
      ('INV-2025-010', 'SecureNet Inc', 'Daniel Brown', 96000.00, 8640.00, 104640.00, 'Pending', '2025-03-20', NULL, 'Zero-trust implementation Phase 1'),
      ('INV-2025-011', 'MediaWorks Agency', 'Rachel Green', 43750.00, 3937.50, 47687.50, 'Draft', '2025-04-01', NULL, 'Campaign suite setup'),
      ('INV-2025-012', 'GreenErgy Corp', 'Amanda White', 112500.00, 10125.00, 122625.00, 'Overdue', '2025-01-15', NULL, 'Smart grid system Phase 1'),
      ('INV-2025-013', 'LogisticsPro Inc', 'Thomas Anderson', 95000.00, 8550.00, 103550.00, 'Pending', '2025-03-15', NULL, 'Fleet management system'),
      ('INV-2025-014', 'Data Dynamics Inc', 'Robert Thompson', 54000.00, 4860.00, 58860.00, 'Paid', '2025-01-31', '2025-01-30', 'BI package deployment'),
      ('INV-2025-015', 'AeroTech Solutions', 'Christopher Lee', 300000.00, 27000.00, 327000.00, 'Draft', '2025-05-01', NULL, 'Defense contract initial phase')
    `);

    // Seed quotes
    await client.query(`
      INSERT INTO quotes (quote_number, name, account_name, contact_name, amount, discount, total, status, valid_until, notes) VALUES
      ('QT-2025-001', 'Enterprise CRM Bundle', 'TechCorp Industries', 'James Wilson', 285000.00, 10.00, 256500.00, 'Active', '2025-04-15', 'Includes Sales, Service, and Marketing modules'),
      ('QT-2025-002', 'Cloud Migration Package', 'GlobalSoft Solutions', 'Emily Rodriguez', 520000.00, 5.00, 494000.00, 'Active', '2025-03-31', 'Full migration with 12 months support'),
      ('QT-2025-003', 'AI Analytics Suite', 'NexGen Systems', 'David Kim', 180000.00, 0.00, 180000.00, 'Draft', '2025-05-01', 'AI-powered analytics and reporting'),
      ('QT-2025-004', 'Full Platform License', 'Alpha Ventures', 'Maria Santos', 890000.00, 15.00, 756500.00, 'Active', '2025-03-15', 'Enterprise-wide deployment for 2500 users'),
      ('QT-2025-005', 'BI Professional Package', 'Data Dynamics Inc', 'Robert Thompson', 210000.00, 8.00, 193200.00, 'Won', '2025-02-28', 'Power BI + Custom dashboards'),
      ('QT-2025-006', 'Compliance Solution', 'FinServe Global', 'Michael O''Brien', 450000.00, 5.00, 427500.00, 'Active', '2025-04-30', 'Regulatory compliance and audit trail'),
      ('QT-2025-007', 'Healthcare Platform', 'HealthTech Pro', 'Lisa Park', 320000.00, 0.00, 320000.00, 'Draft', '2025-05-15', 'HIPAA-compliant healthcare suite'),
      ('QT-2025-008', 'Retail Commerce Bundle', 'RetailPlus Corp', 'Andrew Martinez', 650000.00, 12.00, 572000.00, 'Active', '2025-03-31', 'Omnichannel commerce + POS'),
      ('QT-2025-009', 'Education Platform', 'EduLearn Systems', 'Jennifer Taylor', 95000.00, 20.00, 76000.00, 'Won', '2025-02-15', 'Non-profit discount applied'),
      ('QT-2025-010', 'Security Operations', 'SecureNet Inc', 'Daniel Brown', 380000.00, 5.00, 361000.00, 'Active', '2025-04-01', 'Security operations center setup'),
      ('QT-2025-011', 'Marketing Automation', 'MediaWorks Agency', 'Rachel Green', 175000.00, 0.00, 175000.00, 'Draft', '2025-05-01', 'Full marketing automation suite'),
      ('QT-2025-012', 'Energy Management', 'GreenErgy Corp', 'Amanda White', 480000.00, 8.00, 441600.00, 'Active', '2025-04-15', 'IoT + energy management platform'),
      ('QT-2025-013', 'Logistics Platform', 'LogisticsPro Inc', 'Thomas Anderson', 420000.00, 5.00, 399000.00, 'Active', '2025-03-31', 'End-to-end logistics management'),
      ('QT-2025-014', 'Defense Systems', 'AeroTech Solutions', 'Christopher Lee', 1500000.00, 3.00, 1455000.00, 'Draft', '2025-06-30', 'Government security clearance required'),
      ('QT-2025-015', 'Startup Growth Package', 'StartupX Inc', 'Alex Turner', 75000.00, 25.00, 56250.00, 'Active', '2025-03-15', 'Special startup pricing program')
    `);

    // Seed orders
    await client.query(`
      INSERT INTO orders (order_number, account_name, contact_name, amount, tax, total, status, shipping_address, order_date, ship_date, notes) VALUES
      ('ORD-2025-001', 'TechCorp Industries', 'James Wilson', 256500.00, 23085.00, 279585.00, 'Delivered', '123 Tech Blvd, San Francisco, CA', '2025-01-05', '2025-01-10', 'Enterprise CRM Bundle - Digital delivery'),
      ('ORD-2025-002', 'GlobalSoft Solutions', 'Emily Rodriguez', 494000.00, 44460.00, 538460.00, 'Processing', '456 Innovation Dr, Austin, TX', '2025-01-15', NULL, 'Cloud migration package - Phased delivery'),
      ('ORD-2025-003', 'Data Dynamics Inc', 'Robert Thompson', 193200.00, 17388.00, 210588.00, 'Delivered', '654 Analytics Pkwy, Chicago, IL', '2025-01-10', '2025-01-15', 'BI Professional Package'),
      ('ORD-2025-004', 'EduLearn Systems', 'Jennifer Taylor', 76000.00, 6840.00, 82840.00, 'Delivered', '753 Education Ln, Portland, OR', '2025-01-08', '2025-01-12', 'Education Platform with NPO discount'),
      ('ORD-2025-005', 'CloudNine Labs', 'Sarah Chen', 350000.00, 31500.00, 381500.00, 'Shipped', '987 Cloud St, Denver, CO', '2025-01-20', '2025-02-01', 'Infrastructure services package'),
      ('ORD-2025-006', 'Alpha Ventures', 'Maria Santos', 756500.00, 68085.00, 824585.00, 'Processing', '321 Enterprise Ave, New York, NY', '2025-02-01', NULL, 'Full platform license - Phase 1'),
      ('ORD-2025-007', 'RetailPlus Corp', 'Andrew Martinez', 572000.00, 51480.00, 623480.00, 'Processing', '864 Commerce Blvd, Miami, FL', '2025-02-05', NULL, 'Retail commerce bundle'),
      ('ORD-2025-008', 'SecureNet Inc', 'Daniel Brown', 361000.00, 32490.00, 393490.00, 'Confirmed', '159 Security Blvd, Washington, DC', '2025-02-10', NULL, 'Security operations platform'),
      ('ORD-2025-009', 'FinServe Global', 'Michael O''Brien', 427500.00, 38475.00, 465975.00, 'Processing', '246 Finance Row, Boston, MA', '2025-02-08', NULL, 'Compliance solution suite'),
      ('ORD-2025-010', 'GreenErgy Corp', 'Amanda White', 441600.00, 39744.00, 481344.00, 'Confirmed', '357 Green Ave, Atlanta, GA', '2025-02-12', NULL, 'Energy management platform'),
      ('ORD-2025-011', 'LogisticsPro Inc', 'Thomas Anderson', 399000.00, 35910.00, 434910.00, 'Pending', '753 Logistics Way, Dallas, TX', '2025-02-15', NULL, 'Logistics management system'),
      ('ORD-2025-012', 'MediaWorks Agency', 'Rachel Green', 175000.00, 15750.00, 190750.00, 'Pending', '462 Media Row, Los Angeles, CA', '2025-02-14', NULL, 'Marketing automation setup'),
      ('ORD-2025-013', 'HealthTech Pro', 'Lisa Park', 320000.00, 28800.00, 348800.00, 'Confirmed', '135 Medical Dr, Houston, TX', '2025-02-10', NULL, 'Healthcare platform deployment'),
      ('ORD-2025-014', 'NexGen Systems', 'David Kim', 180000.00, 16200.00, 196200.00, 'Pending', '789 Digital Way, Seattle, WA', '2025-02-18', NULL, 'AI analytics suite'),
      ('ORD-2025-015', 'AeroTech Solutions', 'Christopher Lee', 1455000.00, 130950.00, 1585950.00, 'Pending', '951 Aero Way, Phoenix, AZ', '2025-02-20', NULL, 'Defense systems contract')
    `);

    // Seed employees
    await client.query(`
      INSERT INTO employees (first_name, last_name, email, phone, department, position, manager, hire_date, salary, status, office_location, skills) VALUES
      ('Sarah', 'Johnson', 'sarah.johnson@dynamics365.com', '+1-555-3001', 'Sales', 'VP of Sales', 'CEO', '2019-03-15', 185000.00, 'Active', 'San Francisco, CA', 'Sales Strategy, CRM, Leadership, Forecasting'),
      ('Mike', 'Chen', 'mike.chen@dynamics365.com', '+1-555-3002', 'Engineering', 'Senior Developer', 'Sarah Johnson', '2020-06-01', 155000.00, 'Active', 'San Francisco, CA', 'Node.js, React, PostgreSQL, AWS'),
      ('Jessica', 'Williams', 'jessica.w@dynamics365.com', '+1-555-3003', 'Marketing', 'Marketing Director', 'CEO', '2019-08-20', 165000.00, 'Active', 'New York, NY', 'Digital Marketing, SEO, Content Strategy'),
      ('David', 'Brown', 'david.b@dynamics365.com', '+1-555-3004', 'Customer Service', 'CS Manager', 'Sarah Johnson', '2020-01-10', 125000.00, 'Active', 'Austin, TX', 'Customer Relations, Support, Training'),
      ('Emily', 'Davis', 'emily.d@dynamics365.com', '+1-555-3005', 'Engineering', 'Frontend Developer', 'Mike Chen', '2021-03-15', 135000.00, 'Active', 'San Francisco, CA', 'React, TypeScript, CSS, UI/UX'),
      ('Robert', 'Martinez', 'robert.m@dynamics365.com', '+1-555-3006', 'Finance', 'Finance Director', 'CEO', '2018-11-01', 175000.00, 'Active', 'New York, NY', 'Financial Planning, Budgeting, Audit'),
      ('Amanda', 'Taylor', 'amanda.t@dynamics365.com', '+1-555-3007', 'HR', 'HR Manager', 'CEO', '2019-05-20', 130000.00, 'Active', 'Chicago, IL', 'Recruitment, Employee Relations, Training'),
      ('Kevin', 'Anderson', 'kevin.a@dynamics365.com', '+1-555-3008', 'Engineering', 'DevOps Engineer', 'Mike Chen', '2021-07-01', 145000.00, 'Active', 'Seattle, WA', 'Docker, Kubernetes, CI/CD, AWS'),
      ('Lisa', 'Thomas', 'lisa.t@dynamics365.com', '+1-555-3009', 'Sales', 'Account Executive', 'Sarah Johnson', '2022-01-15', 110000.00, 'Active', 'Boston, MA', 'B2B Sales, Negotiation, Account Management'),
      ('James', 'Jackson', 'james.j@dynamics365.com', '+1-555-3010', 'Engineering', 'Backend Developer', 'Mike Chen', '2021-09-01', 140000.00, 'Active', 'San Francisco, CA', 'Python, Node.js, PostgreSQL, Redis'),
      ('Nicole', 'White', 'nicole.w@dynamics365.com', '+1-555-3011', 'Marketing', 'Content Manager', 'Jessica Williams', '2022-03-01', 95000.00, 'Active', 'New York, NY', 'Copywriting, Social Media, Analytics'),
      ('Chris', 'Harris', 'chris.h@dynamics365.com', '+1-555-3012', 'Customer Service', 'Support Specialist', 'David Brown', '2022-06-15', 75000.00, 'Active', 'Austin, TX', 'Technical Support, Troubleshooting'),
      ('Patricia', 'Clark', 'patricia.c@dynamics365.com', '+1-555-3013', 'Finance', 'Accountant', 'Robert Martinez', '2021-11-01', 90000.00, 'Active', 'New York, NY', 'Accounting, Excel, SAP, Auditing'),
      ('Brian', 'Lewis', 'brian.l@dynamics365.com', '+1-555-3014', 'Engineering', 'QA Engineer', 'Mike Chen', '2022-02-01', 115000.00, 'Active', 'Seattle, WA', 'Testing, Automation, Selenium, Jest'),
      ('Michelle', 'Walker', 'michelle.w@dynamics365.com', '+1-555-3015', 'Sales', 'Sales Development Rep', 'Sarah Johnson', '2023-01-10', 80000.00, 'Active', 'Denver, CO', 'Prospecting, Cold Calling, CRM')
    `);

    // Seed projects
    await client.query(`
      INSERT INTO projects (name, description, account_name, manager, status, priority, start_date, end_date, budget, actual_cost, progress) VALUES
      ('CRM Platform v3.0', 'Major platform upgrade with AI-powered features, redesigned UI, and performance improvements', 'Internal', 'Mike Chen', 'In Progress', 'Critical', '2025-01-01', '2025-06-30', 500000.00, 125000.00, 35),
      ('TechCorp Integration', 'Custom integration development for TechCorp enterprise deployment', 'TechCorp Industries', 'Sarah Johnson', 'In Progress', 'High', '2025-01-15', '2025-04-30', 120000.00, 45000.00, 40),
      ('Mobile App Redesign', 'Complete redesign of iOS and Android mobile applications', 'Internal', 'Emily Davis', 'In Progress', 'High', '2025-02-01', '2025-07-31', 250000.00, 30000.00, 15),
      ('GlobalSoft Migration', 'Full cloud migration for GlobalSoft including data, integrations, and training', 'GlobalSoft Solutions', 'Mike Chen', 'Planning', 'High', '2025-03-01', '2025-08-31', 500000.00, 0.00, 5),
      ('AI Copilot Development', 'Develop AI copilot features including natural language queries and smart suggestions', 'Internal', 'James Jackson', 'In Progress', 'Critical', '2025-01-10', '2025-05-31', 350000.00, 85000.00, 30),
      ('Security Audit 2025', 'Annual security audit and penetration testing with remediation', 'Internal', 'Kevin Anderson', 'In Progress', 'Critical', '2025-01-05', '2025-03-31', 80000.00, 35000.00, 55),
      ('Partner Portal v2', 'Redesign partner portal with self-service onboarding and analytics', 'Internal', 'Sarah Johnson', 'Planning', 'Medium', '2025-04-01', '2025-09-30', 200000.00, 0.00, 0),
      ('RetailPlus Commerce', 'E-commerce platform implementation for RetailPlus omnichannel strategy', 'RetailPlus Corp', 'David Brown', 'In Progress', 'High', '2025-01-20', '2025-06-30', 600000.00, 95000.00, 20),
      ('Data Warehouse Optimization', 'Optimize data warehouse performance and implement real-time analytics', 'Internal', 'James Jackson', 'In Progress', 'Medium', '2025-02-01', '2025-04-30', 150000.00, 42000.00, 45),
      ('Healthcare Compliance', 'Implement HIPAA compliance features for healthcare vertical', 'HealthTech Pro', 'Mike Chen', 'Planning', 'High', '2025-03-15', '2025-08-31', 280000.00, 0.00, 0),
      ('Marketing Automation v2', 'Upgrade marketing automation engine with AI-driven campaign optimization', 'Internal', 'Jessica Williams', 'In Progress', 'Medium', '2025-01-15', '2025-05-31', 180000.00, 50000.00, 25),
      ('Customer Self-Service Portal', 'Build self-service portal for customers with KB, ticketing, and community', 'Internal', 'David Brown', 'In Progress', 'Medium', '2025-02-01', '2025-07-31', 220000.00, 35000.00, 18),
      ('API Gateway Modernization', 'Replace legacy API gateway with modern solution supporting GraphQL', 'Internal', 'Kevin Anderson', 'Planning', 'High', '2025-04-01', '2025-07-31', 120000.00, 0.00, 0),
      ('FinServe Compliance Module', 'Custom compliance module development for financial services regulations', 'FinServe Global', 'Robert Martinez', 'In Progress', 'Critical', '2025-01-20', '2025-05-31', 420000.00, 110000.00, 35),
      ('Performance Optimization Q1', 'System-wide performance optimization targeting 50% improvement in response times', 'Internal', 'Mike Chen', 'In Progress', 'High', '2025-01-01', '2025-03-31', 100000.00, 65000.00, 70)
    `);

    // Seed tasks
    await client.query(`
      INSERT INTO tasks (title, description, project_name, assigned_to, priority, status, due_date, estimated_hours, actual_hours, category) VALUES
      ('Design AI copilot UI mockups', 'Create wireframes and high-fidelity mockups for the AI copilot interface', 'AI Copilot Development', 'Emily Davis', 'High', 'Completed', '2025-02-01', 40.00, 38.00, 'Design'),
      ('Implement OpenRouter integration', 'Set up OpenRouter API integration for AI model access', 'AI Copilot Development', 'James Jackson', 'Critical', 'In Progress', '2025-02-15', 60.00, 25.00, 'Development'),
      ('Database migration script', 'Write migration scripts for v3.0 schema changes', 'CRM Platform v3.0', 'Mike Chen', 'High', 'In Progress', '2025-02-10', 24.00, 16.00, 'Development'),
      ('Security penetration testing', 'Conduct external penetration test on all public endpoints', 'Security Audit 2025', 'Kevin Anderson', 'Critical', 'In Progress', '2025-02-28', 80.00, 45.00, 'Security'),
      ('Mobile app navigation redesign', 'Redesign navigation patterns for improved UX on mobile', 'Mobile App Redesign', 'Emily Davis', 'High', 'Not Started', '2025-03-01', 32.00, 0.00, 'Design'),
      ('TechCorp SSO integration', 'Implement SAML SSO for TechCorp corporate identity provider', 'TechCorp Integration', 'Kevin Anderson', 'High', 'In Progress', '2025-02-20', 20.00, 12.00, 'Development'),
      ('Write API documentation', 'Document all new v3.0 API endpoints with examples', 'CRM Platform v3.0', 'Brian Lewis', 'Medium', 'Not Started', '2025-03-15', 40.00, 0.00, 'Documentation'),
      ('Performance baseline testing', 'Establish performance baselines before optimization', 'Performance Optimization Q1', 'Brian Lewis', 'High', 'Completed', '2025-01-15', 16.00, 14.00, 'Testing'),
      ('RetailPlus payment gateway', 'Integrate Stripe and PayPal payment gateways', 'RetailPlus Commerce', 'James Jackson', 'High', 'In Progress', '2025-03-01', 48.00, 20.00, 'Development'),
      ('HIPAA compliance checklist', 'Create and validate HIPAA compliance requirements checklist', 'Healthcare Compliance', 'David Brown', 'High', 'Not Started', '2025-03-20', 24.00, 0.00, 'Compliance'),
      ('Email template builder', 'Build drag-and-drop email template builder component', 'Marketing Automation v2', 'Emily Davis', 'Medium', 'In Progress', '2025-03-15', 56.00, 28.00, 'Development'),
      ('Customer portal wireframes', 'Design wireframes for customer self-service portal', 'Customer Self-Service Portal', 'Emily Davis', 'Medium', 'Completed', '2025-02-15', 24.00, 22.00, 'Design'),
      ('FinServe audit trail system', 'Implement comprehensive audit trail for all financial transactions', 'FinServe Compliance Module', 'Mike Chen', 'Critical', 'In Progress', '2025-03-01', 64.00, 30.00, 'Development'),
      ('Load testing infrastructure', 'Set up load testing environment and scripts', 'Performance Optimization Q1', 'Kevin Anderson', 'High', 'In Progress', '2025-02-15', 20.00, 15.00, 'Testing'),
      ('GlobalSoft data mapping', 'Map GlobalSoft legacy data fields to Dynamics 365 schema', 'GlobalSoft Migration', 'Mike Chen', 'High', 'Not Started', '2025-03-10', 32.00, 0.00, 'Planning')
    `);

    // Seed activities
    await client.query(`
      INSERT INTO activities (type, subject, description, regarding, assigned_to, status, priority, start_date, end_date, location) VALUES
      ('Meeting', 'TechCorp Quarterly Review', 'Quarterly business review with TechCorp leadership team', 'TechCorp Industries', 'Sarah Johnson', 'Planned', 'High', '2025-03-01 10:00:00', '2025-03-01 11:30:00', 'Microsoft Teams'),
      ('Call', 'Follow up with Alpha Ventures', 'Discuss CRM implementation timeline and budget approval', 'Alpha Ventures', 'Lisa Thomas', 'Completed', 'High', '2025-02-10 14:00:00', '2025-02-10 14:30:00', 'Phone'),
      ('Email', 'Send proposal to NexGen', 'Send updated AI analytics proposal with revised pricing', 'NexGen Systems', 'Michelle Walker', 'Planned', 'Normal', '2025-02-18 09:00:00', '2025-02-18 09:15:00', 'Email'),
      ('Meeting', 'Sprint Planning - CRM v3.0', 'Bi-weekly sprint planning for CRM Platform v3.0 project', 'CRM Platform v3.0', 'Mike Chen', 'Planned', 'High', '2025-02-24 09:00:00', '2025-02-24 10:00:00', 'Conference Room A'),
      ('Task', 'Prepare demo environment', 'Set up demo environment for FinServe compliance presentation', 'FinServe Global', 'Kevin Anderson', 'In Progress', 'High', '2025-02-17 08:00:00', '2025-02-19 17:00:00', 'Office'),
      ('Call', 'CloudNine infrastructure review', 'Review infrastructure deployment progress and next steps', 'CloudNine Labs', 'Sarah Johnson', 'Planned', 'Normal', '2025-02-20 15:00:00', '2025-02-20 15:45:00', 'Zoom'),
      ('Meeting', 'Marketing Campaign Review', 'Review Q1 marketing campaign performance and Q2 planning', 'Internal', 'Jessica Williams', 'Planned', 'Normal', '2025-02-25 11:00:00', '2025-02-25 12:00:00', 'Conference Room B'),
      ('Email', 'RetailPlus project update', 'Send weekly project status update to RetailPlus stakeholders', 'RetailPlus Corp', 'David Brown', 'Completed', 'Normal', '2025-02-14 16:00:00', '2025-02-14 16:15:00', 'Email'),
      ('Meeting', 'Security Audit Findings', 'Present security audit findings and remediation plan to leadership', 'Security Audit 2025', 'Kevin Anderson', 'Planned', 'Critical', '2025-03-05 13:00:00', '2025-03-05 14:30:00', 'Board Room'),
      ('Call', 'EduLearn onboarding check-in', 'Check in on EduLearn platform onboarding progress', 'EduLearn Systems', 'Lisa Thomas', 'Completed', 'Low', '2025-02-12 10:00:00', '2025-02-12 10:30:00', 'Phone'),
      ('Task', 'Update sales forecast', 'Update Q1 sales forecast with latest pipeline data', 'Internal', 'Sarah Johnson', 'Planned', 'High', '2025-02-21 08:00:00', '2025-02-21 17:00:00', 'Office'),
      ('Meeting', 'Partner onboarding workshop', 'Workshop for new solution partners on platform capabilities', 'Partner Portal v2', 'Sarah Johnson', 'Planned', 'Normal', '2025-03-10 09:00:00', '2025-03-10 16:00:00', 'Training Center'),
      ('Call', 'GreenErgy smart grid demo', 'Demo smart grid management features to GreenErgy team', 'GreenErgy Corp', 'Mike Chen', 'Planned', 'High', '2025-02-22 14:00:00', '2025-02-22 15:00:00', 'Microsoft Teams'),
      ('Email', 'Monthly newsletter draft', 'Review and approve February customer newsletter', 'Internal', 'Nicole White', 'In Progress', 'Low', '2025-02-19 09:00:00', '2025-02-19 12:00:00', 'Office'),
      ('Meeting', 'All-Hands Company Meeting', 'Monthly all-hands meeting with company updates and Q&A', 'Internal', 'CEO', 'Planned', 'High', '2025-02-28 16:00:00', '2025-02-28 17:30:00', 'Main Auditorium')
    `);

    // Seed territories
    await client.query(`
      INSERT INTO territories (name, region, manager, description, target_revenue, actual_revenue, account_count, status) VALUES
      ('West Coast Enterprise', 'West', 'Sarah Johnson', 'Enterprise accounts in CA, OR, WA', 5000000.00, 2100000.00, 45, 'Active'),
      ('East Coast Enterprise', 'East', 'Lisa Thomas', 'Enterprise accounts in NY, MA, DC', 6000000.00, 2800000.00, 52, 'Active'),
      ('Central US', 'Central', 'Michelle Walker', 'All accounts in IL, TX, CO, MN', 3500000.00, 1400000.00, 38, 'Active'),
      ('Southeast Region', 'Southeast', 'Sarah Johnson', 'Accounts in FL, GA, NC, VA', 2500000.00, 950000.00, 28, 'Active'),
      ('Northeast SMB', 'Northeast', 'Michelle Walker', 'SMB accounts in northeastern states', 1500000.00, 680000.00, 65, 'Active'),
      ('Pacific Northwest', 'West', 'Lisa Thomas', 'Tech accounts in Seattle/Portland area', 4000000.00, 1850000.00, 35, 'Active'),
      ('Southwest Region', 'Southwest', 'Michelle Walker', 'Accounts in AZ, NM, NV, UT', 1800000.00, 720000.00, 22, 'Active'),
      ('Great Lakes', 'Central', 'Lisa Thomas', 'Accounts in MI, OH, IN, WI', 2200000.00, 880000.00, 30, 'Active'),
      ('Mountain States', 'West', 'Sarah Johnson', 'Accounts in CO, MT, WY, ID', 1200000.00, 450000.00, 18, 'Active'),
      ('Mid-Atlantic', 'East', 'Lisa Thomas', 'Accounts in PA, NJ, DE, MD', 2800000.00, 1200000.00, 40, 'Active'),
      ('New England', 'Northeast', 'Michelle Walker', 'Accounts in MA, CT, RI, VT, NH, ME', 2000000.00, 850000.00, 32, 'Active'),
      ('Texas Metro', 'South', 'Sarah Johnson', 'Major metro accounts in TX', 3200000.00, 1350000.00, 42, 'Active'),
      ('Southern California', 'West', 'Lisa Thomas', 'LA, San Diego, Orange County accounts', 3800000.00, 1600000.00, 48, 'Active'),
      ('Federal & Government', 'National', 'Sarah Johnson', 'Federal government and defense accounts', 8000000.00, 2500000.00, 15, 'Active'),
      ('International EMEA', 'International', 'Lisa Thomas', 'European, Middle East, and Africa accounts', 4500000.00, 1100000.00, 25, 'Active')
    `);

    // Seed competitors
    await client.query(`
      INSERT INTO competitors (name, website, industry, strengths, weaknesses, market_share, threat_level, notes, status) VALUES
      ('Salesforce', 'www.salesforce.com', 'CRM', 'Market leader, extensive ecosystem, AppExchange marketplace', 'Expensive, complex implementation, vendor lock-in', 23.80, 'High', 'Primary competitor in CRM space', 'Active'),
      ('SAP', 'www.sap.com', 'ERP', 'Strong ERP capabilities, large enterprise focus, global presence', 'Complex, expensive, slow innovation cycle', 5.40, 'High', 'Competitor in ERP and enterprise applications', 'Active'),
      ('Oracle', 'www.oracle.com', 'Enterprise Software', 'Database expertise, comprehensive suite, cloud infrastructure', 'Complex pricing, legacy reputation, UI concerns', 4.80, 'High', 'Competes across multiple product lines', 'Active'),
      ('HubSpot', 'www.hubspot.com', 'CRM/Marketing', 'User-friendly, strong inbound marketing, freemium model', 'Limited enterprise features, scalability concerns', 3.20, 'Medium', 'Growing threat in SMB and mid-market', 'Active'),
      ('Zoho', 'www.zoho.com', 'Business Apps', 'Affordable pricing, wide product suite, good for SMBs', 'Limited enterprise features, smaller ecosystem', 1.50, 'Low', 'Price competitor in SMB segment', 'Active'),
      ('ServiceNow', 'www.servicenow.com', 'IT Service Mgmt', 'IT service management leader, workflow automation', 'Limited CRM capabilities, IT-focused', 2.10, 'Medium', 'Competitor in service management', 'Active'),
      ('Freshworks', 'www.freshworks.com', 'Business Software', 'Modern UI, affordable, easy to implement', 'Limited enterprise features, smaller market presence', 0.80, 'Low', 'Growing in SMB market', 'Active'),
      ('Pipedrive', 'www.pipedrive.com', 'CRM', 'Sales-focused, intuitive interface, good pipeline management', 'Limited beyond sales, no service/marketing modules', 0.60, 'Low', 'Niche sales CRM competitor', 'Active'),
      ('NetSuite (Oracle)', 'www.netsuite.com', 'ERP', 'Cloud-native ERP, good for growing companies', 'Oracle acquisition concerns, limited CRM', 3.50, 'Medium', 'Strong in cloud ERP space', 'Active'),
      ('Workday', 'www.workday.com', 'HR/Finance', 'Strong HR and finance, modern cloud architecture', 'Limited CRM, expensive, niche focus', 2.80, 'Medium', 'Competitor in HR and financial management', 'Active'),
      ('Monday.com', 'www.monday.com', 'Work Management', 'Visual project management, user-friendly, flexible', 'Not a true CRM/ERP, limited enterprise features', 0.90, 'Low', 'Competitor in project management', 'Active'),
      ('Zendesk', 'www.zendesk.com', 'Customer Service', 'Strong support platform, easy integration, omnichannel', 'Limited beyond service, acquired by private equity', 1.80, 'Medium', 'Competitor in customer service space', 'Active'),
      ('Adobe Experience Cloud', 'www.adobe.com', 'Marketing', 'Strong marketing analytics, creative suite integration', 'Complex, expensive, not a full CRM', 2.40, 'Medium', 'Competitor in marketing and analytics', 'Active'),
      ('Sage', 'www.sage.com', 'Accounting/ERP', 'Strong in accounting, established brand, compliance focus', 'Dated UI, slow cloud transition', 1.20, 'Low', 'Competitor in accounting and small business ERP', 'Active'),
      ('Pegasystems', 'www.pega.com', 'CRM/BPM', 'Strong BPM capabilities, AI-powered decisions, low-code', 'Complex, expensive, smaller market share', 0.70, 'Low', 'Niche competitor in process automation', 'Active')
    `);

    // Seed goals
    await client.query(`
      INSERT INTO goals (name, owner, type, target_value, actual_value, start_date, end_date, status, progress, notes) VALUES
      ('Q1 Revenue Target', 'Sarah Johnson', 'Revenue', 5000000.00, 2850000.00, '2025-01-01', '2025-03-31', 'In Progress', 57, 'On track to exceed target'),
      ('New Customer Acquisition', 'Michelle Walker', 'Acquisition', 50.00, 23.00, '2025-01-01', '2025-03-31', 'In Progress', 46, 'Need to increase outreach efforts'),
      ('Customer Satisfaction Score', 'David Brown', 'CSAT', 95.00, 92.00, '2025-01-01', '2025-12-31', 'In Progress', 97, 'Strong performance in support quality'),
      ('Pipeline Growth', 'Lisa Thomas', 'Pipeline', 15000000.00, 8500000.00, '2025-01-01', '2025-06-30', 'In Progress', 57, 'Good momentum from Q1 campaigns'),
      ('Employee Retention Rate', 'Amanda Taylor', 'HR', 95.00, 97.00, '2025-01-01', '2025-12-31', 'In Progress', 100, 'Exceeding target with improved benefits'),
      ('Product NPS Score', 'Mike Chen', 'NPS', 70.00, 65.00, '2025-01-01', '2025-12-31', 'In Progress', 93, 'v3.0 features expected to boost NPS'),
      ('Marketing Qualified Leads', 'Jessica Williams', 'Leads', 500.00, 185.00, '2025-01-01', '2025-06-30', 'In Progress', 37, 'Webinar series generating strong leads'),
      ('Partner Revenue Share', 'Sarah Johnson', 'Revenue', 2000000.00, 650000.00, '2025-01-01', '2025-06-30', 'In Progress', 33, 'Partner enablement program ramping up'),
      ('Platform Uptime SLA', 'Kevin Anderson', 'Operational', 99.95, 99.98, '2025-01-01', '2025-12-31', 'In Progress', 100, 'Exceeding 99.95% uptime target'),
      ('Support Ticket Resolution', 'David Brown', 'Service', 4.00, 3.80, '2025-01-01', '2025-12-31', 'In Progress', 100, 'Average resolution under 4 hours target'),
      ('Annual Recurring Revenue', 'Sarah Johnson', 'Revenue', 20000000.00, 12500000.00, '2025-01-01', '2025-12-31', 'In Progress', 63, 'Strong enterprise deal pipeline'),
      ('Developer Community Growth', 'Mike Chen', 'Community', 5000.00, 2200.00, '2025-01-01', '2025-12-31', 'In Progress', 44, 'Community launch events driving growth'),
      ('Cost Reduction Target', 'Robert Martinez', 'Finance', 500000.00, 180000.00, '2025-01-01', '2025-12-31', 'In Progress', 36, 'Cloud optimization savings on track'),
      ('Training Completion Rate', 'Amanda Taylor', 'HR', 100.00, 75.00, '2025-01-01', '2025-06-30', 'In Progress', 75, '75% of team completed required training'),
      ('Enterprise Deal Close Rate', 'Lisa Thomas', 'Sales', 35.00, 32.00, '2025-01-01', '2025-12-31', 'In Progress', 91, 'Close to target, strong Q1 performance')
    `);

    // Seed departments
    await client.query(`
      INSERT INTO departments (name, code, manager, parent_department, employee_count, budget, location, phone, email, status, description) VALUES
      ('Engineering', 'ENG', 'Mike Chen', NULL, 45, 2500000.00, 'San Francisco, CA', '+1-555-4001', 'engineering@dynamics365.com', 'Active', 'Software development and platform engineering'),
      ('Sales', 'SAL', 'Sarah Johnson', NULL, 30, 1800000.00, 'San Francisco, CA', '+1-555-4002', 'sales@dynamics365.com', 'Active', 'Enterprise and commercial sales operations'),
      ('Marketing', 'MKT', 'Jessica Williams', NULL, 15, 1200000.00, 'New York, NY', '+1-555-4003', 'marketing@dynamics365.com', 'Active', 'Brand, demand generation, and content marketing'),
      ('Customer Service', 'CS', 'David Brown', NULL, 20, 900000.00, 'Austin, TX', '+1-555-4004', 'support@dynamics365.com', 'Active', 'Customer support and success operations'),
      ('Finance', 'FIN', 'Robert Martinez', NULL, 12, 600000.00, 'New York, NY', '+1-555-4005', 'finance@dynamics365.com', 'Active', 'Financial planning, accounting, and reporting'),
      ('Human Resources', 'HR', 'Amanda Taylor', NULL, 8, 500000.00, 'Chicago, IL', '+1-555-4006', 'hr@dynamics365.com', 'Active', 'Talent acquisition, development, and employee relations'),
      ('DevOps', 'OPS', 'Kevin Anderson', 'Engineering', 10, 800000.00, 'Seattle, WA', '+1-555-4007', 'devops@dynamics365.com', 'Active', 'Infrastructure, CI/CD, and platform reliability'),
      ('Product Management', 'PM', 'Sarah Chen', 'Engineering', 8, 700000.00, 'San Francisco, CA', '+1-555-4008', 'product@dynamics365.com', 'Active', 'Product strategy, roadmap, and requirements'),
      ('Sales Development', 'SDR', 'Michelle Walker', 'Sales', 12, 600000.00, 'Denver, CO', '+1-555-4009', 'sdr@dynamics365.com', 'Active', 'Lead generation and outbound prospecting'),
      ('Account Management', 'AM', 'Lisa Thomas', 'Sales', 10, 500000.00, 'Boston, MA', '+1-555-4010', 'accounts@dynamics365.com', 'Active', 'Existing customer relationship management'),
      ('Content Marketing', 'CM', 'Nicole White', 'Marketing', 6, 400000.00, 'New York, NY', '+1-555-4011', 'content@dynamics365.com', 'Active', 'Blog, social media, and content strategy'),
      ('Quality Assurance', 'QA', 'Brian Lewis', 'Engineering', 8, 550000.00, 'Seattle, WA', '+1-555-4012', 'qa@dynamics365.com', 'Active', 'Testing, automation, and quality standards'),
      ('Legal', 'LEG', 'Patricia Clark', 'Finance', 4, 350000.00, 'New York, NY', '+1-555-4013', 'legal@dynamics365.com', 'Active', 'Contracts, compliance, and legal affairs'),
      ('Security', 'SEC', 'Daniel Brown', 'Engineering', 6, 650000.00, 'Washington, DC', '+1-555-4014', 'security@dynamics365.com', 'Active', 'Information security and compliance'),
      ('Executive Office', 'EXEC', 'CEO', NULL, 5, 1500000.00, 'San Francisco, CA', '+1-555-4015', 'executive@dynamics365.com', 'Active', 'C-suite leadership and corporate strategy')
    `);

    // Seed performance_reviews
    await client.query(`
      INSERT INTO performance_reviews (employee_name, reviewer, review_period, overall_rating, goals_rating, skills_rating, communication_rating, status, strengths, improvements, comments, review_date) VALUES
      ('Mike Chen', 'CEO', 'H2 2024', 4.5, 4.8, 4.5, 4.2, 'Completed', 'Exceptional technical leadership, strong architectural decisions', 'Could delegate more to develop team leads', 'Outstanding contributor, ready for VP role', '2025-01-15'),
      ('Sarah Johnson', 'CEO', 'H2 2024', 4.7, 4.9, 4.5, 4.8, 'Completed', 'Exceeded all sales targets, excellent team motivation', 'Needs to improve pipeline documentation', 'Top performer, exceeded quota by 120%', '2025-01-15'),
      ('Emily Davis', 'Mike Chen', 'H2 2024', 4.2, 4.0, 4.5, 4.3, 'Completed', 'Outstanding UI/UX skills, great attention to detail', 'Should present more in team meetings', 'Strong frontend contributor, growing quickly', '2025-01-20'),
      ('David Brown', 'Sarah Johnson', 'H2 2024', 3.8, 3.5, 4.0, 4.2, 'Completed', 'Great customer empathy, solid problem resolution', 'Needs to improve escalation response times', 'Reliable team player, customers love working with him', '2025-01-20'),
      ('Kevin Anderson', 'Mike Chen', 'H2 2024', 4.3, 4.5, 4.2, 3.8, 'Completed', 'Excellent infrastructure skills, zero downtime record', 'Written communication could be clearer', 'Critical team member, keeps systems running', '2025-01-22'),
      ('James Jackson', 'Mike Chen', 'H2 2024', 4.0, 3.8, 4.3, 4.0, 'Completed', 'Strong backend skills, good code quality', 'Should contribute more to code reviews', 'Solid developer, growing into senior role', '2025-01-22'),
      ('Lisa Thomas', 'Sarah Johnson', 'H2 2024', 4.4, 4.6, 4.2, 4.5, 'Completed', 'Excellent client relationships, strong negotiation skills', 'Needs to improve CRM data hygiene', 'Top account executive, consistently hits targets', '2025-01-25'),
      ('Jessica Williams', 'CEO', 'H2 2024', 4.1, 4.0, 4.3, 4.2, 'Completed', 'Creative campaign ideas, strong brand instinct', 'Should improve campaign ROI tracking', 'Good marketing leader with growth potential', '2025-01-25'),
      ('Robert Martinez', 'CEO', 'H2 2024', 4.3, 4.5, 4.2, 4.0, 'Completed', 'Accurate financial reporting, strong audit preparation', 'Could be more proactive in cost optimization', 'Trusted finance leader', '2025-01-28'),
      ('Amanda Taylor', 'CEO', 'H2 2024', 4.0, 3.8, 4.2, 4.5, 'Completed', 'Excellent employee relations, strong recruiting pipeline', 'Should implement more HR analytics', 'Great culture champion', '2025-01-28'),
      ('Nicole White', 'Jessica Williams', 'H2 2024', 3.9, 3.7, 4.2, 4.0, 'Completed', 'Great writing skills, consistent content output', 'Should learn more about SEO analytics', 'Growing content professional', '2025-01-30'),
      ('Chris Harris', 'David Brown', 'H2 2024', 3.5, 3.3, 3.8, 3.7, 'Completed', 'Good troubleshooting skills, friendly demeanor', 'Needs to improve ticket resolution speed', 'Developing support specialist', '2025-01-30'),
      ('Brian Lewis', 'Mike Chen', 'H2 2024', 4.1, 4.0, 4.3, 3.9, 'Completed', 'Thorough testing approach, good automation coverage', 'Should improve test documentation', 'Strong QA contributor', '2025-02-01'),
      ('Patricia Clark', 'Robert Martinez', 'H2 2024', 4.0, 4.2, 3.8, 4.0, 'Completed', 'Detail-oriented accounting, zero audit findings', 'Could automate more reporting processes', 'Reliable finance team member', '2025-02-01'),
      ('Michelle Walker', 'Sarah Johnson', 'H2 2024', 3.7, 3.5, 3.8, 4.2, 'In Progress', 'Enthusiastic prospecting, good call technique', 'Needs to improve qualification criteria', 'Promising SDR with growth trajectory', '2025-02-15')
    `);

    // Seed leave_requests
    await client.query(`
      INSERT INTO leave_requests (employee_name, leave_type, start_date, end_date, days_requested, reason, status, approved_by, notes) VALUES
      ('Emily Davis', 'Vacation', '2025-03-10', '2025-03-14', 5.0, 'Spring vacation - family trip to Hawaii', 'Approved', 'Mike Chen', 'Coverage arranged with Brian'),
      ('Mike Chen', 'Personal', '2025-02-28', '2025-02-28', 1.0, 'Personal appointment', 'Approved', 'CEO', NULL),
      ('Lisa Thomas', 'Vacation', '2025-04-01', '2025-04-11', 9.0, 'European vacation - Italy and France', 'Approved', 'Sarah Johnson', 'Michelle covering accounts'),
      ('Chris Harris', 'Sick', '2025-02-17', '2025-02-18', 2.0, 'Flu symptoms', 'Approved', 'David Brown', 'Working from home if feeling better'),
      ('Kevin Anderson', 'Conference', '2025-03-15', '2025-03-17', 3.0, 'AWS re:Invent conference attendance', 'Approved', 'Mike Chen', 'Presenting on infrastructure scaling'),
      ('Nicole White', 'Vacation', '2025-03-24', '2025-03-28', 5.0, 'Spring break with family', 'Pending', NULL, NULL),
      ('Amanda Taylor', 'Personal', '2025-03-05', '2025-03-05', 1.0, 'Moving day', 'Approved', 'CEO', NULL),
      ('James Jackson', 'Sick', '2025-02-10', '2025-02-11', 2.0, 'Dental surgery', 'Approved', 'Mike Chen', 'Recovery expected 2 days'),
      ('Sarah Johnson', 'Vacation', '2025-04-21', '2025-04-25', 5.0, 'Annual family reunion', 'Pending', NULL, 'Lisa and Michelle covering'),
      ('Brian Lewis', 'Training', '2025-03-03', '2025-03-04', 2.0, 'Selenium advanced certification course', 'Approved', 'Mike Chen', 'Online training'),
      ('Robert Martinez', 'Vacation', '2025-05-12', '2025-05-16', 5.0, 'Anniversary trip', 'Pending', NULL, NULL),
      ('David Brown', 'Conference', '2025-03-20', '2025-03-21', 2.0, 'Customer Service Summit 2025', 'Approved', 'CEO', 'Speaking engagement'),
      ('Patricia Clark', 'Sick', '2025-02-05', '2025-02-05', 1.0, 'Migraine', 'Approved', 'Robert Martinez', NULL),
      ('Jessica Williams', 'Vacation', '2025-06-02', '2025-06-06', 5.0, 'Summer vacation', 'Pending', NULL, 'Nicole handling campaigns'),
      ('Michelle Walker', 'Personal', '2025-03-12', '2025-03-12', 1.0, 'Doctor appointment', 'Approved', 'Sarah Johnson', 'Half day PM')
    `);

    // Seed work_orders
    await client.query(`
      INSERT INTO work_orders (work_order_number, title, account_name, contact_name, type, priority, status, assigned_to, scheduled_date, completed_date, estimated_hours, actual_hours, description, resolution, location) VALUES
      ('WO-2025-001', 'Server rack installation', 'TechCorp Industries', 'James Wilson', 'Installation', 'High', 'Completed', 'Kevin Anderson', '2025-01-20', '2025-01-20', 8.00, 7.50, 'Install and configure new server rack in data center', 'Rack installed, cabling completed, servers online', 'TechCorp Data Center, SF'),
      ('WO-2025-002', 'Network switch replacement', 'GlobalSoft Solutions', 'Emily Rodriguez', 'Maintenance', 'Critical', 'In Progress', 'Kevin Anderson', '2025-02-18', NULL, 4.00, 2.00, 'Replace failing network switch in building B', NULL, 'GlobalSoft Office, Austin'),
      ('WO-2025-003', 'Software deployment', 'Alpha Ventures', 'Maria Santos', 'Deployment', 'High', 'Scheduled', 'James Jackson', '2025-02-25', NULL, 6.00, 0.00, 'Deploy CRM v3.0 to production environment', NULL, 'Remote'),
      ('WO-2025-004', 'Firewall configuration', 'SecureNet Inc', 'Daniel Brown', 'Configuration', 'Critical', 'In Progress', 'Kevin Anderson', '2025-02-19', NULL, 5.00, 3.00, 'Configure new firewall rules for zero-trust implementation', NULL, 'SecureNet Office, DC'),
      ('WO-2025-005', 'Database optimization', 'Data Dynamics Inc', 'Robert Thompson', 'Optimization', 'Medium', 'Completed', 'Mike Chen', '2025-02-10', '2025-02-11', 12.00, 10.00, 'Optimize database queries and indexes for BI platform', 'Indexes rebuilt, queries optimized, 60% performance improvement', 'Remote'),
      ('WO-2025-006', 'Printer fleet setup', 'RetailPlus Corp', 'Andrew Martinez', 'Installation', 'Low', 'Scheduled', 'Chris Harris', '2025-03-01', NULL, 4.00, 0.00, 'Set up 10 network printers across retail locations', NULL, 'RetailPlus Miami HQ'),
      ('WO-2025-007', 'VPN configuration', 'FinServe Global', 'Michael O''Brien', 'Configuration', 'High', 'Completed', 'Kevin Anderson', '2025-02-05', '2025-02-05', 3.00, 2.50, 'Configure site-to-site VPN for Boston and NYC offices', 'VPN tunnel established with redundancy', 'Remote'),
      ('WO-2025-008', 'Backup system audit', 'CloudNine Labs', 'Sarah Chen', 'Audit', 'Medium', 'In Progress', 'Brian Lewis', '2025-02-20', NULL, 8.00, 4.00, 'Audit backup systems and verify disaster recovery procedures', NULL, 'CloudNine Denver Office'),
      ('WO-2025-009', 'Desktop refresh', 'EduLearn Systems', 'Jennifer Taylor', 'Installation', 'Low', 'Scheduled', 'Chris Harris', '2025-03-10', NULL, 16.00, 0.00, 'Replace 20 outdated workstations with new hardware', NULL, 'EduLearn Portland Office'),
      ('WO-2025-010', 'Security camera installation', 'AeroTech Solutions', 'Christopher Lee', 'Installation', 'High', 'Completed', 'Kevin Anderson', '2025-01-25', '2025-01-26', 10.00, 11.00, 'Install 24 security cameras in new wing', 'All cameras installed, monitoring active', 'AeroTech Phoenix Facility'),
      ('WO-2025-011', 'Wi-Fi expansion', 'MediaWorks Agency', 'Rachel Green', 'Installation', 'Medium', 'Scheduled', 'Chris Harris', '2025-02-28', NULL, 6.00, 0.00, 'Expand Wi-Fi coverage to new creative studio space', NULL, 'MediaWorks LA Studio'),
      ('WO-2025-012', 'Server migration', 'HealthTech Pro', 'Lisa Park', 'Migration', 'Critical', 'In Progress', 'Mike Chen', '2025-02-15', NULL, 24.00, 12.00, 'Migrate on-premise servers to HIPAA-compliant cloud', NULL, 'Remote'),
      ('WO-2025-013', 'UPS battery replacement', 'GreenErgy Corp', 'Amanda White', 'Maintenance', 'High', 'Scheduled', 'Kevin Anderson', '2025-03-05', NULL, 3.00, 0.00, 'Replace UPS batteries in server room', NULL, 'GreenErgy Atlanta DC'),
      ('WO-2025-014', 'Phone system upgrade', 'LogisticsPro Inc', 'Thomas Anderson', 'Upgrade', 'Medium', 'Completed', 'Chris Harris', '2025-02-01', '2025-02-03', 8.00, 9.00, 'Upgrade to VoIP phone system across all departments', 'VoIP deployed, all extensions migrated', 'LogisticsPro Dallas HQ'),
      ('WO-2025-015', 'Compliance scan', 'NexGen Systems', 'David Kim', 'Audit', 'High', 'In Progress', 'Brian Lewis', '2025-02-22', NULL, 6.00, 2.00, 'Run SOC2 compliance vulnerability scan', NULL, 'Remote')
    `);

    // Seed sla_policies
    await client.query(`
      INSERT INTO sla_policies (name, description, entity_type, priority, response_time_hours, resolution_time_hours, escalation_time_hours, business_hours_only, status, applicable_to) VALUES
      ('Critical Response SLA', 'Immediate response required for system outages and critical failures', 'Cases', 'Critical', 1, 4, 2, false, 'Active', 'All Enterprise Accounts'),
      ('High Priority SLA', 'Fast response for high-impact issues affecting business operations', 'Cases', 'High', 2, 8, 4, true, 'Active', 'All Enterprise Accounts'),
      ('Medium Priority SLA', 'Standard response for general issues and requests', 'Cases', 'Medium', 4, 24, 12, true, 'Active', 'All Accounts'),
      ('Low Priority SLA', 'Relaxed timeline for minor issues and feature requests', 'Cases', 'Low', 8, 72, 48, true, 'Active', 'All Accounts'),
      ('Enterprise Gold SLA', 'Premium SLA for Gold-tier enterprise customers', 'Cases', 'Critical', 0, 2, 1, false, 'Active', 'Gold Enterprise Accounts'),
      ('Enterprise Silver SLA', 'Enhanced SLA for Silver-tier enterprise customers', 'Cases', 'High', 1, 6, 3, false, 'Active', 'Silver Enterprise Accounts'),
      ('Partner Support SLA', 'Dedicated SLA for solution partners', 'Cases', 'High', 2, 12, 6, true, 'Active', 'Partner Accounts'),
      ('Work Order Standard SLA', 'Standard timeline for field service work orders', 'Work Orders', 'Medium', 4, 48, 24, true, 'Active', 'All Accounts'),
      ('Work Order Emergency SLA', 'Emergency response for critical field service issues', 'Work Orders', 'Critical', 1, 8, 4, false, 'Active', 'All Accounts'),
      ('Lead Response SLA', 'Ensure quick follow-up on new leads', 'Leads', 'High', 2, 24, 12, true, 'Active', 'All Lead Sources'),
      ('Quote Response SLA', 'Timely quote generation and delivery', 'Quotes', 'Medium', 4, 48, 24, true, 'Active', 'All Quote Requests'),
      ('Onboarding SLA', 'New customer onboarding completion timeline', 'Projects', 'High', 24, 720, 480, true, 'Active', 'New Customers'),
      ('SMB Support SLA', 'Standard support for small business customers', 'Cases', 'Medium', 8, 48, 24, true, 'Active', 'SMB Accounts'),
      ('Government Compliance SLA', 'Compliance-grade SLA for government accounts', 'Cases', 'Critical', 1, 4, 2, false, 'Active', 'Government Accounts'),
      ('Training Request SLA', 'Response time for training and enablement requests', 'Cases', 'Low', 24, 168, 72, true, 'Active', 'All Accounts')
    `);

    // Seed email_templates
    await client.query(`
      INSERT INTO email_templates (name, subject, body, category, type, language, status, created_by, usage_count) VALUES
      ('Welcome New Customer', 'Welcome to Dynamics 365 - Getting Started', 'Dear {contact_name},\n\nWelcome to Microsoft Dynamics 365! We are thrilled to have you on board.\n\nYour account has been set up and is ready to use. Here are your next steps:\n1. Log in to your dashboard\n2. Complete your profile setup\n3. Schedule your onboarding session\n\nBest regards,\nDynamics 365 Team', 'Onboarding', 'Automated', 'English', 'Published', 'Sarah Johnson', 234),
      ('Deal Won Notification', 'Congratulations! Deal Closed - {opportunity_name}', 'Hi Team,\n\nGreat news! We have successfully closed the deal:\n\nDeal: {opportunity_name}\nAccount: {account_name}\nValue: {amount}\n\nThank you to everyone who contributed to this win!\n\nBest,\n{user_name}', 'Sales', 'Notification', 'English', 'Published', 'Sarah Johnson', 89),
      ('Case Resolution', 'Your support case #{case_id} has been resolved', 'Dear {contact_name},\n\nWe are pleased to inform you that your support case has been resolved.\n\nCase: {case_title}\nResolution: {resolution}\n\nIf you need further assistance, please dont hesitate to reach out.\n\nBest regards,\nSupport Team', 'Service', 'Automated', 'English', 'Published', 'David Brown', 567),
      ('Monthly Newsletter', 'Dynamics 365 Monthly Update - {month} {year}', 'Dear Valued Customer,\n\nHere are the highlights from this month:\n\n- New Features Released\n- Upcoming Webinars\n- Customer Success Spotlight\n- Product Tips and Tricks\n\nStay connected!\nDynamics 365 Team', 'Marketing', 'Newsletter', 'English', 'Published', 'Nicole White', 12),
      ('Quote Follow-up', 'Following up on your quote - {quote_number}', 'Hi {contact_name},\n\nI wanted to follow up on the quote we sent you last week.\n\nQuote: {quote_number}\nTotal: {total}\nValid Until: {valid_until}\n\nDo you have any questions? Id love to schedule a call to discuss.\n\nBest,\n{user_name}', 'Sales', 'Follow-up', 'English', 'Published', 'Lisa Thomas', 156),
      ('Invoice Reminder', 'Payment Reminder - Invoice {invoice_number}', 'Dear {contact_name},\n\nThis is a friendly reminder that invoice {invoice_number} is due on {due_date}.\n\nAmount Due: {total}\n\nPlease process the payment at your earliest convenience.\n\nThank you,\nFinance Team', 'Finance', 'Automated', 'English', 'Published', 'Robert Martinez', 342),
      ('Meeting Confirmation', 'Meeting Confirmed - {subject}', 'Hi {contact_name},\n\nThis confirms our meeting:\n\nDate: {start_date}\nTime: {start_time}\nLocation: {location}\nAgenda: {description}\n\nLooking forward to connecting!\n\nBest,\n{user_name}', 'General', 'Confirmation', 'English', 'Published', 'Sarah Johnson', 445),
      ('Product Update', 'Exciting New Features in Dynamics 365', 'Dear Customer,\n\nWe are excited to announce new features in your Dynamics 365 platform:\n\n- AI Copilot enhancements\n- Improved dashboard analytics\n- New mobile app features\n- Enhanced security controls\n\nLog in to explore these updates today!\n\nThe Product Team', 'Marketing', 'Announcement', 'English', 'Published', 'Jessica Williams', 78),
      ('Lead Nurture - Step 1', 'Discover the Power of Dynamics 365', 'Hi {first_name},\n\nThank you for your interest in Dynamics 365.\n\nI wanted to share some resources that might be helpful:\n- Product overview video\n- Customer success stories\n- Free trial signup\n\nWould you be open to a quick 15-minute call this week?\n\nBest,\n{user_name}', 'Marketing', 'Nurture', 'English', 'Published', 'Michelle Walker', 289),
      ('Contract Renewal', 'Your Dynamics 365 contract renewal is approaching', 'Dear {contact_name},\n\nYour Dynamics 365 contract is up for renewal on {renewal_date}.\n\nCurrent Plan: {contract_name}\nContract Value: {value}\n\nLets schedule a call to discuss your renewal options and any enhancements you may need.\n\nBest regards,\nAccount Management', 'Sales', 'Reminder', 'English', 'Published', 'Lisa Thomas', 67),
      ('Onboarding Checklist', 'Your Dynamics 365 Onboarding Checklist', 'Welcome {contact_name}!\n\nHere is your onboarding checklist:\n\n[ ] Complete profile setup\n[ ] Import your data\n[ ] Configure dashboards\n[ ] Set up integrations\n[ ] Train your team\n[ ] Go live!\n\nYour onboarding specialist will guide you through each step.\n\nBest,\nOnboarding Team', 'Onboarding', 'Checklist', 'English', 'Published', 'David Brown', 134),
      ('Survey Request', 'How was your experience? Quick survey', 'Dear {contact_name},\n\nWe value your feedback! Please take 2 minutes to complete our satisfaction survey.\n\nYour input helps us improve our products and services.\n\n[Take Survey]\n\nThank you!\nCustomer Success Team', 'Service', 'Survey', 'English', 'Published', 'David Brown', 201),
      ('Webinar Invitation', 'Join Us: {webinar_name} - Live Webinar', 'Hi {first_name},\n\nYou are invited to our upcoming webinar:\n\nTopic: {webinar_name}\nDate: {start_date}\nTime: {start_time}\nSpeaker: {speaker_name}\n\nReserve your spot today!\n\nBest regards,\nEvents Team', 'Marketing', 'Invitation', 'English', 'Published', 'Jessica Williams', 178),
      ('Escalation Alert', 'URGENT: Case #{case_id} has been escalated', 'ATTENTION: A support case has been escalated.\n\nCase: {case_title}\nAccount: {account_name}\nPriority: {priority}\nReason: SLA breach approaching\n\nPlease take immediate action.\n\nSupport System', 'Service', 'Alert', 'English', 'Published', 'David Brown', 45),
      ('Year in Review', 'Your Dynamics 365 Year in Review', 'Dear {contact_name},\n\nHere is your year in review with Dynamics 365:\n\n- Deals Closed: {deals_count}\n- Revenue Generated: {revenue}\n- Cases Resolved: {cases_count}\n- Active Users: {users_count}\n\nThank you for being a valued customer!\n\nThe Dynamics 365 Team', 'Marketing', 'Report', 'English', 'Draft', 'Jessica Williams', 0)
    `);

    // Seed expense_reports
    await client.query(`
      INSERT INTO expense_reports (report_number, employee_name, department, purpose, total_amount, status, submitted_date, approved_by, approved_date, category, notes) VALUES
      ('EXP-2025-001', 'Sarah Johnson', 'Sales', 'Client dinner with TechCorp team', 485.00, 'Approved', '2025-01-18', 'CEO', '2025-01-20', 'Meals & Entertainment', 'Business development dinner'),
      ('EXP-2025-002', 'Kevin Anderson', 'Engineering', 'AWS re:Invent conference travel', 3250.00, 'Approved', '2025-01-10', 'Mike Chen', '2025-01-12', 'Travel', 'Flight, hotel, and meals for 3 days'),
      ('EXP-2025-003', 'Lisa Thomas', 'Sales', 'Client visit to Boston accounts', 1890.00, 'Approved', '2025-02-01', 'Sarah Johnson', '2025-02-03', 'Travel', 'Round trip flight and 2 nights hotel'),
      ('EXP-2025-004', 'Jessica Williams', 'Marketing', 'Digital Transformation Summit sponsorship materials', 5500.00, 'Pending', '2025-02-10', NULL, NULL, 'Marketing', 'Booth materials and promotional items'),
      ('EXP-2025-005', 'Mike Chen', 'Engineering', 'Team offsite dinner', 780.00, 'Approved', '2025-01-25', 'CEO', '2025-01-27', 'Meals & Entertainment', 'Engineering team quarterly dinner'),
      ('EXP-2025-006', 'David Brown', 'Customer Service', 'Customer Service Summit registration', 1200.00, 'Approved', '2025-02-05', 'CEO', '2025-02-07', 'Training', 'Conference registration and travel'),
      ('EXP-2025-007', 'Nicole White', 'Marketing', 'Photography equipment for content', 2100.00, 'Pending', '2025-02-12', NULL, NULL, 'Equipment', 'Camera and lighting for product videos'),
      ('EXP-2025-008', 'Michelle Walker', 'Sales', 'Prospect lunch meetings (5 meetings)', 425.00, 'Approved', '2025-02-08', 'Sarah Johnson', '2025-02-10', 'Meals & Entertainment', 'Business development lunches'),
      ('EXP-2025-009', 'Robert Martinez', 'Finance', 'Accounting software annual subscription', 3600.00, 'Approved', '2025-01-05', 'CEO', '2025-01-07', 'Software', 'Annual license renewal'),
      ('EXP-2025-010', 'Amanda Taylor', 'HR', 'Job fair booth and materials', 1800.00, 'Approved', '2025-01-28', 'CEO', '2025-01-30', 'Recruiting', 'University job fair participation'),
      ('EXP-2025-011', 'Brian Lewis', 'Engineering', 'Testing tools subscription', 960.00, 'Approved', '2025-02-01', 'Mike Chen', '2025-02-03', 'Software', 'BrowserStack annual plan'),
      ('EXP-2025-012', 'James Jackson', 'Engineering', 'Home office monitor upgrade', 650.00, 'Pending', '2025-02-15', NULL, NULL, 'Equipment', 'Ultrawide monitor for remote work'),
      ('EXP-2025-013', 'Patricia Clark', 'Finance', 'CPA certification renewal', 450.00, 'Approved', '2025-01-15', 'Robert Martinez', '2025-01-17', 'Training', 'Annual CPA license renewal'),
      ('EXP-2025-014', 'Emily Davis', 'Engineering', 'UX design workshop', 1500.00, 'Approved', '2025-02-03', 'Mike Chen', '2025-02-05', 'Training', 'Advanced UX certification workshop'),
      ('EXP-2025-015', 'Chris Harris', 'Customer Service', 'Customer appreciation gift baskets', 375.00, 'Draft', NULL, NULL, NULL, 'Customer Relations', 'Holiday gift baskets for top accounts')
    `);

    // Seed payments
    await client.query(`
      INSERT INTO payments (payment_number, account_name, invoice_number, amount, payment_method, payment_date, reference, status, notes) VALUES
      ('PAY-2025-001', 'TechCorp Industries', 'INV-2025-001', 51775.00, 'Wire Transfer', '2025-02-10', 'WT-TEC-20250210', 'Completed', 'Q1 enterprise license payment'),
      ('PAY-2025-002', 'GlobalSoft Solutions', 'INV-2025-002', 124260.00, 'Wire Transfer', '2025-02-25', 'WT-GLS-20250225', 'Completed', 'Annual migration services payment'),
      ('PAY-2025-003', 'CloudNine Labs', 'INV-2025-005', 95375.00, 'ACH Transfer', '2025-01-12', 'ACH-CLN-20250112', 'Completed', 'Infrastructure setup payment'),
      ('PAY-2025-004', 'EduLearn Systems', 'INV-2025-009', 31065.00, 'Credit Card', '2025-01-28', 'CC-EDU-20250128', 'Completed', 'LMS platform setup payment'),
      ('PAY-2025-005', 'Data Dynamics Inc', 'INV-2025-014', 58860.00, 'Wire Transfer', '2025-01-30', 'WT-DDI-20250130', 'Completed', 'BI package deployment payment'),
      ('PAY-2025-006', 'Alpha Ventures', 'INV-2025-003', 129437.50, 'Wire Transfer', '2025-02-15', 'WT-ALV-20250215', 'Completed', 'CRM suite Phase 1 - partial payment'),
      ('PAY-2025-007', 'RetailPlus Corp', 'INV-2025-008', 81750.00, 'ACH Transfer', '2025-02-20', 'ACH-RPC-20250220', 'Processing', 'Omnichannel platform - 50% deposit'),
      ('PAY-2025-008', 'SecureNet Inc', 'INV-2025-010', 52320.00, 'Wire Transfer', '2025-02-18', 'WT-SNI-20250218', 'Processing', 'Zero-trust Phase 1 - 50% deposit'),
      ('PAY-2025-009', 'FinServe Global', 'INV-2025-006', 91560.00, 'Wire Transfer', '2025-02-12', 'WT-FSG-20250212', 'Completed', 'Compliance module - 50% deposit'),
      ('PAY-2025-010', 'LogisticsPro Inc', 'INV-2025-013', 51775.00, 'ACH Transfer', '2025-02-15', 'ACH-LPI-20250215', 'Pending', 'Fleet management - 50% deposit'),
      ('PAY-2025-011', 'TechCorp Industries', NULL, 25000.00, 'Wire Transfer', '2025-01-05', 'WT-TEC-20250105', 'Completed', 'Support plan advance payment'),
      ('PAY-2025-012', 'GlobalSoft Solutions', NULL, 15000.00, 'Credit Card', '2025-02-01', 'CC-GLS-20250201', 'Completed', 'Additional user licenses'),
      ('PAY-2025-013', 'NexGen Systems', 'INV-2025-004', 24525.00, 'ACH Transfer', '2025-02-14', 'ACH-NXG-20250214', 'Processing', 'Platform upgrade - partial payment'),
      ('PAY-2025-014', 'GreenErgy Corp', 'INV-2025-012', 61312.50, 'Wire Transfer', '2025-02-10', 'WT-GEC-20250210', 'Failed', 'Smart grid Phase 1 - payment returned'),
      ('PAY-2025-015', 'MediaWorks Agency', NULL, 10000.00, 'Credit Card', '2025-02-08', 'CC-MWA-20250208', 'Completed', 'Campaign suite deposit')
    `);

    // Seed vendors
    await client.query(`
      INSERT INTO vendors (name, contact_name, email, phone, website, address, city, country, category, payment_terms, rating, status, notes) VALUES
      ('Amazon Web Services', 'AWS Sales Team', 'aws-enterprise@amazon.com', '+1-800-555-0101', 'aws.amazon.com', '410 Terry Ave N', 'Seattle', 'United States', 'Cloud Infrastructure', 'Net 30', 4.8, 'Active', 'Primary cloud infrastructure provider'),
      ('Microsoft Azure', 'Azure Enterprise', 'azure@microsoft.com', '+1-800-555-0102', 'azure.microsoft.com', '1 Microsoft Way', 'Redmond', 'United States', 'Cloud Infrastructure', 'Net 30', 4.7, 'Active', 'Secondary cloud and Office 365'),
      ('Stripe Inc', 'Stripe Support', 'support@stripe.com', '+1-800-555-0103', 'stripe.com', '354 Oyster Point Blvd', 'San Francisco', 'United States', 'Payment Processing', 'Per Transaction', 4.6, 'Active', 'Payment gateway provider'),
      ('SendGrid (Twilio)', 'SendGrid Sales', 'sales@sendgrid.com', '+1-800-555-0104', 'sendgrid.com', '1801 California St', 'Denver', 'United States', 'Email Services', 'Monthly', 4.3, 'Active', 'Transactional and marketing email'),
      ('Datadog Inc', 'Datadog Sales', 'sales@datadog.com', '+1-800-555-0105', 'datadog.com', '620 8th Ave', 'New York', 'United States', 'Monitoring', 'Annual', 4.5, 'Active', 'Infrastructure and APM monitoring'),
      ('Cloudflare', 'CF Enterprise', 'enterprise@cloudflare.com', '+1-800-555-0106', 'cloudflare.com', '101 Townsend St', 'San Francisco', 'United States', 'CDN & Security', 'Annual', 4.4, 'Active', 'CDN, DDoS protection, and DNS'),
      ('Slack Technologies', 'Slack Sales', 'sales@slack.com', '+1-800-555-0107', 'slack.com', '500 Howard St', 'San Francisco', 'United States', 'Communication', 'Annual', 4.2, 'Active', 'Team communication platform'),
      ('Zoom Video', 'Zoom Enterprise', 'enterprise@zoom.us', '+1-800-555-0108', 'zoom.us', '55 Almaden Blvd', 'San Jose', 'United States', 'Video Conferencing', 'Annual', 4.3, 'Active', 'Video conferencing and webinars'),
      ('GitHub (Microsoft)', 'GH Enterprise', 'enterprise@github.com', '+1-800-555-0109', 'github.com', '88 Colin P Kelly Jr St', 'San Francisco', 'United States', 'Development Tools', 'Annual', 4.7, 'Active', 'Source code management and CI/CD'),
      ('Okta Inc', 'Okta Sales', 'sales@okta.com', '+1-800-555-0110', 'okta.com', '100 First St', 'San Francisco', 'United States', 'Identity & Access', 'Annual', 4.4, 'Active', 'SSO and identity management'),
      ('Salesforce (Tableau)', 'Tableau Sales', 'sales@tableau.com', '+1-800-555-0111', 'tableau.com', '1621 N 34th St', 'Seattle', 'United States', 'Analytics', 'Annual', 4.1, 'Inactive', 'Previously used for BI, migrated to Power BI'),
      ('DocuSign', 'DS Enterprise', 'sales@docusign.com', '+1-800-555-0112', 'docusign.com', '221 Main St', 'San Francisco', 'United States', 'Document Management', 'Annual', 4.5, 'Active', 'Electronic signatures and agreements'),
      ('Jira (Atlassian)', 'Atlassian Sales', 'sales@atlassian.com', '+1-800-555-0113', 'atlassian.com', '350 Bush St', 'San Francisco', 'United States', 'Project Management', 'Annual', 4.3, 'Active', 'Issue tracking and project management'),
      ('PagerDuty', 'PD Enterprise', 'sales@pagerduty.com', '+1-800-555-0114', 'pagerduty.com', '600 Townsend St', 'San Francisco', 'United States', 'Incident Management', 'Annual', 4.2, 'Active', 'Incident response and on-call management'),
      ('Snowflake Inc', 'Snowflake Sales', 'sales@snowflake.com', '+1-800-555-0115', 'snowflake.com', '106 E Babcock St', 'Bozeman', 'United States', 'Data Warehouse', 'Usage-Based', 4.6, 'Active', 'Cloud data warehouse for analytics')
    `);

    // Seed price_lists
    await client.query(`
      INSERT INTO price_lists (name, description, currency, effective_date, expiry_date, discount_percent, status, type, territory) VALUES
      ('Enterprise Standard 2025', 'Standard pricing for enterprise customers', 'USD', '2025-01-01', '2025-12-31', 0.00, 'Active', 'Standard', 'All Territories'),
      ('Enterprise Volume Discount', 'Volume-based pricing for 500+ users', 'USD', '2025-01-01', '2025-12-31', 15.00, 'Active', 'Volume', 'All Territories'),
      ('SMB Growth Pricing', 'Discounted pricing for growing SMB customers', 'USD', '2025-01-01', '2025-12-31', 20.00, 'Active', 'Promotional', 'All US Territories'),
      ('Partner Pricing', 'Special pricing for certified partners', 'USD', '2025-01-01', '2025-12-31', 25.00, 'Active', 'Partner', 'All Territories'),
      ('Government Pricing', 'Government contract pricing', 'USD', '2025-01-01', '2025-12-31', 10.00, 'Active', 'Government', 'Federal & Government'),
      ('Education Pricing', 'Non-profit and education discount pricing', 'USD', '2025-01-01', '2025-12-31', 30.00, 'Active', 'Education', 'All Territories'),
      ('EMEA Standard 2025', 'Standard pricing for EMEA region', 'EUR', '2025-01-01', '2025-12-31', 0.00, 'Active', 'Standard', 'International EMEA'),
      ('Startup Accelerator', 'Special pricing for qualifying startups', 'USD', '2025-01-01', '2025-06-30', 40.00, 'Active', 'Promotional', 'All US Territories'),
      ('Annual Commitment', 'Pricing for annual prepayment commitment', 'USD', '2025-01-01', '2025-12-31', 12.00, 'Active', 'Commitment', 'All Territories'),
      ('Multi-Year Agreement', 'Pricing for 3-year agreements', 'USD', '2025-01-01', '2027-12-31', 18.00, 'Active', 'Commitment', 'All Territories'),
      ('Healthcare Vertical', 'Specialized pricing for healthcare industry', 'USD', '2025-01-01', '2025-12-31', 8.00, 'Active', 'Vertical', 'All US Territories'),
      ('Financial Services', 'Pricing for financial services sector', 'USD', '2025-01-01', '2025-12-31', 5.00, 'Active', 'Vertical', 'All US Territories'),
      ('Q1 Promotion', 'Q1 2025 promotional pricing', 'USD', '2025-01-01', '2025-03-31', 22.00, 'Active', 'Promotional', 'All Territories'),
      ('Competitive Displacement', 'Switch from competitor pricing', 'USD', '2025-01-01', '2025-12-31', 35.00, 'Active', 'Competitive', 'All Territories'),
      ('Renewal Loyalty', 'Loyalty pricing for renewing customers', 'USD', '2025-01-01', '2025-12-31', 10.00, 'Active', 'Loyalty', 'All Territories')
    `);

    // Seed discounts
    await client.query(`
      INSERT INTO discounts (name, code, type, value, min_quantity, max_quantity, start_date, end_date, applicable_to, status, description) VALUES
      ('New Customer Welcome', 'WELCOME25', 'Percentage', 25.00, 1, NULL, '2025-01-01', '2025-12-31', 'New Customers', 'Active', '25% off first year for new customers'),
      ('Volume 100+', 'VOL100', 'Percentage', 10.00, 100, 499, '2025-01-01', '2025-12-31', 'All Products', 'Active', '10% volume discount for 100-499 licenses'),
      ('Volume 500+', 'VOL500', 'Percentage', 15.00, 500, 999, '2025-01-01', '2025-12-31', 'All Products', 'Active', '15% volume discount for 500-999 licenses'),
      ('Volume 1000+', 'VOL1000', 'Percentage', 20.00, 1000, NULL, '2025-01-01', '2025-12-31', 'All Products', 'Active', '20% volume discount for 1000+ licenses'),
      ('Annual Prepay', 'ANNUAL12', 'Percentage', 12.00, 1, NULL, '2025-01-01', '2025-12-31', 'All Products', 'Active', '12% discount for annual prepayment'),
      ('3-Year Commitment', 'COMMIT3Y', 'Percentage', 18.00, 1, NULL, '2025-01-01', '2025-12-31', 'All Products', 'Active', '18% discount for 3-year commitment'),
      ('Partner Referral', 'PARTNER20', 'Percentage', 20.00, 1, NULL, '2025-01-01', '2025-12-31', 'Partner Referrals', 'Active', '20% partner referral discount'),
      ('Competitive Switch', 'SWITCH35', 'Percentage', 35.00, 1, NULL, '2025-01-01', '2025-06-30', 'Competitor Customers', 'Active', '35% off for switching from competitors'),
      ('Education Discount', 'EDU30', 'Percentage', 30.00, 1, NULL, '2025-01-01', '2025-12-31', 'Education & Non-Profit', 'Active', '30% education and non-profit discount'),
      ('Government Discount', 'GOV10', 'Percentage', 10.00, 1, NULL, '2025-01-01', '2025-12-31', 'Government', 'Active', '10% government pricing discount'),
      ('Q1 Flash Sale', 'Q1FLASH', 'Fixed Amount', 500.00, 1, NULL, '2025-01-15', '2025-03-31', 'All Products', 'Active', '$500 off any annual plan'),
      ('Bundle Discount', 'BUNDLE15', 'Percentage', 15.00, 3, NULL, '2025-01-01', '2025-12-31', 'Product Bundles', 'Active', '15% off when purchasing 3+ modules'),
      ('Loyalty Renewal', 'LOYAL10', 'Percentage', 10.00, 1, NULL, '2025-01-01', '2025-12-31', 'Renewing Customers', 'Active', '10% loyalty discount on renewals'),
      ('Startup Special', 'STARTUP40', 'Percentage', 40.00, 1, 50, '2025-01-01', '2025-12-31', 'Qualifying Startups', 'Active', '40% off for startups under 50 employees'),
      ('Healthcare Vertical', 'HEALTH8', 'Percentage', 8.00, 1, NULL, '2025-01-01', '2025-12-31', 'Healthcare Organizations', 'Active', '8% healthcare industry discount')
    `);

    // Seed audit_logs
    await client.query(`
      INSERT INTO audit_logs (action, entity_type, entity_id, user_name, changes, ip_address, timestamp, details) VALUES
      ('Login', 'User', 1, 'admin@dynamics365.com', NULL, '192.168.1.100', '2025-02-21 08:15:00', 'Successful login from Chrome on macOS'),
      ('Create', 'Contact', 16, 'sarah.johnson@dynamics365.com', 'New contact created', '192.168.1.101', '2025-02-21 09:30:00', 'Created contact: John Smith at NewCorp'),
      ('Update', 'Opportunity', 3, 'sarah.johnson@dynamics365.com', 'stage: Qualify -> Develop, probability: 30 -> 50', '192.168.1.101', '2025-02-21 10:00:00', 'Advanced opportunity to Develop stage'),
      ('Delete', 'Lead', 99, 'mike.chen@dynamics365.com', 'Deleted duplicate lead', '192.168.1.102', '2025-02-21 10:15:00', 'Removed duplicate lead entry'),
      ('Update', 'Case', 5, 'mike.chen@dynamics365.com', 'status: New -> In Progress, assigned_to: -> Mike Chen', '192.168.1.102', '2025-02-21 10:30:00', 'Assigned case and started investigation'),
      ('Export', 'Contacts', NULL, 'sarah.johnson@dynamics365.com', 'Exported 150 contacts to CSV', '192.168.1.101', '2025-02-21 11:00:00', 'Bulk data export for marketing campaign'),
      ('Login', 'User', 2, 'sarah.johnson@dynamics365.com', NULL, '192.168.1.101', '2025-02-21 08:00:00', 'Successful login from Edge on Windows'),
      ('Update', 'Invoice', 4, 'robert.martinez@dynamics365.com', 'status: Pending -> Overdue', '192.168.1.105', '2025-02-21 09:00:00', 'System auto-updated overdue invoice'),
      ('Create', 'Quote', 16, 'lisa.thomas@dynamics365.com', 'New quote created', '192.168.1.109', '2025-02-21 11:30:00', 'Created quote for BuildRight Corp'),
      ('Update', 'Employee', 12, 'amanda.taylor@dynamics365.com', 'salary: 75000 -> 80000', '192.168.1.107', '2025-02-21 14:00:00', 'Annual salary adjustment'),
      ('Login Failed', 'User', NULL, 'unknown@test.com', NULL, '45.33.32.156', '2025-02-21 03:00:00', 'Failed login attempt from unknown IP'),
      ('Update', 'Project', 1, 'mike.chen@dynamics365.com', 'progress: 30 -> 35', '192.168.1.102', '2025-02-21 15:00:00', 'Updated CRM v3.0 project progress'),
      ('Create', 'Campaign', 16, 'jessica.williams@dynamics365.com', 'New campaign created', '192.168.1.103', '2025-02-21 09:45:00', 'Created Q2 email nurture campaign'),
      ('Permission Change', 'User', 3, 'admin@dynamics365.com', 'role: user -> manager', '192.168.1.100', '2025-02-21 16:00:00', 'Promoted Mike Chen to manager role'),
      ('Bulk Update', 'Leads', NULL, 'michelle.walker@dynamics365.com', 'Updated 25 lead statuses', '192.168.1.115', '2025-02-21 13:00:00', 'Bulk status update after qualification review')
    `);

    // Seed notifications
    await client.query(`
      INSERT INTO notifications (title, message, type, recipient, priority, status, link) VALUES
      ('New Lead Assigned', 'A new lead from TechBridge Inc has been assigned to you', 'Lead', 'Michelle Walker', 'High', 'Unread', '/leads'),
      ('Case Escalated', 'Case #5 - API rate limiting issues has been escalated to Critical', 'Alert', 'Mike Chen', 'Critical', 'Unread', '/cases'),
      ('Deal Won!', 'Congratulations! CloudNine Infrastructure deal ($350K) has been closed', 'Success', 'Sarah Johnson', 'Normal', 'Read', '/opportunities'),
      ('Invoice Overdue', 'Invoice INV-2025-004 for NexGen Systems is now overdue', 'Warning', 'Robert Martinez', 'High', 'Unread', '/invoices'),
      ('Meeting Reminder', 'TechCorp Quarterly Review meeting starts in 1 hour', 'Reminder', 'Sarah Johnson', 'Normal', 'Read', '/activities'),
      ('SLA Warning', 'Case #9 is approaching SLA breach - 2 hours remaining', 'Alert', 'Mike Chen', 'Critical', 'Unread', '/cases'),
      ('New Comment', 'David Brown commented on Project: RetailPlus Commerce', 'Info', 'David Brown', 'Normal', 'Read', '/projects'),
      ('Approval Required', 'Expense report EXP-2025-004 requires your approval', 'Approval', 'CEO', 'High', 'Unread', '/expense_reports'),
      ('Contract Expiring', 'Contract with AeroTech Solutions expires in 30 days', 'Warning', 'Lisa Thomas', 'High', 'Unread', '/contracts'),
      ('Goal Update', 'Q1 Revenue Target is at 57% - on track to exceed', 'Info', 'Sarah Johnson', 'Normal', 'Read', '/goals'),
      ('System Update', 'Dynamics 365 will be updated to v3.0 this weekend', 'System', 'All Users', 'Normal', 'Unread', '/dashboard'),
      ('Leave Approved', 'Your vacation request for Mar 10-14 has been approved', 'Success', 'Emily Davis', 'Normal', 'Read', '/leave_requests'),
      ('New Work Order', 'Work order WO-2025-009 has been assigned to you', 'Task', 'Chris Harris', 'Normal', 'Unread', '/work_orders'),
      ('Training Reminder', 'Security Awareness Training is due by March 31', 'Reminder', 'All Users', 'Normal', 'Unread', '/training_courses'),
      ('Payment Received', 'Payment of $124,260 received from GlobalSoft Solutions', 'Success', 'Robert Martinez', 'Normal', 'Read', '/payments')
    `);

    // Seed customer_segments
    await client.query(`
      INSERT INTO customer_segments (name, description, criteria, member_count, type, status, created_by, last_evaluated) VALUES
      ('Enterprise Accounts', 'Accounts with 1000+ employees and $50M+ revenue', 'employee_count >= 1000 AND annual_revenue >= 50000000', 6, 'Dynamic', 'Active', 'Sarah Johnson', '2025-02-15'),
      ('Mid-Market Accounts', 'Accounts with 100-999 employees', 'employee_count >= 100 AND employee_count < 1000', 5, 'Dynamic', 'Active', 'Sarah Johnson', '2025-02-15'),
      ('SMB Accounts', 'Small business accounts under 100 employees', 'employee_count < 100', 4, 'Dynamic', 'Active', 'Michelle Walker', '2025-02-15'),
      ('High-Value Pipeline', 'Opportunities over $500K in pipeline', 'amount >= 500000 AND status = Open', 4, 'Dynamic', 'Active', 'Sarah Johnson', '2025-02-15'),
      ('At-Risk Customers', 'Customers with open critical cases or overdue invoices', 'has_critical_case OR has_overdue_invoice', 3, 'Dynamic', 'Active', 'David Brown', '2025-02-15'),
      ('Technology Sector', 'All accounts in technology and software industries', 'industry IN (Technology, Software, Cloud Computing)', 4, 'Dynamic', 'Active', 'Jessica Williams', '2025-02-15'),
      ('Financial Services', 'All accounts in financial services industry', 'industry = Financial Services', 2, 'Dynamic', 'Active', 'Jessica Williams', '2025-02-15'),
      ('Healthcare Vertical', 'All accounts in healthcare industry', 'industry = Healthcare', 1, 'Dynamic', 'Active', 'Jessica Williams', '2025-02-15'),
      ('West Coast Accounts', 'Accounts located in CA, OR, WA', 'state IN (CA, OR, WA)', 5, 'Dynamic', 'Active', 'Sarah Johnson', '2025-02-15'),
      ('Newsletter Subscribers', 'Contacts subscribed to monthly newsletter', 'newsletter_opt_in = true', 89, 'Static', 'Active', 'Nicole White', '2025-02-10'),
      ('Webinar Attendees Q1', 'Contacts who attended Q1 webinars', 'attended_q1_webinar = true', 156, 'Static', 'Active', 'Jessica Williams', '2025-02-10'),
      ('Trial Users', 'Users currently on free trial', 'account_type = trial AND trial_active = true', 34, 'Dynamic', 'Active', 'Michelle Walker', '2025-02-15'),
      ('Renewal Due Q2', 'Customers with contracts renewing in Q2 2025', 'contract_end_date BETWEEN 2025-04-01 AND 2025-06-30', 8, 'Dynamic', 'Active', 'Lisa Thomas', '2025-02-15'),
      ('Inactive Accounts', 'Accounts with no activity in 90+ days', 'last_activity_date < 90_days_ago', 2, 'Dynamic', 'Active', 'Sarah Johnson', '2025-02-15'),
      ('Champion Users', 'Power users with high engagement scores', 'engagement_score >= 80', 12, 'Dynamic', 'Active', 'David Brown', '2025-02-15')
    `);

    // Seed training_courses
    await client.query(`
      INSERT INTO training_courses (name, description, category, instructor, duration_hours, max_participants, enrolled, completed, start_date, end_date, location, status, format) VALUES
      ('Dynamics 365 Sales Fundamentals', 'Core training on sales module features, pipeline management, and forecasting', 'Sales', 'Sarah Johnson', 8.00, 30, 28, 25, '2025-01-15', '2025-01-16', 'Conference Room A', 'Completed', 'In-Person'),
      ('CRM Platform Administration', 'System administration, security roles, and configuration', 'Technical', 'Mike Chen', 16.00, 20, 18, 0, '2025-03-01', '2025-03-04', 'Training Lab', 'Scheduled', 'In-Person'),
      ('Customer Service Excellence', 'Best practices for case management and customer satisfaction', 'Service', 'David Brown', 4.00, 25, 22, 20, '2025-01-20', '2025-01-20', 'Microsoft Teams', 'Completed', 'Virtual'),
      ('AI Copilot Workshop', 'Hands-on training with AI features and copilot capabilities', 'AI', 'James Jackson', 6.00, 25, 25, 0, '2025-02-25', '2025-02-25', 'Innovation Lab', 'Scheduled', 'In-Person'),
      ('Security Awareness Training', 'Annual security awareness and phishing prevention', 'Security', 'Kevin Anderson', 2.00, 100, 75, 75, '2025-01-10', '2025-03-31', 'Online Portal', 'In Progress', 'Self-Paced'),
      ('Advanced Reporting with Power BI', 'Create custom reports and dashboards using Power BI', 'Analytics', 'Robert Martinez', 8.00, 20, 15, 0, '2025-03-10', '2025-03-11', 'Microsoft Teams', 'Scheduled', 'Virtual'),
      ('Marketing Campaign Management', 'Design, execute, and measure marketing campaigns', 'Marketing', 'Jessica Williams', 4.00, 20, 14, 12, '2025-02-05', '2025-02-05', 'Conference Room B', 'Completed', 'In-Person'),
      ('Project Management Essentials', 'Project planning, tracking, and delivery with Dynamics 365', 'Projects', 'Mike Chen', 8.00, 25, 20, 0, '2025-03-15', '2025-03-16', 'Training Lab', 'Scheduled', 'In-Person'),
      ('New Employee Onboarding', 'Complete onboarding program for new hires', 'HR', 'Amanda Taylor', 16.00, 10, 5, 3, '2025-02-01', '2025-02-14', 'HR Office', 'In Progress', 'Blended'),
      ('API Integration Workshop', 'REST API integration and development best practices', 'Technical', 'James Jackson', 8.00, 15, 12, 0, '2025-03-20', '2025-03-21', 'Dev Lab', 'Scheduled', 'In-Person'),
      ('Financial Management Overview', 'Finance module walkthrough including invoicing and reporting', 'Finance', 'Robert Martinez', 4.00, 20, 18, 16, '2025-01-25', '2025-01-25', 'Microsoft Teams', 'Completed', 'Virtual'),
      ('Leadership Development Program', 'Management skills and leadership development', 'Leadership', 'CEO', 24.00, 15, 10, 0, '2025-02-15', '2025-05-15', 'Executive Suite', 'In Progress', 'Blended'),
      ('HIPAA Compliance Training', 'Healthcare compliance and data privacy requirements', 'Compliance', 'Patricia Clark', 3.00, 50, 30, 28, '2025-02-01', '2025-02-01', 'Online Portal', 'Completed', 'Self-Paced'),
      ('Sales Negotiation Masterclass', 'Advanced negotiation techniques for enterprise deals', 'Sales', 'Sarah Johnson', 6.00, 15, 15, 0, '2025-03-05', '2025-03-05', 'Conference Room A', 'Scheduled', 'In-Person'),
      ('Data Privacy & GDPR', 'Data protection regulations and compliance procedures', 'Compliance', 'Daniel Brown', 2.00, 100, 82, 80, '2025-01-15', '2025-03-31', 'Online Portal', 'In Progress', 'Self-Paced')
    `);

    // Seed contracts
    await client.query(`
      INSERT INTO contracts (contract_number, name, account_name, contact_name, type, value, start_date, end_date, renewal_date, status, terms, notes) VALUES
      ('CTR-2025-001', 'Enterprise CRM License', 'TechCorp Industries', 'James Wilson', 'License', 285000.00, '2025-01-01', '2025-12-31', '2025-11-01', 'Active', 'Annual license with 500 users, includes support', 'Auto-renewal with 60-day notice'),
      ('CTR-2025-002', 'Cloud Migration Services', 'GlobalSoft Solutions', 'Emily Rodriguez', 'Service', 500000.00, '2025-01-15', '2025-08-31', NULL, 'Active', 'Phased migration with 4 milestones', 'Phase 1 completed on schedule'),
      ('CTR-2025-003', 'Full Platform Agreement', 'Alpha Ventures', 'Maria Santos', 'Enterprise', 890000.00, '2025-02-01', '2027-01-31', '2026-11-01', 'Active', '3-year enterprise agreement with all modules', 'Fortune 500 customer, premium SLA'),
      ('CTR-2025-004', 'BI Analytics Package', 'Data Dynamics Inc', 'Robert Thompson', 'License', 210000.00, '2025-01-10', '2025-12-31', '2025-10-10', 'Active', 'Power BI Pro + custom dashboards', 'Quarterly business reviews included'),
      ('CTR-2025-005', 'Compliance Solution', 'FinServe Global', 'Michael O''Brien', 'Service', 450000.00, '2025-02-01', '2025-07-31', NULL, 'Active', 'Compliance module implementation and configuration', 'Regulatory deadline Q3 2025'),
      ('CTR-2025-006', 'Healthcare Platform', 'HealthTech Pro', 'Lisa Park', 'License', 320000.00, '2025-03-15', '2026-03-14', '2026-01-15', 'Draft', 'HIPAA-compliant platform with BAA', 'Pending legal review'),
      ('CTR-2025-007', 'Retail Commerce Bundle', 'RetailPlus Corp', 'Andrew Martinez', 'Enterprise', 650000.00, '2025-01-20', '2026-01-19', '2025-11-20', 'Active', 'Commerce + POS + Omnichannel', 'Includes 24/7 premium support'),
      ('CTR-2025-008', 'Education Platform', 'EduLearn Systems', 'Jennifer Taylor', 'License', 76000.00, '2025-01-08', '2025-12-31', '2025-10-08', 'Active', 'Education pricing with 100 users', 'Non-profit discount applied'),
      ('CTR-2025-009', 'Security Operations', 'SecureNet Inc', 'Daniel Brown', 'Service', 380000.00, '2025-02-10', '2025-08-31', NULL, 'Active', 'Zero-trust implementation project', 'Government security clearance required'),
      ('CTR-2025-010', 'Energy Management', 'GreenErgy Corp', 'Amanda White', 'Enterprise', 480000.00, '2025-02-12', '2026-02-11', '2025-12-12', 'Active', 'IoT + energy management platform', 'Smart grid integration included'),
      ('CTR-2025-011', 'Marketing Automation', 'MediaWorks Agency', 'Rachel Green', 'License', 175000.00, '2025-02-14', '2026-02-13', '2025-12-14', 'Active', 'Marketing module with campaign automation', 'Includes 50K email credits/month'),
      ('CTR-2025-012', 'Fleet Management', 'LogisticsPro Inc', 'Thomas Anderson', 'Service', 420000.00, '2025-02-15', '2025-09-30', NULL, 'Active', 'End-to-end fleet management implementation', 'GPS integration required'),
      ('CTR-2025-013', 'Defense Systems', 'AeroTech Solutions', 'Christopher Lee', 'Enterprise', 1500000.00, '2025-03-01', '2028-02-28', '2027-12-01', 'Draft', '3-year defense contract with FedRAMP compliance', 'Pending security clearance'),
      ('CTR-2025-014', 'Infrastructure Services', 'CloudNine Labs', 'Sarah Chen', 'Service', 350000.00, '2025-01-20', '2025-06-30', NULL, 'Active', 'Cloud infrastructure setup and migration', 'Includes 6 months managed services'),
      ('CTR-2025-015', 'Partner Agreement', 'NexGen Systems', 'David Kim', 'Partner', 180000.00, '2025-02-18', '2026-02-17', '2025-12-18', 'Active', 'Solution partner agreement with co-sell rights', 'Joint marketing fund of $25K')
    `);

    // Seed forecasts
    await client.query(`
      INSERT INTO forecasts (name, period, owner, target_amount, best_case, committed, pipeline, closed, status, notes) VALUES
      ('Q1 2025 - Sarah Johnson', 'Q1 2025', 'Sarah Johnson', 2500000.00, 3200000.00, 1850000.00, 2800000.00, 1450000.00, 'Open', 'Strong pipeline, expecting to exceed target'),
      ('Q1 2025 - Lisa Thomas', 'Q1 2025', 'Lisa Thomas', 1800000.00, 2100000.00, 1200000.00, 1900000.00, 890000.00, 'Open', 'On track with Enterprise accounts'),
      ('Q1 2025 - Michelle Walker', 'Q1 2025', 'Michelle Walker', 800000.00, 1100000.00, 450000.00, 950000.00, 310000.00, 'Open', 'SDR pipeline growing well'),
      ('Q2 2025 - Sarah Johnson', 'Q2 2025', 'Sarah Johnson', 2800000.00, 3500000.00, 800000.00, 2200000.00, 0.00, 'Open', 'Early stage, building Q2 pipeline'),
      ('Q2 2025 - Lisa Thomas', 'Q2 2025', 'Lisa Thomas', 2000000.00, 2400000.00, 600000.00, 1500000.00, 0.00, 'Open', 'Several large renewals expected'),
      ('Q2 2025 - Michelle Walker', 'Q2 2025', 'Michelle Walker', 900000.00, 1200000.00, 200000.00, 800000.00, 0.00, 'Open', 'Ramping up Q2 outreach'),
      ('FY2025 - Sales Team', 'FY 2025', 'Sarah Johnson', 20000000.00, 24000000.00, 8500000.00, 18000000.00, 5100000.00, 'Open', 'Annual forecast - 25% growth target'),
      ('FY2025 - Enterprise', 'FY 2025', 'Sarah Johnson', 14000000.00, 17000000.00, 6000000.00, 12000000.00, 3800000.00, 'Open', 'Enterprise segment forecast'),
      ('FY2025 - Mid-Market', 'FY 2025', 'Lisa Thomas', 4000000.00, 5000000.00, 1800000.00, 4000000.00, 1000000.00, 'Open', 'Mid-market growth segment'),
      ('FY2025 - SMB', 'FY 2025', 'Michelle Walker', 2000000.00, 2500000.00, 700000.00, 2000000.00, 300000.00, 'Open', 'SMB digital-first approach'),
      ('Q1 2025 - West Coast', 'Q1 2025', 'Sarah Johnson', 1500000.00, 1900000.00, 1100000.00, 1600000.00, 850000.00, 'Open', 'West coast territory forecast'),
      ('Q1 2025 - East Coast', 'Q1 2025', 'Lisa Thomas', 1800000.00, 2200000.00, 1300000.00, 2000000.00, 900000.00, 'Open', 'East coast territory forecast'),
      ('Q1 2025 - Central', 'Q1 2025', 'Michelle Walker', 800000.00, 1000000.00, 450000.00, 850000.00, 300000.00, 'Open', 'Central region forecast'),
      ('Q1 2025 - Partner Channel', 'Q1 2025', 'Sarah Johnson', 500000.00, 700000.00, 250000.00, 500000.00, 150000.00, 'Open', 'Partner-sourced pipeline forecast'),
      ('H1 2025 - Total Revenue', 'H1 2025', 'CEO', 10000000.00, 12500000.00, 5500000.00, 9000000.00, 2650000.00, 'Open', 'First half 2025 total company forecast')
    `);

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with all data!');
    console.log('   - 3 users (admin@dynamics365.com / password123)');
    console.log('   - 15 contacts, 15 accounts, 15 leads');
    console.log('   - 15 opportunities, 15 cases, 15 knowledge articles');
    console.log('   - 15 campaigns, 15 products, 15 invoices');
    console.log('   - 15 quotes, 15 orders, 15 employees');
    console.log('   - 15 projects, 15 tasks, 15 activities');
    console.log('   - 15 territories, 15 competitors, 15 goals');
    console.log('   - 15 departments, 15 performance reviews, 15 leave requests');
    console.log('   - 15 work orders, 15 SLA policies, 15 email templates');
    console.log('   - 15 expense reports, 15 payments, 15 vendors');
    console.log('   - 15 price lists, 15 discounts, 15 audit logs');
    console.log('   - 15 notifications, 15 customer segments, 15 training courses');
    console.log('   - 15 contracts, 15 forecasts');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
