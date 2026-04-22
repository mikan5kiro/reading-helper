// utils/common.js

// 书籍分类列表
export const CATEGORIES = ['文学', '人文社科', '自然科学', '经济与商业', '计算机', '艺术与设计', '生活与健康', '童书', '教材/考试/工具书', '其他'];

// 格式化日期
export function formatDate(timestamp) {
  if (!timestamp) return '未知';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 格式化完成日期
export function formatFinishedDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日读完`;
}

// 计算已读天数
export function calculateReadingDays(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 验证表单
export function validateForm(formData) {
  if (!formData.title || !formData.title.trim()) {
    return { valid: false, message: '请输入书名' };
  }
  return { valid: true };
}

// 按月份分组书籍
export function groupBooksByMonth(books, formatDateFunc) {
  if (!books || books.length === 0) {
    return [];
  }
  
  const sortedBooks = books.sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
  
  const groups = {};
  
  sortedBooks.forEach(book => {
    let monthKey = '未设置时间';
    let dateStr = '未设置时间';
    
    if (book.finishedAt) {
      const date = new Date(book.finishedAt);
      monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      dateStr = formatDateFunc ? formatDateFunc(book.finishedAt) : '';
    }
    
    if (!groups[monthKey]) {
      groups[monthKey] = {
        month: monthKey,
        books: []
      };
    }
    
    const formattedBook = {
      ...book,
      finishedDateStr: dateStr
    };
    
    groups[monthKey].books.push(formattedBook);
  });
  
  return Object.values(groups);
}

// 获取今天的日期字符串
export function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}