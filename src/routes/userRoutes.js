import express from 'express';
import { getUser, listUsers, loginUser, registerUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser)
router.get('/', listUsers);
router.get('/:id', getUser);

export default router;