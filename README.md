📓 Notebook Backend (SQL)
A RESTful API built with Node.js and Express.js for managing a digital notebook application. This backend uses SQL (MySQL/PostgreSQL/SQLite) for data storage and provides secure user authentication, CRUD operations for notes, and structured API routing.

🔧 Features
User registration & login (with password hashing)

JWT-based authentication & middleware protection

Create, Read, Update, Delete (CRUD) notes

Notes are user-specific and securely stored

SQL-based database integration using [Sequelize / Knex.js / Raw SQL]

Environment variable support for clean configuration

Modular code structure (routes, controllers, middleware)

📁 Tech Stack
Node.js

Express.js

SQL (e.g., MySQL, PostgreSQL, or SQLite)

Sequelize / Knex.js (optional ORM/Query Builder)

JWT for auth

bcrypt for password hashing

dotenv for environment variables

🚀 Getting Started
Clone the repo

Install dependencies: npm install

Configure .env file

Run migrations or set up DB

Start the server: npm run dev

