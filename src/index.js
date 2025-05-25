import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';


import executionRoutes from './routes/executeCode.routes.js';
import authRoutes from './routes/auth.routes.js';
import problemRoutes from './routes/problem.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import playlistRoutes from './routes/playlist.routes.js';

dotenv.config();

const app = express();

// app.use(cors({
//   origin: 'http://localhost:5173', // No trailing slash!
//   credentials: true, // If using cookies or HTTP auth
// }));

app.use(cors({
  // origin: "http://localhost:5173", // Or "*" for all origins (not recommended for production)
  origin: "https://leetlab-frontend.onrender.com",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/problems", problemRoutes);
app.use("/api/v1/execute-code", executionRoutes);
app.use("./api/v1/submission", submissionRoutes);

app.use("/api/v1/playlist", playlistRoutes)




const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});