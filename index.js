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

// 환경변수 로드 (.env 파일 경로 명시 - 로컬 개발용)
// 클라우드타입에서는 환경변수가 직접 제공되므로 dotenv는 선택적
const envPath = join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

// dotenv 로드 결과 확인 (에러만 로그)
if (result.error) {
  // .env 파일이 없어도 계속 진행 (클라우드 환경에서는 정상)
  console.warn('⚠️ .env 파일 로드 실패 (클라우드 환경에서는 정상):', result.error.message);
}

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo';

// 환경변수 확인 (클라우드 배포 디버깅용)
console.log('=== 환경변수 확인 ===');
console.log('PORT:', PORT);
console.log('MONGODB_URI 존재:', process.env.MONGODB_URI ? '✅ 예' : '❌ 아니오');
if (!process.env.MONGODB_URI) {
  console.error('');
  console.error('❌ MONGODB_URI 환경변수가 설정되지 않았습니다!');
  console.error('');
  console.error('클라우드타입에서 환경변수를 설정해주세요:');
  console.error('1. 클라우드타입 대시보드 → 프로젝트 선택');
  console.error('2. 설정 → 환경변수');
  console.error('3. 변수명: MONGODB_URI');
  console.error('4. 값: mongodb+srv://사용자명:비밀번호@클러스터주소/todo');
  console.error('5. 저장 후 재배포');
  console.error('');
}

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

// MongoDB 연결 (클라우드 배포를 위한 옵션 추가)
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // 10초 타임아웃
    socketTimeoutMS: 45000,
    dbName: 'todo', // 데이터베이스 이름 명시
  })
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    console.log('📊 연결된 데이터베이스:', mongoose.connection.db.databaseName);
    console.log('🔌 연결 상태:', mongoose.connection.readyState === 1 ? '연결됨' : '연결 안됨');
    
    // 데이터베이스 연결 확인
    mongoose.connection.db.admin().listDatabases()
      .then((databases) => {
        console.log('📋 사용 가능한 데이터베이스:', databases.databases.map(db => db.name).join(', '));
      })
      .catch((err) => {
        console.warn('⚠️ 데이터베이스 목록 조회 실패 (권한 문제일 수 있음):', err.message);
      });
  })
  .catch((error) => {
    console.error('❌ MongoDB 연결 실패:', error.message);
    console.error('연결 URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    console.error('');
    console.error('확인 사항:');
    console.error('1. MONGODB_URI 환경변수가 올바르게 설정되었는지');
    console.error('2. MongoDB Atlas IP 허용 목록에 클라우드타입 IP가 추가되었는지');
    console.error('3. 연결 문자열 형식이 올바른지 (mongodb+srv://...)');
    console.error('4. MongoDB Atlas 사용자 권한 확인 (Database Access)');
    console.error('');
    // 연결 실패해도 서버는 계속 실행 (헬스체크는 가능)
    // process.exit(1); // 주석 처리하여 서버는 계속 실행
  });

// MongoDB 연결 이벤트 리스너
mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB 연결 오류:', error.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB 연결이 끊어졌습니다.');
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB 연결됨');
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Todo Backend API',
    status: 'running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 헬스체크 엔드포인트 (클라우드 배포용)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 할일 라우터
app.use('/todos', todoRoutes);

// 서버 시작 (클라우드 배포를 위해 0.0.0.0에 바인딩)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 헬스체크: http://localhost:${PORT}/health`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 포트 ${PORT}가 이미 사용 중입니다.`);
    console.error('다른 프로세스를 종료하거나 다른 포트를 사용해주세요.');
    process.exit(1);
  } else {
    console.error('서버 시작 오류:', error);
    process.exit(1);
  }
});
