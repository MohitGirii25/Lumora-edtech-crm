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

// Load environment variables
dotenv.config({
  path: path.join(__dirname, '..', '.env')
});

const app = express();

// ==========================================
// 1. ALLOWED FRONTEND ORIGINS
// ==========================================

const allowedOrigins = (
  process.env.APP_CORS_ALLOWED_ORIGIN ||
  'http://localhost:5173'
)
  .split(',')
  .map(origin => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Debug environment configuration
console.log(
  'CORS ENV VALUE:',
  process.env.APP_CORS_ALLOWED_ORIGIN
);

console.log(
  'CORS PARSED ORIGINS:',
  JSON.stringify(allowedOrigins)
);

// ==========================================
// 2. CORS CONFIGURATION
// ==========================================

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin
        ? origin.trim().replace(/\/+$/, '')
        : '';

      const localDevOrigin =
        process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
          normalizedOrigin
        );

      const isAllowed =
        !origin ||
        allowedOrigins.includes(normalizedOrigin) ||
        localDevOrigin;

      // Debug request origin
      console.log('REQUEST ORIGIN:', JSON.stringify(origin));
      console.log(
        'NORMALIZED ORIGIN:',
        JSON.stringify(normalizedOrigin)
      );

      console.log('ORIGIN MATCH:', isAllowed);

      // Detailed comparison for debugging
      console.log(
        'EXACT CORS COMPARISON:',
        JSON.stringify({
          request: normalizedOrigin,

          requestCharacters: [...normalizedOrigin].map(
            char => char.charCodeAt(0)
          ),

          comparisons: allowedOrigins.map(item => ({
            allowed: item,
            matches: item === normalizedOrigin,
            allowedLength: item.length,
            requestLength: normalizedOrigin.length,

            allowedCharacters: [...item].map(
              char => char.charCodeAt(0)
            ),

            firstDifferentIndex: [...item].findIndex(
              (char, index) =>
                char !== [...normalizedOrigin][index]
            )
          }))
        })
      );

      if (isAllowed) {
        return callback(null, true);
      }

      console.error('CORS BLOCKED ORIGIN:', origin);

      return callback(
        new Error('Origin is not allowed by CORS.')
      );
    },

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

// ==========================================
// 3. BODY PARSER
// ==========================================

app.use(express.json());

// ==========================================
// 4. API ROUTES
// ==========================================

const authRoutes = require('./routes/authRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');

app.use('/api/auth', authRoutes);

app.use('/api/inquiries', inquiryRoutes);

app.use('/api/admin/inquiries', inquiryRoutes);

// ==========================================
// 5. EXPORT EXPRESS APP
// ==========================================

module.exports = app;
