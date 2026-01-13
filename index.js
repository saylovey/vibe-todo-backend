import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import todoRoutes from './routes/todoRoutes.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경변수 로드 (.env 파일 경로 명시)
dotenv.config({ path: join(__dirname, '.env') });

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo';

const app = express();

// CORS 설정 (기본 설정)
const corsOptions = {
  origin: '*', // 모든 출처 허용 (프로덕션에서는 특정 도메인으로 제한 권장)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

app.use(cors(corsOptions));

// JSON 파싱 미들웨어
app.use(express.json());

// MongoDB 연결
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('연결 성공');
  })
  .catch((error) => {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  });

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'Todo Backend API' });
});

// 할일 라우터
app.use('/todos', todoRoutes);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
