// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');
// dotenv.config({ path: path.join(__dirname, '..', '.env') });

// const app = express();
// const allowedOrigins = (process.env.APP_CORS_ALLOWED_ORIGIN || 'http://localhost:5173')
//   .split(',').map((origin) => origin.trim()).filter(Boolean);
// app.use(cors({ origin(origin, callback) {
//   const localDevOrigin = process.env.NODE_ENV !== 'production'
//     && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
//   if (!origin || allowedOrigins.includes(origin) || localDevOrigin) return callback(null, true);
//   return callback(new Error('Origin is not allowed by CORS.'));
// } }));
// app.use(express.json());

// const authRoutes = require('./routes/authRoutes');
// const inquiryRoutes = require('./routes/inquiryRoutes');
// app.use('/api/auth', authRoutes);
// app.use('/api/inquiries', inquiryRoutes);
// app.use('/api/admin/inquiries', inquiryRoutes);

// module.exports = app;

//-----------------------------------------------------
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');

// dotenv.config({ path: path.join(__dirname, '..', '.env') });

// const app = express();

// const allowedOrigins = (
//   process.env.APP_CORS_ALLOWED_ORIGIN || 'http://localhost:5173'
// )
//   .split(',')
//   .map((origin) => origin.trim().replace(/\/$/, ''))
//   .filter(Boolean);

// app.use(
//   cors({
//     origin(origin, callback) {
//       const normalizedOrigin = origin?.replace(/\/$/, '');

//       const localDevOrigin =
//         process.env.NODE_ENV !== 'production' &&
//         /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

//       if (
//         !origin ||
//         allowedOrigins.includes(normalizedOrigin) ||
//         localDevOrigin
//       ) {
//         return callback(null, true);
//       }

//       console.error('CORS blocked origin:', origin);
//       return callback(new Error('Origin is not allowed by CORS.'));
//     },
//   })
// );

// app.use(express.json());

// const authRoutes = require('./routes/authRoutes');
// const inquiryRoutes = require('./routes/inquiryRoutes');

// app.use('/api/auth', authRoutes);
// app.use('/api/inquiries', inquiryRoutes);
// app.use('/api/admin/inquiries', inquiryRoutes);

// module.exports = app;
//-------------------------------------------------------

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// Allowed frontend origins
const allowedOrigins = (
  process.env.APP_CORS_ALLOWED_ORIGIN || 'http://localhost:5173'
)
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin
        ? origin.replace(/\/$/, '')
        : '';

      const localDevOrigin =
        process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

      if (
        !origin ||
        allowedOrigins.includes(normalizedOrigin) ||
        localDevOrigin
      ) {
        return callback(null, true);
      }

      console.error('CORS blocked origin:', origin);

      return callback(new Error('Origin is not allowed by CORS.'));
    },

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Parse JSON requests
app.use(express.json());

// API routes
const authRoutes = require('./routes/authRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin/inquiries', inquiryRoutes);

module.exports = app;
