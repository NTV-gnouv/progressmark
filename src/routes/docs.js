const express = require('express');

const router = express.Router();

// English versions
router.get('/', (req, res) => {
  res.render('docs', { 
    title: 'API Documentation - ProgressMark',
    headerTitle: 'API Documentation',
    headerSubtitle: 'Project Management API with AI Evaluation',
    lang: 'en'
  });
});

router.get('/tester', (req, res) => {
  res.render('tester', { 
    title: 'API Tester - ProgressMark',
    headerTitle: 'API Tester',
    headerSubtitle: 'Interactive API Testing Tool',
    lang: 'en'
  });
});

router.get('/demo', (req, res) => {
  res.render('demo', { 
    title: 'ProgressMark API Demo',
    headerTitle: 'ProgressMark API Demo',
    headerSubtitle: 'Project Management API with AI Evaluation',
    lang: 'en'
  });
});

router.get('/architecture', (req, res) => {
  res.render('architecture', { 
    title: 'System Architecture - ProgressMark',
    headerTitle: 'System Architecture',
    headerSubtitle: 'System design and workflow analysis',
    lang: 'en'
  });
});

router.get('/workflow', (req, res) => {
  res.render('workflow', { 
    title: 'Workflow Analysis - ProgressMark',
    headerTitle: 'Workflow Analysis',
    headerSubtitle: 'Workflow analysis and business processes',
    lang: 'en'
  });
});

// Vietnamese versions
router.get('/vi', (req, res) => {
  res.render('docs-vi', { 
    title: 'Tài liệu API - ProgressMark',
    headerTitle: 'Tài liệu API',
    headerSubtitle: 'API Quản lý Dự án với Đánh giá AI',
    lang: 'vi'
  });
});

router.get('/vi/tester', (req, res) => {
  res.render('tester-vi', { 
    title: 'API Tester - ProgressMark',
    headerTitle: 'API Tester',
    headerSubtitle: 'Công cụ kiểm tra và thử nghiệm API',
    lang: 'vi'
  });
});

router.get('/vi/demo', (req, res) => {
  res.render('demo-vi', { 
    title: 'Demo API - ProgressMark',
    headerTitle: 'ProgressMark API Demo',
    headerSubtitle: 'API Quản lý Dự án với Đánh giá AI',
    lang: 'vi'
  });
});

router.get('/vi/architecture', (req, res) => {
  res.render('architecture-vi', { 
    title: 'Kiến trúc Hệ thống - ProgressMark',
    headerTitle: 'Kiến trúc Hệ thống',
    headerSubtitle: 'Thiết kế hệ thống và luồng hoạt động',
    lang: 'vi'
  });
});

router.get('/vi/workflow', (req, res) => {
  res.render('workflow-vi', { 
    title: 'Phân tích Luồng hoạt động - ProgressMark',
    headerTitle: 'Phân tích Luồng hoạt động',
    headerSubtitle: 'Phân tích luồng hoạt động và quy trình nghiệp vụ',
    lang: 'vi'
  });
});

module.exports = router;
