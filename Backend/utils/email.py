import smtplib
from email.mime.text import MIMEText #used for sending email with text/html content
from email.mime.multipart import MIMEMultipart #used for sending email with multiple parts (text, html, attachments)
from dotenv import load_dotenv
import os #to access environment variables

load_dotenv()

def send_otp_email(email, otp_code):
    """Send OTP to user's email"""
    
    # Email configuration
    sender_email = os.getenv('EMAIL_USER', 'your_email@gmail.com')
    sender_password = os.getenv('EMAIL_PASSWORD', 'your_app_password')
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    
    try:
        # Create message
        message = MIMEMultipart()
        message['From'] = sender_email
        message['To'] = email
        message['Subject'] = 'Better Space - Your OTP Verification Code'
        
        # Email body
        body = f"""
        <html>
            <body>
                <h2>Better Space OTP Verification</h2>
                <p>Your One-Time Password (OTP) is:</p>
                <h1 style="color: #007bff; letter-spacing: 5px;">{otp_code}</h1>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>
                <br>
                <p>Best regards,<br>Better Space Team</p>
            </body>
        </html>
        """
        
        message.attach(MIMEText(body, 'html'))
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(message)
        server.quit()
        
        print(f"✓ OTP email sent successfully to {email}")
        return True
        
    except Exception as e:
        print(f"✗ Failed to send OTP email to {email}: {str(e)}")
        return False
