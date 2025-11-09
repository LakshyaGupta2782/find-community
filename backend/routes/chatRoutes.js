const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const auth = require('../middleware/auth');

router.post("/conversation", auth, chatController.createOrGetConversation);
router.post("/message", auth, chatController.sendMessage);
router.get("/messages/:conversationId", auth, chatController.getMessages);

module.exports = router;