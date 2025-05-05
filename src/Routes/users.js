const db = require('../Database/db');
const express = require('express');
const Response = require('../Domain/Response');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateToken, verifyUser } = require('../Middleware/jwtToken');
const saltRounds = 10;
const { body, validationResult } = require('express-validator');

const toLowerCaseKeys = (obj) => {
    const newObj = {};
    Object.keys(obj).forEach(key => {
        newObj[key.toLowerCase()] = obj[key];
    });
    return newObj;
};


router.get('/get', verifyUser, async (req, res) => {
    try {
        const id = req.user.id;
        const users = await db('SELECT id , first_name , last_name , email ,mobile  FROM USERS WHERE id = ?', [id]);
        res.send(new Response(200, "OK", "success", users));
    } catch (error) {
        console.error("Error fetching users:", error);
        res.send(new Response(500, "INTERNAL_SERVER_ERROR", "FAILED", "Error fetching users"));
    }
});

router.post('/create',
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('email').isEmail().withMessage('Invalid email'),
    body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits'),
    body('first_name').isLength({ min: 1 }).withMessage('First name is required'),
    body('last_name').isLength({ min: 1 }).withMessage('Last name is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(new Response(400, "BAD_REQUEST", "Validation failed", errors.array()));
        }

        try {
            const { email, password, first_name, last_name, mobile } = req.body;

            // Check if the user already exists
            const userExists = await db('SELECT * FROM USERS WHERE email = ?', [email]);
            if (userExists.length > 0) {
                return res.send(new Response(409, "CONFLICT", "User already exists"));
            }

            // Hash the password
            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(password, salt);

            // Insert new user into the database using parameterized queries
            const result = await db('INSERT INTO USERS (EMAIL, FIRST_NAME, LAST_NAME, PASSWORD, MOBILE) VALUES (?, ?, ?, ?, ?)', [email, first_name, last_name, hash, mobile]);

            // Generate a token for the newly created user
            const token = generateToken(result.insertId); // Using the ID of the inserted user
            const responseData = {
                users: {
                    id: result.insertId,
                    email: email,
                    first_name: first_name,
                    last_name: last_name,
                    mobile: mobile
                },
                token: token
            };

            return res.send(new Response(201, "Created", "User Created Successfully", responseData));
        } catch (error) {
            console.log(error);
            return res.send(new Response(500, "INTERNAL_SERVER_ERROR", "Failed to create user", error.message));
        }
    });
router.put('/update',
    verifyUser, // Middleware to verify if the user is authenticated
    body('first_name').isLength({ min: 1 }).withMessage("Name cannot be empty"),
    body('last_name').isLength({ min: 1 }).withMessage("Name cannot be empty"),
    body('mobile').isLength({ min: 10, max: 10 }).withMessage("Mobile should be of 10 digits"),
    body('email').isEmail().withMessage("Invalid Email"),
    async (req, res) => {
        try {
            const { email, first_name, last_name, mobile } = req.body;

            // Query to find the current user by ID
            const findUser = await db('SELECT * FROM USERS WHERE id = ?', [req.user.id]);
            let user = findUser[0];

            // Ensure the user is found
            if (!user) {
                return res.status(404).send(new Response(404, "User Not Found", "User does not exist"));
            }

            // Convert the user's data to lowercase keys (if needed)
            user = toLowerCaseKeys(user);

            // If the user is trying to update to a different email, ensure it's their own
            if (user.email !== email) {
                return res.status(401).send(new Response(401, "Unauthorized", "Not your account"));
            }

            // Use parameterized query for SQL to prevent SQL injection
            const updateQuery = `
                    UPDATE USERS 
                    SET FIRST_NAME = ?, LAST_NAME = ?, MOBILE = ?, EMAIL = ? 
                    WHERE ID = ?`;
            console.log(updateQuery, [first_name, last_name, mobile, email, req.user.id]);
            // Update the user in the database
            const result = await db(updateQuery, [first_name, last_name, mobile, email, req.user.id]);

            // Check if any rows were affected (i.e., check if the update was successful)
            if (result.affectedRows === 0) {
                return res.status(400).send(new Response(400, "Bad Request", "Failed to update user"));
            }

            // Respond with updated user data
            const responseData = {
                id: req.user.id,
                first_name,
                last_name,
                mobile,
                email
            };

            return res.status(200).send(new Response(200, "Success", "User Updated", responseData));

        } catch (error) {
            console.log(error);
            return res.status(500).send(new Response(500, "Internal Server Error", "Failed to update user".error.message));
        }
    });
router.post(`/login`,
    body('email').isEmail().withMessage("Invalid Email"),
    body('password').isLength({ min: 8 }).withMessage("Password should be min of 8"),
    async (req, res) => {
        try {
            const { email, password } = req.body;
            const findUser = await db('SELECT * FROM USERS WHERE EMAIL = ?', [email]);
            if (findUser.length === 0) {
                return res.status(404).send(new Response(404, "Not Found", "User Not Found", { email }));
            }
            let user = findUser[0];  // Get the first user
            user = toLowerCaseKeys(user);
            const verifyPass = bcrypt.compareSync(password, user.password);
            if (!verifyPass) {
                return res.status(401).send(new Response(401, "Unauthorized", "Incorrect Password", { email, password }));
            }
            const token = generateToken(user.id);
            const responseData = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                mobile: user.mobile,
                token: token,
            }
            return res.status(202).send(new Response(202, "Accepted", "Logged In", responseData));
        } catch (error) {
            console.error("Error logging user:", error);
            res.status(500).send(new Response(500, "INTERNAL_SERVER_ERROR", "FAILED", "Error logging user", error.message));
        }


    }
)

router.post('/password', verifyUser,
    body('password').isLength({ min: 8 }).withMessage("Password min length should be 8"),
    body('new_password').isLength({ min: 8 }).withMessage("Too short new password"),
    async (req, res) => {
        try {
            const { password, new_password } = req.body;
            let user = await db(`SELECT * FROM USERS WHERE ID = ?`, [req.user.id]);
            user = toLowerCaseKeys(user[0]);

            const verifyPass = bcrypt.compareSync(password, user.password);
            if (!verifyPass) {
                res.status(401).send(new Response(401, "UnAuthorized", "Failed"));
            }
            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(new_password, salt);

            const newUser = await db(`UPDATE USERS SET PASSWORD = ? WHERE ID = ? `, [hash, req.user.id]);
            return res.status(201).send(new Response(201, "Updated", "Password Changed"));
        } catch (error) {
            console.error("Error logging user:", error);
            res.status(500).send(new Response(500, "INTERNAL_SERVER_ERROR", "FAILED", "Error updating password", error.message));
        }
    }
)

router.delete('/delete/:id', verifyUser, async (req, res) => {
    try {
        const delete_id = req.params.id;
        const id = req.user.id;
        console.log(id, delete_id);
        if (id != delete_id) {
            return res.status(401).send(new Response(401, "Unauthorized", "Cannot delete other user"));
        }
        const response = await db(`DELETE FROM USERS WHERE ID = ?`, [delete_id]);
        return res.status(200).send(200, "Deleted", "User deleted", id);
    } catch (error) {
        console.log(error);
        res.status(500).send(new Response(500, "INTERNAL_SERVER_ERROR", "FAILED", "Error deleting user", error.message));
    }
})


module.exports = router;
