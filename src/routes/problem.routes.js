import express from 'express';
import { authMiddleware, checkAdmin } from '../middleware/auth.middleware.js';
import { createProblem, deleteProblemById, getAllProblems, getAllProblemsSolvedByUser, getProblemById, updateProblemById } from '../controllers/problem.controller.js';

const problemRoutes = express.Router();

// create a new problem
// get all problems
// get a problem by id
// update a problem by id
// delete a problem by id
// get solved problem  --> currently logged in user's solved problems


problemRoutes.post('/create-problem', authMiddleware, checkAdmin, createProblem);

problemRoutes.get('/get-all-problems', authMiddleware, getAllProblems);

problemRoutes.get('/get-problem/:id', authMiddleware, getProblemById);

problemRoutes.put('/update-problem/:id', authMiddleware, checkAdmin, updateProblemById);

problemRoutes.delete('/delete-problem/:id', authMiddleware, checkAdmin, deleteProblemById);

problemRoutes.get('/get-solved-problems', authMiddleware, getAllProblemsSolvedByUser);



export default problemRoutes;