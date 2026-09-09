import ChatMessage from '../models/chat-message.model.js';
import { readString } from '../utils/resource-utils.js';
import { HttpError } from '../utils/http-error.js';
import { getIo } from '../socket.js';

export async function listMessages(req, res, next) {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      throw new HttpError(400, 'chatId is required');
    }

    const messages = await ChatMessage.find({ chatId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
      messages: messages.map(m => m.toJSON()),
    });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { chatId } = req.params;
    const body = req.body ?? {};
    const content = readString(body.content);
    const type = readString(body.type) || 'text';

    if (!chatId) {
      throw new HttpError(400, 'chatId is required');
    }

    const message = await ChatMessage.create({
      chatId,
      sender: req.user._id,
      senderName: req.user.name,
      content,
      type,
      fileUrl: readString(body.fileUrl),
      duration: Number(body.duration) || 0,
      replyTo: body.replyTo,
    });

    const json = message.toJSON();
    try {
      getIo().to(chatId).emit('receive_message', json);
    } catch (err) {
      console.error('Socket error:', err);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: json,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateReaction(req, res, next) {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      throw new HttpError(404, 'Message not found');
    }

    const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
    if (reactionIndex > -1) {
      const userIndex = message.reactions[reactionIndex].users.indexOf(req.user._id);
      if (userIndex > -1) {
        // Remove reaction
        message.reactions[reactionIndex].users.splice(userIndex, 1);
        message.reactions[reactionIndex].count -= 1;
        if (message.reactions[reactionIndex].count === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      } else {
        // Add user to existing reaction
        message.reactions[reactionIndex].users.push(req.user._id);
        message.reactions[reactionIndex].count += 1;
      }
    } else {
      // New reaction
      message.reactions.push({
        emoji,
        count: 1,
        users: [req.user._id],
      });
    }

    await message.save();
    res.json({
      message: 'Reaction updated',
      chatMessage: message.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}
