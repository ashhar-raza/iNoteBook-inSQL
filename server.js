const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const Response = require('./src/Domain/Response');
const userRoutes = require('./src/Routes/users'); // Ensure you are importing the correct file and routes
const notesRoutes = require('./src/Routes/notes');
dotenv.config();

app.use(express.json());
app.use(cors({ origin: '*' }));

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) =>
    res.send(new Response(200, "OK", "We Are Up Bro 😉😉😉😉"))
);

// Use your routes
app.use('/api/users', userRoutes);  // You might want to prefix all your routes with '/api'
app.use('/api/notes', notesRoutes);  // You might want to prefix all your routes with '/api'

const server = app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});

// Handling uncaught exceptions
process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION! Shutting down service!");
    console.log(err.name, err.message);
    process.close(() => {
        process.exit(1);
    });
});

// Handling unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! Shutting down service!");
    console.log(err.name, err.message);

    server.close(() => {
        process.exit(1);
    });
});
