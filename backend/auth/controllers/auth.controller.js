import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

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
      role: role || 'buyer' // falls z. B. creator ausgewählt wird
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
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


