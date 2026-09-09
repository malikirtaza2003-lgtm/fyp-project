import Announcement from '../models/announcement.model.js';

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetRoles, priority } = req.body;
    const announcement = new Announcement({
      title,
      message,
      priority: priority || 'Medium',
      targetRoles: targetRoles || ['teamlead', 'employee'],
      createdBy: req.user.id,
    });
    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? {} 
      : { targetRoles: req.user.role };

    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsViewed = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    const userId = String(req.user.id || req.user._id);
    if (!announcement.viewedBy.some(id => String(id) === userId)) {
      announcement.viewedBy.push(req.user._id);
      await announcement.save();
    }
    
    res.json(announcement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
