import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity request body is required'), { status: 400 });
  }
  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (!userId || !teamId || !type || typeof minutes !== 'number') {
    throw Object.assign(new Error('Missing required fields: userId, teamId, type, minutes'), { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(userId as string)) {
    throw Object.assign(new Error('Invalid userId format'), { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(teamId as string)) {
    throw Object.assign(new Error('Invalid teamId format'), { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 400 });
  }
  const team = await Team.findById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 400 });
  }

  const points = typeof minutes === 'number' ? Math.round(minutes) : 0;
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team request body is required'), { status: 400 });
  }
  const { name, mascot, members } = input as Record<string, unknown>;

  if (!name) {
    throw Object.assign(new Error('Missing required field: name'), { status: 400 });
  }

  const team = await Team.create({
    name,
    mascot: mascot || '',
    members: Array.isArray(members) ? members : [],
  });
  return team.toObject();
}

export async function listTeams() {
  const teams = await Team.find().populate('members', '_id').lean();
  return teams.map(team => ({
    ...team,
    members: team.members.map((member: any) => member._id),
  }));
}

export async function getLeaderboard() {
  const teamStats = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $sort: { totalPoints: -1 },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamData',
      },
    },
    {
      $unwind: '$teamData',
    },
    {
      $project: {
        _id: 0,
        teamName: '$teamData.name',
        totalPoints: 1,
      },
    },
  ]);

  return teamStats.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  if (!userEmail) {
    throw Object.assign(new Error('User email is required'), { status: 400 });
  }

  const decodedEmail = decodeURIComponent(userEmail);
  const user = await User.findOne({ email: decodedEmail });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  
  if (recentActivities.length === 0) {
    return Workout.find().lean();
  }

  const activityTypes = recentActivities.map(a => a.type);
  const mostFrequentType = activityTypes[0];
  
  const matchingWorkout = await Workout.findOne({
    $or: [
      { focus: user.fitnessGoal },
      { focus: mostFrequentType },
    ],
  }).lean();

  if (!matchingWorkout) {
    return Workout.find().lean();
  }

  const reason = user.fitnessGoal === matchingWorkout.focus 
    ? `Matches your ${user.fitnessGoal} goal`
    : `Matches your recent ${mostFrequentType} activity`;

  return [{
    ...matchingWorkout,
    reason,
  }];
}

export { User };
