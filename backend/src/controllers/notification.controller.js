import Task from '../models/task.model.js';
import Leave from '../models/leave.model.js';
import Announcement from '../models/announcement.model.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = [];
    const userId = String(req.user._id);
    const lastCheck = req.user.lastNotificationCheck ? new Date(req.user.lastNotificationCheck) : new Date(0);

    // 1. Get relevant Announcements
    const announcementsQuery = req.user.role === 'admin' 
      ? {} 
      : { targetRoles: req.user.role };
    
    const announcements = await Announcement.find(announcementsQuery).sort({ createdAt: -1 }).limit(10);
    
    announcements.forEach(ann => {
      notifications.push({
        id: ann._id,
        type: 'announcement',
        title: ann.title,
        message: ann.message,
        priority: ann.priority,
        time: ann.createdAt,
        unread: !ann.viewedBy.some(id => String(id) === userId),
        color: ann.priority === 'High' ? 'bg-red-500' : 'bg-blue-500'
      });
    });

    // 2. Role Specific Notifications
    if (req.user.role === 'admin') {
      // Admin: See all task completions
      const completedTasks = await Task.find({ status: 'completed' })
        .populate('assignedTo', 'name')
        .sort({ updatedAt: -1 })
        .limit(5);

      completedTasks.forEach(task => {
        notifications.push({
          id: `task-done-${task._id}`,
          type: 'task_done',
          title: 'Task Completed',
          message: `${task.assignedTo?.name || 'An employee'} completed "${task.title}"`,
          priority: 'Medium',
          time: task.updatedAt,
          unread: task.updatedAt > lastCheck,
          color: 'bg-green-500'
        });
      });

      // Admin: See all pending leaves
      const pendingLeaves = await Leave.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5);

      pendingLeaves.forEach(leave => {
        notifications.push({
          id: `leave-req-${leave._id}`,
          type: 'leave_request',
          title: 'New Leave Request',
          message: `${leave.employee} requested ${leave.leaveType} leave`,
          priority: 'High',
          time: leave.createdAt,
          unread: leave.createdAt > lastCheck,
          color: 'bg-amber-500'
        });
      });
    } else if (req.user.role === 'teamlead') {
      // Team Lead: See their department's completions
      const teamCompletions = await Task.find({ 
        department: req.user.department,
        status: 'completed',
        assignedTo: { $ne: req.user._id }
      })
      .populate('assignedTo', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

      teamCompletions.forEach(task => {
        notifications.push({
          id: `task-done-${task._id}`,
          type: 'task_done',
          title: 'Team Member Finished',
          message: `${task.assignedTo?.name} completed "${task.title}"`,
          priority: 'Medium',
          time: task.updatedAt,
          unread: task.updatedAt > lastCheck,
          color: 'bg-green-500'
        });
      });

      // Team Lead: See their department's leave requests
      const teamLeaves = await Leave.find({ 
        status: 'pending',
        user: { $ne: req.user._id }
      })
      .populate('user', 'department')
      .sort({ createdAt: -1 });
      
      // Filter by department manually if not populated properly or use query
      const filteredLeaves = teamLeaves.filter(l => l.user?.department === req.user.department).slice(0, 5);

      filteredLeaves.forEach(leave => {
        notifications.push({
          id: `leave-req-${leave._id}`,
          type: 'leave_request',
          title: 'Team Leave Request',
          message: `${leave.employee} requested ${leave.leaveType} leave`,
          priority: 'High',
          time: leave.createdAt,
          unread: leave.createdAt > lastCheck,
          color: 'bg-amber-500'
        });
      });
    }

    // Common for TeamLead and Employee: Task Assignments
    const myNewTasks = await Task.find({
      assignedTo: req.user._id,
      createdAt: { $gt: lastCheck }
    })
    .populate('assignedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

    myNewTasks.forEach(task => {
      notifications.push({
        id: `task-new-${task._id}`,
        type: 'task_new',
        title: 'New Task Assigned',
        message: `${task.assignedBy?.name || 'Someone'} assigned "${task.title}" to you`,
        priority: 'High',
        time: task.createdAt,
        unread: true,
        color: 'bg-blue-600'
      });
    });

    // Employee specific: Leave Status Updates
    if (req.user.role === 'employee' || req.user.role === 'teamlead') {
      const myLeaveUpdates = await Leave.find({
        user: req.user._id,
        status: { $ne: 'pending' },
        updatedAt: { $gt: lastCheck }
      })
      .sort({ updatedAt: -1 })
      .limit(5);

      myLeaveUpdates.forEach(leave => {
        notifications.push({
          id: `leave-update-${leave._id}`,
          type: 'leave_update',
          title: `Leave ${leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}`,
          message: `Your ${leave.leaveType} leave request has been ${leave.status}`,
          priority: leave.status === 'rejected' ? 'High' : 'Medium',
          time: leave.updatedAt,
          unread: true,
          color: leave.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
        });
      });
    }

    // Overdue Tasks (Admins and Assigned Users)
    const overdueQuery = req.user.role === 'admin' 
      ? { status: { $ne: 'completed' }, deadline: { $lt: new Date() } }
      : { assignedTo: req.user._id, status: { $ne: 'completed' }, deadline: { $lt: new Date() } };

    const overdueTasks = await Task.find(overdueQuery)
      .populate('assignedTo', 'name')
      .sort({ deadline: 1 })
      .limit(5);

    overdueTasks.forEach(task => {
      notifications.push({
        id: `task-overdue-${task._id}`,
        type: 'task_overdue',
        title: 'Deadline Expired',
        message: `"${task.title}" is overdue`,
        priority: 'High',
        time: task.deadline,
        unread: task.deadline > lastCheck,
        color: 'bg-red-600'
      });
    });

    // Sort all by time
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Update lastNotificationCheck timestamp
    await req.user.constructor.findByIdAndUpdate(userId, {
      $set: { lastNotificationCheck: new Date() }
    });

    // Also mark all targeted announcements as viewed for this user
    const announcementsQuery = req.user.role === 'admin' 
      ? {} 
      : { targetRoles: req.user.role };

    await Announcement.updateMany(
      { 
        ...announcementsQuery,
        viewedBy: { $ne: userId }
      },
      { $push: { viewedBy: userId } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
