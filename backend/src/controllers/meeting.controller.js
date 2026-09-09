import Meeting from '../models/meeting.model.js';
import { HttpError } from '../utils/http-error.js';
import { readString } from '../utils/resource-utils.js';
import { getIo } from '../socket.js';

export async function listMeetings(req, res, next) {
  try {
    const query = {
      $or: [
        { host: req.user._id },
        { participantIds: req.user._id }
      ]
    };

    const meetings = await Meeting.find(query)
      .populate('host', 'name')
      .sort({ date: 1, time: 1 });

    res.json({
      meetings: meetings.map((meeting) => meeting.toJSON()),
    });
  } catch (error) {
    next(error);
  }
}

export async function createMeeting(req, res, next) {
  try {
    const body = req.body ?? {};
    const title = readString(body.title);
    const date = readString(body.date);
    const time = readString(body.time);

    if (!title || !date || !time) {
      throw new HttpError(400, 'title, date, and time are required');
    }

    const participantList = Array.isArray(body.participantList)
      ? body.participantList.map((entry) => readString(entry)).filter(Boolean)
      : [];

    const participantIds = Array.isArray(body.participantIds)
      ? body.participantIds.filter(Boolean)
      : [];

    const meeting = await Meeting.create({
      title,
      host: req.user._id,
      date,
      time,
      duration: readString(body.duration) || '30 min',
      participantList,
      participantIds,
      notes: readString(body.notes),
      recording: Boolean(body.recording),
      status: readString(body.status) === 'past' ? 'past' : 'upcoming',
      summary: readString(body.summary),
      transcript: readString(body.transcript),
      type: body.type === 'audio' ? 'audio' : 'video',
    });

    const populated = await Meeting.findById(meeting._id).populate('host', 'name');
    const json = populated.toJSON();

    try {
      const io = getIo();
      // Notify each participant individually
      participantIds.forEach(userId => {
        io.to(userId.toString()).emit('receive_notification', {
          title: 'New Meeting Scheduled',
          message: `You are invited to: ${json.title} on ${json.date} at ${json.time}.`,
          type: 'meeting',
          meetingId: json.id,
          meetingType: json.type
        });
      });
    } catch (err) {
      console.error('Socket error:', err);
    }

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting: json,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMeeting(req, res, next) {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId).populate('host', 'name');
    if (!meeting) {
      throw new HttpError(404, 'Meeting not found');
    }

    const body = req.body ?? {};
    if (body.title !== undefined) meeting.title = readString(body.title) || meeting.title;
    if (body.date !== undefined) meeting.date = readString(body.date) || meeting.date;
    if (body.time !== undefined) meeting.time = readString(body.time) || meeting.time;
    if (body.duration !== undefined) meeting.duration = readString(body.duration) || meeting.duration;
    if (body.notes !== undefined) meeting.notes = readString(body.notes);
    if (body.recording !== undefined) meeting.recording = Boolean(body.recording);
    if (body.status !== undefined) {
      const nextStatus = readString(body.status);
      if (nextStatus === 'upcoming' || nextStatus === 'past') {
        meeting.status = nextStatus;
      }
    }
    if (body.summary !== undefined) meeting.summary = readString(body.summary);
    if (body.transcript !== undefined) meeting.transcript = readString(body.transcript);

    if (Array.isArray(body.participantList)) {
      meeting.participantList = body.participantList.map((entry) => readString(entry)).filter(Boolean);
    }
    if (Array.isArray(body.participantIds)) {
      meeting.participantIds = body.participantIds.filter(Boolean);
    }

    await meeting.save();
    const populated = await Meeting.findById(meeting._id).populate('host', 'name');

    res.json({
      message: 'Meeting updated successfully',
      meeting: populated.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}
