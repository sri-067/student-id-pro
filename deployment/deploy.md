# 🚀 Free Deployment Guide

## Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

## Backend (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

## Mobile App (Expo)
```bash
# Install Expo CLI
npm install -g @expo/cli

# Publish app
cd mobile-app
expo publish

# Build APK/IPA
expo build:android
expo build:ios
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://your-backend.railway.app
```

### Backend (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/studentid
JWT_SECRET=your-jwt-secret
APP_URL=https://your-frontend.vercel.app
```

### Mobile (.env)
```
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
```

## Free Hosting Limits
- **Vercel**: 100GB bandwidth, custom domains
- **Railway**: 500 hours/month, 1GB RAM
- **MongoDB Atlas**: 512MB storage
- **Expo**: Unlimited publishes, 2GB builds/month