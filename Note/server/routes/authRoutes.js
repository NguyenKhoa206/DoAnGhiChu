const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const notebookMiddleware = require('../middleware/notebookMiddleware');
const { serializedPasswordHandler } = require('../utils/privateAttempts');

router.use(notebookMiddleware);
router.get('/private-status', authController.checkPrivatePasswordStatus);
router.post('/setup-private-password', serializedPasswordHandler(authController.setupPrivatePassword));
router.post('/verify-private-password', serializedPasswordHandler(authController.verifyPrivatePassword));
router.put('/change-private-password', serializedPasswordHandler(authController.changePrivatePassword));
module.exports = router;
