import express from 'express';
import Todo from '../models/Todo.js';

const router = express.Router();

// 할일 생성
router.post('/', async (req, res) => {
  try {
    const { title, description, completed } = req.body;

    if (!title) {
      return res.status(400).json({ error: '제목은 필수입니다.' });
    }

    const todo = new Todo({
      title,
      description: description || '',
      completed: completed || false,
    });

    const savedTodo = await todo.save();
    res.status(201).json(savedTodo);
  } catch (error) {
    res.status(500).json({ error: '할일 생성 실패', message: error.message });
  }
});

// 할일 목록 조회
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: '할일 목록 조회 실패', message: error.message });
  }
});

// 특정 할일 조회
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ error: '할일을 찾을 수 없습니다.' });
    }

    res.json(todo);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 ID입니다.' });
    }
    res.status(500).json({ error: '할일 조회 실패', message: error.message });
  }
});

// 할일 수정
router.put('/:id', async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.completed = completed;

    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!todo) {
      return res.status(404).json({ error: '할일을 찾을 수 없습니다.' });
    }

    res.json(todo);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 ID입니다.' });
    }
    res.status(500).json({ error: '할일 수정 실패', message: error.message });
  }
});

// 할일 삭제
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res.status(404).json({ error: '할일을 찾을 수 없습니다.' });
    }

    res.json({ message: '할일이 삭제되었습니다.', todo });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '유효하지 않은 ID입니다.' });
    }
    res.status(500).json({ error: '할일 삭제 실패', message: error.message });
  }
});

export default router;
