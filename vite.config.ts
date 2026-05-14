import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodemailer from 'nodemailer'

const otpStore = new Map();

function otpPlugin() {
  return {
    name: 'otp-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/send-otp', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();
        
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', async () => {
          try {
            const { email } = JSON.parse(body);
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(email, otp);
            
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'agradutkolkata@gmail.com',
                pass: 'hgbidjjuqialmukv'
              }
            });
            
            await transporter.sendMail({
              from: '"Agradut Foundation" <agradutkolkata@gmail.com>',
              to: email,
              subject: 'Your Admin Verification OTP',
              text: `Your 6-digit verification code is: ${otp}`,
              html: `<div style="font-family: sans-serif; padding: 20px;">
                       <h2 style="color: #FF9933;">Agradut Foundation</h2>
                       <p>Your secure 6-digit verification code is:</p>
                       <h1 style="letter-spacing: 5px; color: #138808;">${otp}</h1>
                       <p>Do not share this code with anyone.</p>
                     </div>`
            });
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (error: any) {
            console.error('SMTP Error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });

      server.middlewares.use('/api/verify-otp', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();
        
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          const { email, otp } = JSON.parse(body);
          const storedOtp = otpStore.get(email);
          
          res.setHeader('Content-Type', 'application/json');
          if (storedOtp && storedOtp === otp) {
            otpStore.delete(email); // consume
            res.end(JSON.stringify({ success: true }));
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid or expired OTP' }));
          }
        });
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), otpPlugin()],
})
