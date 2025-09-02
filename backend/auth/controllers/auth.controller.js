import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { username, email, password, role, profileInfo } = req.body;

    // Check auf vorhandene E-Mail oder Username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // User anlegen
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'buyer', // falls z. B. creator ausgewählt wird
      profileInfo: profileInfo || "Über mich",
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.user.id; // kommt aus verifyToken
    const { username, profileInfo, avatarUrl } = req.body;

    // Nur erlaubte Felder updaten
    const update = {};
    if (typeof username === "string") update.username = username.trim();
    if (typeof profileInfo === "string") update.profileInfo = profileInfo.trim();
    if (typeof avatarUrl === "string") update.avatarUrl = avatarUrl.trim();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    console.error("updateMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // User suchen
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Passwort prüfen
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // JWT erstellen
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // oder '7d' etc.
    );

    // Antwort
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSubscribed: user.isSubscribed
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    console.error('Error in getCurrentUser:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password'); // ohne Passwort zurückgeben

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

export const listUsersAdmin = async (req, res) => {
  try {
    const { q = "", limit = 50, page = 1 } = req.query;
    const query = q
      ? {
          $or: [
            { email: { $regex: q, $options: "i" } },
            { username: { $regex: q, $options: "i" } },
            { role: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      User.find(query)
        .select("_id email username role isSuspended suspensionReason suspensionUntil avatarUrl createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (e) {
    console.error("[auth/admin/users] error:", e.message);
    res.status(500).json({ message: "Failed to list users" });
  }
};

export const suspendUser = async (req, res) => {
  const { id } = req.params;
  const { reason = "", until = null } = req.body || {};
  console.log("[AUTH:suspend] id:", id, "reason:", reason, "until:", until);

  try {
    const doc = await User.findByIdAndUpdate(
      id,
      { $set: { isSuspended: true, suspensionReason: reason, suspensionUntil: until } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "User not found" });
    res.json(doc);
  } catch (e) {
    console.error("[AUTH:suspend] error:", e.message);
    res.status(500).json({ message: "Failed to suspend user" });
  }
};

export const unsuspendUser = async (req, res) => {
  const { id } = req.params;
  console.log("[AUTH:unsuspend] id:", id);

  try {
    const doc = await User.findByIdAndUpdate(
      id,
      { $set: { isSuspended: false }, $unset: { suspensionReason: 1, suspensionUntil: 1 } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "User not found" });
    res.json(doc);
  } catch (e) {
    console.error("[AUTH:unsuspend] error:", e.message);
    res.status(500).json({ message: "Failed to unsuspend user" });
  }
};

export const subscribeUser = async (req, res) => {
  try {
    const { id } = req.params;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 Tage gültig

    const user = await User.findByIdAndUpdate(
      id,
      {
        isSubscribed: true,
        subscriptionExpires: expirationDate,
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      message: 'User subscribed successfully',
      user,
    });
  } catch (err) {
    console.error('Subscribe Error:', err);
    res.status(500).json({ message: 'Failed to subscribe user' });
  }
};

export const renewSubscription = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const currentExp = user.subscriptionExpires ? new Date(user.subscriptionExpires) : now;
    const baseDate = currentExp > now ? currentExp : now;

    // Verlängere um 30 Tage
    baseDate.setDate(baseDate.getDate() + 30);
    user.subscriptionExpires = baseDate;
    user.isSubscribed = true;

    await user.save();
    res.status(200).json({ message: 'Subscription renewed', subscriptionExpires: user.subscriptionExpires });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to renew subscription' });
  }
};


