# Server Setup Instructions

To run this application on your server, follow these detailed instructions.

## Prerequisites

1. **Update Node.js version (required)**

   The application requires Node.js 18.17.0 or later. Your server is likely running an older version.

   ```bash
   # Check current version
   node --version
   
   # If using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   nvm install 18.17.0
   nvm use 18.17.0
   
   # Or install Node.js 18.x directly (Debian/Ubuntu)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Verify installation
   node --version  # Should output v18.17.0 or higher
   ```

2. **Install pnpm**

   ```bash
   # Using npm (easiest if Node.js is already updated)
   npm install -g pnpm
   
   # Or using the installer script
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   
   # You may need to reload your shell or source your profile
   source ~/.bashrc  # or ~/.zshrc depending on your shell
   
   # Verify installation
   pnpm --version
   ```

## Project Setup

1. **Clone the repository (if not already done)**

   ```bash
   git clone https://github.com/mitchellmoss/stone-drawing-generator.git
   cd stone-drawing-generator
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Build the application for production**

   ```bash
   pnpm build
   ```

4. **Start the production server**

   ```bash
   pnpm start
   ```

   The application should now be running on port 3000.

## Setting Up as a Service (Optional)

To keep the application running after you log out, set up a systemd service:

1. **Create a service file**

   ```bash
   sudo nano /etc/systemd/system/stone-generator.service
   ```

2. **Add the following configuration (update paths as needed):**

   ```
   [Unit]
   Description=Stone Mockup Generator
   After=network.target
   
   [Service]
   Type=simple
   User=root  # Consider using a non-root user for security
   WorkingDirectory=/root/stone-drawing-generator
   ExecStart=/root/.nvm/versions/node/v18.17.0/bin/node /root/stone-drawing-generator/node_modules/.bin/next start
   Restart=on-failure
   Environment=NODE_ENV=production
   
   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start the service**

   ```bash
   sudo systemctl enable stone-generator
   sudo systemctl start stone-generator
   sudo systemctl status stone-generator  # Check if it's running
   ```

## Troubleshooting

If you encounter issues:

1. **Check Node.js version**
   - Ensure you're using Node.js 18.17.0 or higher

2. **Check for error logs**
   ```bash
   journalctl -u stone-generator.service -f
   ```

3. **Clear pnpm cache if needed**
   ```bash
   pnpm store prune
   ```

4. **Try with a clean install**
   ```bash
   rm -rf node_modules
   pnpm install --force
   ```

5. **Check port availability**
   - Ensure port 3000 isn't being used by another service

## Setting Up with Nginx (Optional)

If you want to serve the application on a domain with HTTPS:

1. **Install Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Create Nginx configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/stone-generator
   ```

3. **Add the following configuration (replace yourdomain.com):**
   ```
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable the site and restart Nginx**
   ```bash
   sudo ln -s /etc/nginx/sites-available/stone-generator /etc/nginx/sites-enabled/
   sudo nginx -t  # Test the configuration
   sudo systemctl restart nginx
   ```

5. **Set up SSL with Certbot (optional but recommended)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```