import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';


export interface AuthenticatedRequest extends Request {
  user?: { id: string }; 
}

export const checkAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      
    
      const user = await User.findById(decoded.id);

      if (!user) {
          return res.status(401).json({ error: 'Not authorized, user not found' });
      }

    
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};