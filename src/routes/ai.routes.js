import express from 'express'
import isUserSigned from '../middlewares/isuserSigned.middleware.js';
import {aiController, generateresumePdf, getAllInterview, getInterviewById } from '../controllers/ai.controller.js';
import upload from '../middlewares/file.middleware.js'

const router = express.Router();

router.post('/', isUserSigned, upload.single("resume"), aiController);
router.get('/allinterview', isUserSigned, getAllInterview);
router.get('/:interviewId', isUserSigned, getInterviewById);
router.post('/resume/pdf/:interviewId', isUserSigned, generateresumePdf);

export default router