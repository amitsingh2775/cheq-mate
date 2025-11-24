
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import User from '../models/user.model.js';
import { sendEmail } from '../services/email.services.js';
import redisClient from '../config/redisClient.js';
import { generateRandomUsername } from '../utils/generateUsername.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';


const JWT_SECRET = process.env.JWT_SECRET || "" 
const OTP_TTL_SECONDS = 10 * 60; 


export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required.' });
    }

    // If a fully registered user exists, block immediately
    const existing = await User.findOne({ email });
    if (existing) {
    
      return res.status(400).json({ error: 'Email already in use.' });
    }


    // Generate username and hash password immediately (do not store plain password in Redis)
    const username = generateRandomUsername();
 
    const hashedPassword = await bcrypt.hash(password, 10);


    // Generate 6-digit numeric OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });
  


    const payload = {
      email,
      username,
      password: hashedPassword, 
      otp,
    };
   

    // Save in redis with TTL
    const key = `otp:${email}`;
    await redisClient.setEx(key, OTP_TTL_SECONDS, JSON.stringify(payload));

     res.status(201).json({
      message: 'OTP sent on your email sortly. Please verify to complete registration.',
      email,
      username,
    });
    // Send OTP email
    try {
      await sendEmail(email, 'Verify your Cheq-mate account', `Your OTP is ${otp}. It is valid for 10 minutes.`);
    } catch (emailErr) {
     
      await redisClient.del(key);
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again later.' });
    }

    
  } catch (error: any) {
   
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
      await sendEmail(email, 'Verify your Cheq-mate account', `Your OTP is ${newOtp}. It is valid for 10 minutes.`);
    } catch (emailErr) {
    
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again later.' });
    }

   
    parsed.otp = newOtp;
    // preserve remaining TTL if you want:
    let ttl = await redisClient.ttl(key);
    if (!ttl || ttl <= 0) ttl = OTP_TTL_SECONDS;

    await redisClient.setEx(key, ttl, JSON.stringify(parsed));

    return res.status(200).json({ message: 'OTP resent to email.', email });
  } catch (error: any) {
    
    return res.status(500).json({ error: 'Server error during OTP resend.' });
  }
};


// forget or reset password started from here

export const requestResetPassword=async(req:Request,res:Response)=>{
  
  const {email}=req.body
  if( !email ){
     return res.status(400).json({error:"please provide email"})
  }

 try {
   // find user from db
   const user=await User.findOne({email})
 
   if(!user) return res.status(404).json({error:"Account doesn't exist"})
   
 
   const key=`passreset:${email}`;
    const otp = otpGenerator.generate(6, {
       upperCaseAlphabets: false,
       specialChars: false,
       lowerCaseAlphabets: false,
       digits: true,
     });
 
     // create the payload to store in redis
     const payload={
       email,
       otp,
       createdAt:Date.now(),
     }
 
     // send email to user
     try {
        await sendEmail(email,'password reset on your account',`your reset password otp is ${otp}.It is valid for ${Math.floor(OTP_TTL_SECONDS / 60)} minutes`)
     } catch (error) {
        return res.status(500).json({error:"email sending failed"})
     }
 
     // save payload in redis
     await redisClient.setEx(key,OTP_TTL_SECONDS,JSON.stringify(payload))
 
     return res.status(200).json({message:"otp sended succesfully",email})
 } catch (error) {
    return res.status(500).json({error:"request failed"})
 }

}

// verify reset otp

export const verifyResetOtp=async(req:Request,res:Response)=>{
    
  try {
     const {email,otp}=req.body
     if(!email || !otp) return res.status(400).json({error:"email and otp is required"});

     // key
     const key=`passreset:${email}`;
     const data=await redisClient.get(key);
     if(!data){
       return res.status(400).json({error:"otp expired or invaild , make a new otp request"})

     }
     let parsed: { email: string; otp: string; createdAt?: number; [k: string]: any };
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      await redisClient.del(key);
      return res.status(400).json({ error: 'Invalid OTP data. Please request a new OTP.' });
    }

    if (String(parsed.otp) !== String(otp)) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }
    return res.status(200).json({message:"otp verified process to new reset password",verified:true})
  } catch (error) {
     return res.status(500).json({error:"request faild to verify otp"})
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ error: 'Please provide email, newPassword and confirmPassword.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    // Cleanup Redis (optional)
    await redisClient.del(`pwdreset:${email}`);

    return res
      .status(200)
      .json({ message: 'Password changed successfully.', verified: true });
  } catch (error: any) {
  
    return res.status(500).json({ error: 'Server error resetting password.' });
  }
};
