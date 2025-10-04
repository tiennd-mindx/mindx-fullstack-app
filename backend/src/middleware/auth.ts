import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // Get session from HTTP-only cookie
  const sessionToken = req.cookies?.session

  if (!sessionToken) {
    res.status(401).json({
      message: 'Authentication required'
    })
    return
  }

  try {
    const decoded = jwt.verify(sessionToken, process.env.SESSION_SECRET || 'default-secret')
    ;(req as any).user = decoded
    next()
  } catch (error) {
    res.status(403).json({
      message: 'Invalid or expired session'
    })
  }
}
