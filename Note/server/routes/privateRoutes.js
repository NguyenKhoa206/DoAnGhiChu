const express = require('express');
const notebookMiddleware = require('../middleware/notebookMiddleware');
const privateAuthMiddleware = require('../middleware/privateAuthMiddleware');
const { serializedPasswordHandler } = require('../utils/privateAttempts');
const authController = require('../controllers/authController');
const noteController = require('../controllers/noteController');

const router = express.Router();
router.use(notebookMiddleware);

// Sprint 3 API: the body may use { password } or { privatePassword }.
router.post('/auth', serializedPasswordHandler(authController.verifyPrivatePassword));
router.use(privateAuthMiddleware);
router.get('/notes', noteController.getPrivateNotes);
router.post('/notes', noteController.createPrivateNote);
router.put('/notes/:noteId', noteController.updatePrivateNote);
router.delete('/notes/:noteId', noteController.deletePrivateNote);
router.get('/trash', noteController.getPrivateTrash);
router.post('/trash/:noteId/restore', noteController.restorePrivateTrashNote);
router.delete('/trash/:noteId', noteController.permanentlyDeletePrivateTrashNote);

module.exports = router;
