#!/bin/bash

# Mudy OS - Deployment Script
# This script helps you push to GitHub and provides deployment instructions

echo "=================================================="
echo "Mudy OS - Deployment to GitHub + Vercel"
echo "=================================================="
echo ""

# Step 1: Create GitHub Repository
echo "Step 1: Create GitHub Repository"
echo "--------------------------------"
echo "Go to: https://github.com/new"
echo ""
echo "Repository settings:"
echo "  - Name: mudy-os"
echo "  - Description: Multi-Tenant AI Workforce Platform"
echo "  - Privacy: Choose Public or Private"
echo "  - DO NOT initialize with README, .gitignore, or license"
echo ""
echo "Press Enter once you've created the repository..."
read

# Step 2: Get your GitHub username
echo ""
echo "Step 2: Enter your GitHub username"
echo "-----------------------------------"
read -p "GitHub username: " GITHUB_USERNAME

# Step 3: Push to GitHub
echo ""
echo "Step 3: Pushing to GitHub..."
echo "----------------------------"

REPO_URL="https://github.com/$GITHUB_USERNAME/mudy-os.git"

git remote add origin "$REPO_URL"
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Push failed. You may need to authenticate."
    echo ""
    echo "Try running these commands manually:"
    echo "  git remote add origin $REPO_URL"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    exit 1
fi

# Step 4: Deploy to Vercel
echo ""
echo "=================================================="
echo "Step 4: Deploy to Vercel"
echo "=================================================="
echo ""
echo "1. Go to: https://vercel.com/new"
echo "2. Click 'Import Git Repository'"
echo "3. Select your GitHub account and find: $GITHUB_USERNAME/mudy-os"
echo "4. Click 'Import'"
echo ""
echo "5. Configure Environment Variables (REQUIRED):"
echo ""
cat << 'EOF'
DATABASE_URL = (Get from Neon.tech - see DEPLOYMENT.md)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = (Get from Clerk.com)
CLERK_SECRET_KEY = (Get from Clerk.com)
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /onboarding
OPENROUTER_API_KEY = (Get from OpenRouter.ai)
OPENAI_API_KEY = (Optional - OpenAI API key)
STRIPE_API_KEY = (Get from Stripe.com)
STRIPE_WEBHOOK_SECRET = (Get after setting up Stripe webhook)
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
EOF
echo ""
echo "6. Click 'Deploy' and wait 2-3 minutes"
echo ""
echo "=================================================="
echo "Step 5: Configure Services"
echo "=================================================="
echo ""
echo "Follow the detailed guide in DEPLOYMENT.md for:"
echo "  - Neon (PostgreSQL database)"
echo "  - Clerk (Authentication)"
echo "  - OpenRouter (AI models)"
echo "  - Stripe (Payments + webhook)"
echo ""
echo "Repository URL: $REPO_URL"
echo ""
echo "✅ Script complete! Check DEPLOYMENT.md for detailed service setup."
