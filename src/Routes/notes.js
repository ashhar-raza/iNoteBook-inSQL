const { verifyUser } = require('../Middleware/jwtToken');
const db = require('../Database/db');
const Response = require('../Domain/Response');
const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const toLowerCaseKeys = (obj) => {
    const newObj = {};
    Object.keys(obj).forEach(key => {
        newObj[key.toLowerCase()] = obj[key];
    });
    return newObj;
};


router.get('/get', verifyUser,
    async (req, res) => {
        try {
            const id = req.user.id;
            const Data = await db('SELECT * FROM NOTES WHERE USER_ID = ?', [id]);
            return res.status(200).send(new Response(200, "Success", "Get Notes", Data));
        } catch (error) {
            console.error("Error fetching notes:", error);
            res.status(500).send(new Response(500, "INTERNAL_SERVER_ERROR", "FAILED", "Error fetching notes", error.message));
        }
    }
)
router.post('/create', verifyUser,
    body('note').isLength({ min: 1 }),
    async (req, res) => {
        try {
            const id = req.user.id;
            const notes = req.body.note;
            const Data = await db('INSERT INTO NOTES (USER_ID , NOTE) VALUES ( ? , ?)', [id, notes]);
            return res.status(200).send(new Response(200, "Created", "Note Created", { "note_id": Data.insertId }));
        } catch (error) {
            console.error("Error creating notes:", error);
            res.status(500).send(new Response(500, "INTERNAL_SERVER_ERROR", "FAILED", "Error creating notes", error.message));
        }
    }
)
router.put('/update/:id', verifyUser,
    body('note').isLength({ min: 1 }),
    async (req, res) => {
        try {
            const note_id = req.params.id;
            const user_id = req.user.id;
            const new_note = req.body.note;
            let note = await db(`SELECT * FROM NOTES WHERE ID = ?`, [note_id]);
            if (!note || note.length === 0)
                return res.status(400).send(new Response(400, "Failed", "No notes found with associated id"));
            note = toLowerCaseKeys(note[0]);
            if (note.user_id !== user_id) {
                return res.status(401).send(new Response(401, "Unauthorized", "Cannot update notes of other user"));
            }
            const Data = await db('UPDATE NOTES SET NOTE = ? WHERE ID = ?', [new_note, note_id]);
            return res.status(200).send(new Response(200, "Updated", "Note Updated",));
        } catch (error) {
            console.error("Error updating notes:", error);
            res.status(500).send(new Response(500, "INTERNAL_SERVER_ERROR", "FAILED", "Error updating notes", error.message));
        }
    }
)
router.delete('/delete/:id', verifyUser,
    body('note').isLength({ min: 1 }),
    async (req, res) => {
        try {
            const note_id = req.params.id;
            const user_id = req.user.id;

            let notes = await db('SELECT * FROM NOTES WHERE ID = ?', [note_id]);
            if (!notes || notes.length === 0) {
                return res.status(400).send(new Response(400, "Failed", "No notes found with associated id"));
            }
            notes = toLowerCaseKeys(notes[0]);
            if (notes.user_id !== user_id) {
                return res.status(401).send(new Response(401, "Unauthorized", "Cannot delete notes of other user"));
            }
            const Data = await db('DELETE FROM NOTES WHERE ID = ?', [note_id]);
            return res.status(200).send(new Response(200, "Deleted", "Note Deleted"));
        } catch (error) {
            console.error("Error deleting notes:", error);
            res.status(500).send(new Response(500, "INTERNAL_SERVER_ERROR", "FAILED", "Error deleting notes", error.message));
        }
    }
)

module.exports = router;
