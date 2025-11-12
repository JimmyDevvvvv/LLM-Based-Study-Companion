# Netlify Deployment Guide

This guide will walk you through deploying your full-stack application to Netlify.

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://www.netlify.com/))
2. Node.js and npm installed
3. Python 3.9+ installed
4. Git installed

## Deployment Steps

### 1. Prepare Your Repository

Make sure all your changes are committed to your Git repository:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
```

### 2. Push to GitHub

1. Create a new repository on GitHub if you haven't already
2. Follow the instructions to push your existing repository:

```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### 3. Deploy to Netlify

1. Log in to your Netlify account
2. Click on "Add new site" > "Import an existing project"
3. Connect to your GitHub repository
4. Configure the build settings:
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/.next`
   - **Python version:** 3.9
   - **Node.js version:** 18

5. Set up environment variables in Netlify:
   - Go to Site settings > Build & deploy > Environment
   - Add all the environment variables from your `.env` files

### 4. Configure Netlify Functions

1. In your Netlify dashboard, go to Site settings > Functions
2. Set the "Functions directory" to `netlify/functions`
3. Set the "Install command" to `cd netlify/functions && pip install -r requirements.txt -t .`

### 5. Deploy Your Site

1. Click on "Deploy site" in the Netlify dashboard
2. Wait for the build and deploy process to complete
3. Once deployed, your site will be available at `https://your-site-name.netlify.app`

## Post-Deployment

1. Test all API endpoints to ensure they're working correctly
2. Set up a custom domain if needed
3. Configure environment variables for production
4. Set up automatic deployments from your main branch

## Troubleshooting

- If you encounter build errors, check the build logs in the Netlify dashboard
- Make sure all environment variables are properly set in Netlify
- Ensure your Python version is set to 3.9 in the build settings
- Check the Netlify function logs for any API-related issues

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
