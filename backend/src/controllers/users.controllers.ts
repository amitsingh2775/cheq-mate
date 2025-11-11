// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import User from '../models/user.model.js';
import { sendEmail } from '../services/email.services.js';
import redisClient from '../config/redisClient.js';
import { generateRandomUsername } from '../utils/generateUsername.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const OTP_TTL_SECONDS = 10 * 60; 


export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("email and password-> ",email,password)

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required.' });
    }

    // If a fully registered user exists, block immediately
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("existing user-> ",existing)
      return res.status(400).json({ error: 'Email already in use.' });
    }


    // Generate username and hash password immediately (do not store plain password in Redis)
    const username = generateRandomUsername();
    console.log("username - > ",username)
    const hashedPassword = await bcrypt.hash(password, 10);


    // Generate 6-digit numeric OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });
    console.log("hased password -> ",hashedPassword)

    // Payload saved in redis
    const payload = {
      email,
      username,
      password: hashedPassword, 
      otp,
    };
    console.log("payload is ",payload)

    // Save in redis with TTL
    const key = `otp:${email}`;
    await redisClient.setEx(key, OTP_TTL_SECONDS, JSON.stringify(payload));

    // Send OTP email
    try {
      await sendEmail(email, 'Verify your EchoBox account', `Your OTP is ${otp}. It is valid for 10 minutes.`);
    } catch (emailErr) {
      // optional: delete key if email fails (safer) — here we rollback to avoid stale redis entries
      console.error('Failed to send OTP email:', emailErr);
      await redisClient.del(key);
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again later.' });
    }

    return res.status(201).json({
      message: 'OTP sent to email. Please verify to complete registration.',
      email,
      username,
    });
  } catch (error: any) {
    console.error('Signup Error:', error);
    return res.status(500).json({ error: 'Server error during signup.' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Please provide both email and OTP.' });
    }

    const key = `otp:${email}`;
    const data = await redisClient.get(key);

    if (!data) {
      return res.status(400).json({ error: 'OTP expired or invalid.' });
    }

    let parsed: { email: string; username: string; password: string; otp: string };
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      // malformed data — cleanup and ask to re-register
      await redisClient.del(key);
      return res.status(400).json({ error: 'Invalid OTP data. Please sign up again.' });
    }

    if (String(parsed.otp) !== String(otp)) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Double-check DB — maybe user registered by other flow
    const exists = await User.findOne({ email });
    if (exists) {
      // cleanup redis and inform
      await redisClient.del(key);
      return res.status(400).json({ error: 'User already registered.' });
    }
    const seed = Math.random().toString(36).substring(2) + Date.now().toString();
    const avatarUrl = `https://api.dicebear.com/7.x/micah/png?seed=${encodeURIComponent(seed)}`;

    // Create user in DB (we stored hashed password already)
    const user = new User({
      email: parsed.email,
      username: parsed.username,
      password: parsed.password, 
      isVerified: true,
      profilePhotoUrl:avatarUrl
    });

    await user.save();

    // Delete redis key now that user is stored
    await redisClient.del(key);

    // Create JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(200).json({
      message: 'OTP verified. Account created.',
      token,
      user: {
        uid: user.uid,
        username: user.username,
        email: user.email,
        profilePhotoUrl: user.profilePhotoUrl,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ error: 'Server error during OTP verification.' });
  }
};


export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password!);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ error: 'Please verify your email first. An OTP was sent to you on signup.' });
    }

    // Create JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      token,
      user: {
        uid: user.uid,
        username: user.username,
        email: user.email,
        profilePhotoUrl: user.profilePhotoUrl,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

export const getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      uid: user.uid,
      username: user.username,
      email: user.email,
      profilePhotoUrl: user.profilePhotoUrl,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ error: 'Server error getting profile.' });
  }
};



/// resend otp

  export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please provide email.' });
    }

    const key = `otp:${email}`;
    const data = await redisClient.get(key);

    if (!data) {
      return res.status(400).json({ error: 'OTP expired or invalid. Please sign up again.' });
    }

    let parsed: { email: string; username: string; password: string; otp: string; [k: string]: any };
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      //cleanup and ask to re-register
      await redisClient.del(key);
      return res.status(400).json({ error: 'Invalid OTP data. Please sign up again.' });
    }

   
    

    // Generate new OTP
    const newOtp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });

    // Try sending email FIRST. If email fails, don't overwrite existing OTP.
    try {
      await sendEmail(email, 'Verify your EchoBox account', `Your OTP is ${newOtp}. It is valid for 10 minutes.`);
    } catch (emailErr) {
      console.error('Failed to send OTP email (resend):', emailErr);
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again later.' });
    }

   
    parsed.otp = newOtp;
    // preserve remaining TTL if you want:
    let ttl = await redisClient.ttl(key);
    if (!ttl || ttl <= 0) ttl = OTP_TTL_SECONDS;

    await redisClient.setEx(key, ttl, JSON.stringify(parsed));

    return res.status(200).json({ message: 'OTP resent to email.', email });
  } catch (error: any) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({ error: 'Server error during OTP resend.' });
  }
};
