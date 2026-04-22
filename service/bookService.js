// service/bookService.js

const app = getApp();
const { formatDate, formatFinishedDate, groupBooksByMonth, calculateReadingDays, getTodayString } = require('../utils/common.js');

// 书籍业务服务
class BookService {
  // 处理在读书籍数据
  static processReadingBooks(books, sortByStartDate = true) {
    // 根据设置决定排序方式
    const sortedBooks = (books || []).sort((a, b) => {
      if (sortByStartDate) {
        // 按开始阅读时间降序排序，开始读得晚的排在上面
        const dateA = a.startDate || '';
        const dateB = b.startDate || '';
        if (dateA && dateB) return dateB.localeCompare(dateA);
        if (dateA) return -1;
        if (dateB) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else {
        // 按添加时间降序排序，新添加的排在上面
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

    // 格式化书籍数据
    return sortedBooks.map(book => {
      let progressPercent = 0;
      if (book.totalPages > 0) {
        progressPercent = Math.round((book.currentPage / book.totalPages) * 100);
      } else if (book.progress !== undefined) {
        progressPercent = book.progress;
      }
      const progressBlockCount = Math.ceil(progressPercent / 20);
      const daysReading = calculateReadingDays(book.startDate);

      return {
        ...book,
        progressPercent,
        progressBlockCount,
        daysReading
      };
    });
  }

  // 处理已读书籍数据
  static processFinishedBooks(books) {
    // 按完成时间降序排序
    const sortedBooks = (books || []).sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));

    // 按月份分组
    return groupBooksByMonth(sortedBooks, formatFinishedDate);
  }

  // 处理愿望单书籍数据
  static processWishBooks(books) {
    // 按创建时间降序排序
    const sortedBooks = (books || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // 添加日期字符串
    return sortedBooks.map(book => ({
      ...book,
      addDateStr: book.createdAt ? formatDate(book.createdAt) : '未知'
    }));
  }

  // 获取排序设置
  static getSortSetting() {
    const settings = wx.getStorageSync('readingHelperSettings');
    return settings ? settings.sortByStartDate !== false : true;
  }
}

// 书籍操作服务
class BookActionService {
  // 添加书籍
  static addBook(bookData) {
    if (!bookData.title || !bookData.title.trim()) {
      return { success: false, message: '请输入书名' };
    }

    const newBook = {
      id: Date.now().toString(),
      title: bookData.title.trim(),
      author: bookData.author?.trim() || '',
      category: bookData.category || '',
      totalPages: bookData.totalPages || 0,
      currentPage: 0,
      status: bookData.status || 'reading',
      createdAt: Date.now(),
      finishedAt: bookData.finishedAt || null,
      startDate: bookData.startDate || ''
    };

    app.globalData.books.push(newBook);
    app.saveBooks();
    return { success: true, book: newBook };
  }

  // 更新书籍
  static updateBook(bookId, updates) {
    const index = app.globalData.books.findIndex(book => book.id === bookId);
    if (index === -1) {
      return { success: false, message: '未找到书籍' };
    }

    app.globalData.books[index] = { ...app.globalData.books[index], ...updates };
    app.saveBooks();
    return { success: true };
  }

  // 删除书籍
  static deleteBook(bookId) {
    const index = app.globalData.books.findIndex(book => book.id === bookId);
    if (index === -1) {
      return { success: false, message: '未找到书籍' };
    }

    app.globalData.books.splice(index, 1);
    app.saveBooks();
    return { success: true };
  }

  // 标记为已读
  static markAsFinished(bookId) {
    return this.updateBook(bookId, {
      status: 'finished',
      finishedAt: Date.now()
    });
  }

  // 开始阅读
  static startReading(bookId) {
    return this.updateBook(bookId, {
      status: 'reading',
      currentPage: 0,
      startDate: getTodayString()
    });
  }

  // 更新阅读进度
  static updateProgress(bookId, progress, totalPages) {
    const updates = {};
    if (totalPages > 0) {
      updates.currentPage = Math.round((progress / 100) * totalPages);
    } else {
      updates.progress = progress;
    }
    return this.updateBook(bookId, updates);
  }
}

module.exports = {
  BookService,
  BookActionService
};