import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { changePassword } from "../services/auth.service";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id).populate("favoriteDestinations recentlyViewed");
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  ok(res, { user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  // body is validated with a strict schema, so role/permissions/status can never be set here
  const user = await User.findByIdAndUpdate(req.user!.id, { $set: req.body }, { new: true, runValidators: true });
  ok(res, { user });
});

export const changePasswordHandler = asyncHandler(async (req, res) => {
  await changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  ok(res, { message: "Password changed. Please log in again." });
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const id = req.params.destinationId;
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  const has = user.favoriteDestinations.some((d) => d.toString() === id);
  await User.updateOne({ _id: user._id }, has ? { $pull: { favoriteDestinations: id } } : { $addToSet: { favoriteDestinations: id } });
  ok(res, { favorited: !has });
});

import { Itinerary } from "../models/Itinerary";
export const dashboard = asyncHandler(async (req, res) => {
  const uid = req.user!.id;
  const [user, totalTrips, recent, upcoming] = await Promise.all([
    User.findById(uid).populate("favoriteDestinations").populate("recentlyViewed"),
    Itinerary.countDocuments({ user: uid }),
    Itinerary.find({ user: uid }).sort({ createdAt: -1 }).limit(5),
    Itinerary.find({ user: uid, "travelDates.start": { $gte: new Date() } }).sort({ "travelDates.start": 1 }).limit(5),
  ]);
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  ok(res, { user, totalTrips, recentItineraries: recent, upcomingTrips: upcoming, favoriteDestinations: user.favoriteDestinations, recentlyViewed: [...user.recentlyViewed].reverse() });
});
