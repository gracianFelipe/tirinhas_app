-- Tabela master de Usuários (Reúne Funcionários e Clientes)
CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('client', 'employee')),
    name TEXT NOT NULL,
    phone TEXT
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS Product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image TEXT
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS Orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    total_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES User(id)
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS OrderItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES Orders(id),
    FOREIGN KEY(product_id) REFERENCES Product(id)
);

-- Semente de dados iniciais
INSERT OR IGNORE INTO Product (name, description, price, category, image) VALUES 
('Tirinhas Empanadas - 300g', 'Ideal para uma pessoa (+2 Molhos Gourmet Inclusos)', 25.00, 'Tirinha', 'tirinhas_300.png'),
('Tirinhas Empanadas - 500g', 'Perfeito para dividir (+2 Molhos Gourmet Inclusos)', 40.00, 'Tirinha', 'tirinhas_500.png'),
('Tirinhas Empanadas - 700g', 'A porção tamanho Reino (+2 Molhos Gourmet Inclusos)', 55.00, 'Tirinha', 'tirinhas_700.png'),
('Alho e Limão', 'Maionese artesanal, cremosa e cítrica - Alho, sal e limão', 0.00, 'Molho', 'alho_limao.png'),
('Baconese', 'Maionese de textura aveludada a base de bacon', 0.00, 'Molho', 'baconese.png'),
('Defumado', 'Clássica redução defumada na brasa (Smoked Paprika)', 0.00, 'Molho', 'defumado.png'),
('Ervas Finas', 'Mistura harmonizada de sal e ervas finas', 0.00, 'Molho', 'ervas_finas.png'),
('Molho Proteico', 'Creme intenso de alho em base proteica e ervas', 0.00, 'Molho', 'proteico.png');

INSERT OR IGNORE INTO User (login, password, role, name) 
VALUES ('Felipe', '1234?', 'employee', 'Felipe - Chefe Real');
