# Deployment Guide - Bluebook SAT Simulator

## Recommended Hosting: Railway (Most Economical)

### Cost: $5/month for 512MB RAM, 1GB storage

## Step 1: Prepare Your Application

### 1.1 Environment Variables
Create a `.env` file in your root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/bluebook-sat-simulator?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
```

### 1.2 Update CORS Settings
In `server/index.js`, update the CORS origin to your domain:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app-name.railway.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));
```

## Step 2: Set Up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Create a database user
5. Get your connection string
6. Replace `your-username`, `your-password`, and `your-cluster` in the MONGODB_URI

## Step 3: Deploy to Railway

### 3.1 Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### 3.2 Connect Your Repository
1. Click "Deploy from GitHub repo"
2. Select your repository
3. Railway will automatically detect your Node.js app

### 3.3 Configure Environment Variables
In Railway dashboard:
1. Go to Variables tab
2. Add all environment variables from your `.env` file
3. Make sure to set `NODE_ENV=production`

### 3.4 Deploy
1. Railway will automatically build and deploy your app
2. The build process will:
   - Install dependencies
   - Build the React app
   - Start the server

## Step 4: Set Up Custom Domain (Optional)

1. In Railway dashboard, go to Settings
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records as instructed

## Alternative Hosting Options

### 1. Render (Free Tier Available)
- **Cost**: Free tier, then $7/month
- **Pros**: Easy deployment, good free tier
- **Setup**: Similar to Railway

### 2. Vercel + MongoDB Atlas
- **Cost**: Free (Vercel) + $9/month (MongoDB)
- **Pros**: Excellent React support
- **Setup**: Deploy frontend to Vercel, backend to Railway

### 3. Netlify + Railway
- **Cost**: Free (Netlify) + $5/month (Railway)
- **Pros**: Netlify handles frontend, Railway handles backend
- **Setup**: Deploy frontend to Netlify, backend to Railway

## Post-Deployment Checklist

1. ✅ Test all features work correctly
2. ✅ Verify database connection
3. ✅ Test file uploads
4. ✅ Check authentication flows
5. ✅ Test on mobile devices
6. ✅ Set up monitoring (Railway provides basic monitoring)

## Monitoring and Maintenance

### Railway Dashboard
- Monitor app performance
- View logs
- Check resource usage
- Set up alerts

### Database Monitoring
- Use MongoDB Atlas dashboard
- Monitor connection usage
- Set up alerts for high usage

## Cost Optimization Tips

1. **Use Railway's free tier for testing**
2. **Optimize images and assets**
3. **Implement caching strategies**
4. **Monitor resource usage**
5. **Use CDN for static assets**

## Troubleshooting

### Common Issues:
1. **Build fails**: Check Node.js version compatibility
2. **Database connection fails**: Verify MongoDB URI
3. **CORS errors**: Update CORS settings
4. **File uploads fail**: Check file size limits

### Debug Commands:
```bash
# Check logs
railway logs

# Restart app
railway restart

# Check environment variables
railway variables
```

## Security Considerations

1. **Use strong JWT secrets**
2. **Enable HTTPS (Railway provides this)**
3. **Implement rate limiting**
4. **Validate all inputs**
5. **Use environment variables for secrets**

## Performance Optimization

1. **Enable gzip compression**
2. **Use CDN for static assets**
3. **Implement caching headers**
4. **Optimize database queries**
5. **Minimize bundle size**

---

**Total Estimated Cost: $5-10/month** for a production-ready SAT test application.
