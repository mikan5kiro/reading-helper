// app.js
App({
  globalData: {
    books: [],
    dataUpdated: false // 数据更新标记
  },

  onLaunch() {
    this.loadBooks();
  },

  loadBooks() {
    try {
      const books = wx.getStorageSync('books');
      if (books && Array.isArray(books)) {
        this.globalData.books = books;
      } else {
        this.globalData.books = [];
      }
    } catch (error) {
      console.error('加载书籍数据失败:', error);
      this.globalData.books = [];
    }
  },

  saveBooks() {
    try {
      wx.setStorageSync('books', this.globalData.books);
      this.globalData.dataUpdated = true; // 标记数据已更新
      console.log('保存书籍数据成功:', this.globalData.books.length, '本书籍');
    } catch (error) {
      console.error('保存书籍数据失败:', error);
    }
  },

  // 检查数据是否需要重新加载
  checkDataUpdated() {
    const updated = this.globalData.dataUpdated;
    if (updated) {
      this.globalData.dataUpdated = false; // 重置标记
    }
    return updated;
  },

  addBook(bookData) {
    const newBook = {
      id: Date.now().toString(),
      title: bookData.title,
      author: bookData.author || '',
      category: bookData.category || '',
      totalPages: bookData.totalPages || 0,
      currentPage: 0,
      status: bookData.status || 'reading',
      createdAt: Date.now(),
      finishedAt: bookData.finishedAt || null,
      startDate: bookData.startDate || ''
    };

    this.globalData.books.push(newBook);
    this.saveBooks();
    return newBook;
  },

  updateBook(bookId, updates) {
    const index = this.globalData.books.findIndex(book => book.id === bookId);
    if (index !== -1) {
      this.globalData.books[index] = { ...this.globalData.books[index], ...updates };
      this.saveBooks();
      console.log('更新书籍成功:', this.globalData.books[index]);
      return true;
    }
    console.log('更新书籍失败: 未找到书籍', bookId);
    return false;
  },

  deleteBook(bookId) {
    const index = this.globalData.books.findIndex(book => book.id === bookId);
    if (index !== -1) {
      this.globalData.books.splice(index, 1);
      this.saveBooks();
      return true;
    }
    return false;
  },

  getAllBooks() {
    return this.globalData.books;
  },

  getBooksByStatus(status) {
    return this.globalData.books.filter(book => book.status === status);
  },

  markAsFinished(bookId) {
    return this.updateBook(bookId, {
      status: 'finished',
      finishedAt: Date.now()
    });
  },

  startReading(bookId) {
    return this.updateBook(bookId, {
      status: 'reading',
      currentPage: 0
    });
  },

  getBookStats() {
    const allBooks = this.globalData.books;
    return {
      reading: allBooks.filter(book => book.status === 'reading').length,
      finished: allBooks.filter(book => book.status === 'finished').length,
      wish: allBooks.filter(book => book.status === 'wish').length
    };
  }
});