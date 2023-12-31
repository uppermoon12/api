import express from "express";
import {deleteUser, login, register,verify} from "../controller/auth/api.js";
import { checked, clearCheck, create, deleteNote, getNote, updateNote } from "../controller/notes/api.js";

const router = express.Router();

// check api connected!
router.get('/',async(req,res)=>{
    res.status(202).json({
        status: 'success',
        message: 'API Connected!'
    })
})

// get
router.get('/verify',verify)
router.get('/getNote',getNote)


// post
router.post('/login',login)
router.post('/register',register)
router.post('/createNote',create)

// update
router.put('/updateNote',updateNote)
router.put('/updateNoteChecked',checked)
router.put('/updateNoteUnchecked',clearCheck)

// delete
router.delete('/deleteNote',deleteNote)
router.delete('/removeAccount',deleteUser)
export default router