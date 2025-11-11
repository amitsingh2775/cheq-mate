import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import User from '../models/user.model.js';
import { sendEmail } from '../services/email.services.js';
import { generateRandomUsername } from '../utils/generateUsername.js';
export const signup = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required." });
    }
    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already in use." });
        }
        const username = generateRandomUsername();
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
        });
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        const user = new User({
            email,
            username,
            password: hashedPassword,
            otp,
            otpExpires,
        });
        await user.save();
        await sendEmail(email, "Verify your EchoBox account", `Your OTP is ${otp}.`);
        res.status(201).json({
            message: "User registered. OTP sent.",
            email,
            username,
        });
    }
    catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: "Server error during signup." });
    }
};
export const login = async (req, res) => {
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
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        if (!user.isVerified) {
            // Resend OTP logic could be added here if desired
            return res.status(401).json({ error: 'Please verify your email first. An OTP was sent to you on signup.' });
        }
        // Create JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
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
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
};
export const getMyProfile = async (req, res) => {
    try {
        // req.user.id is attached by the checkAuth middleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({
            uid: user.uid,
            username: user.username,
            email: user.email,
            profilePhotoUrl: user.profilePhotoUrl,
            createdAt: user.createdAt
        });
    }
    catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Server error getting profile.' });
    }
};
