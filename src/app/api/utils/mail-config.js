const config = {
  host: process.env.NEXT_PUBLIC_MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.NEXT_PUBLIC_MAIL_USERNAME,
    pass: process.env.NEXT_PUBLIC_MAIL_PASSWORD,
  },
};

export default config;
