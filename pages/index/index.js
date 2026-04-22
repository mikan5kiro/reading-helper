// pages/index/index.js
const app = getApp();
const { PageBase } = require('../../utils/pageBase.js');
const { BookService, BookActionService } = require('../../service/bookService.js');

Page({
  data: {
    readingBooks: []
  },

  onLoad() {
    this.pageBase = new PageBase(this);
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    this.loadBooks();
    this.loadReadingBooks();
  },

  loadReadingBooks() {
    this.pageBase.loadBooksByStatus('reading', (books) => {
      const sortByStartDate = BookService.getSortSetting();
      const formattedBooks = BookService.processReadingBooks(books, sortByStartDate);
      this.setData({ readingBooks: formattedBooks });
    });
  },

  onProgressSliderChange(e) {
    this.setData({ tempProgress: e.detail.value });
  },

  setQuickProgress(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({ tempProgress: value });
  },

  confirmProgress() {
    const { currentBookId, tempProgress } = this.data;
    const book = this.data.readingBooks.find(b => b.id === currentBookId);
    if (book) {
      BookActionService.updateProgress(currentBookId, tempProgress, book.totalPages);
      const updatedBooks = this.data.readingBooks.map(item => {
        if (item.id === currentBookId) {
          const progressPercent = tempProgress;
          const progressBlockCount = Math.ceil(progressPercent / 20);
          return {
            ...item,
            progressPercent,
            progressBlockCount,
            currentPage: book.totalPages > 0 ? Math.round((tempProgress / 100) * book.totalPages) : item.currentPage
          };
        }
        return item;
      });
      this.setData({ readingBooks: updatedBooks, showProgressModal: false });
      wx.showToast({ title: '进度已更新', icon: 'success' });
    }
  },

  onProgressBlockTap(e) {
    const { bookid, index } = e.currentTarget.dataset;
    const progress = (parseInt(index) + 1) * 20;
    const book = this.data.readingBooks.find(b => b.id === bookid);
    if (book) {
      BookActionService.updateProgress(bookid, progress, book.totalPages);
      const updatedBooks = this.data.readingBooks.map(item => {
        if (item.id === bookid) {
          const progressBlockCount = Math.ceil(progress / 20);
          return {
            ...item,
            progressPercent: progress,
            progressBlockCount,
            currentPage: book.totalPages > 0 ? Math.round((progress / 100) * book.totalPages) : item.currentPage
          };
        }
        return item;
      });
      this.setData({ readingBooks: updatedBooks });
    }
  },

  onSliderChange(e) {
    const { bookid } = e.currentTarget.dataset;
    const progress = e.detail.value;
    const book = app.globalData.books.find(b => b.id === bookid);
    if (book) {
      BookActionService.updateProgress(bookid, progress, book.totalPages);
      const updatedBooks = this.data.readingBooks.map(item => {
        if (item.id === bookid) {
          const progressBlockCount = Math.ceil(progress / 20);
          return {
            ...item,
            progressPercent: progress,
            progressBlockCount,
            currentPage: book.totalPages > 0 ? Math.round((progress / 100) * book.totalPages) : item.currentPage
          };
        }
        return item;
      });
      this.setData({ readingBooks: updatedBooks });
    }
  },

  markAsFinished(e) {
    const { bookid } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认',
      content: '确定要标记这本书为已读吗？',
      success: (res) => {
        if (res.confirm) {
          BookActionService.markAsFinished(bookid);
          this.loadReadingBooks();
          wx.showToast({ title: '已标记为已读', icon: 'success' });
        }
      }
    });
  },

  editBook() {
    const bookid = this.data.currentBookId;
    const book = app.globalData.books.find(b => b.id === bookid);
    if (book) {
      this.pageBase.showEditModal(book);
      this.setData({ showMoreMenu: false });
    }
  },

  submitForm() {
    const { title, author, category, startDate } = this.data.formData;
    if (!title.trim()) {
      wx.showToast({ title: '请输入书名', icon: 'none' });
      return;
    }
    const result = BookActionService.addBook({
      title,
      author,
      category,
      status: 'reading',
      startDate
    });
    if (result.success) {
      this.loadReadingBooks();
      this.hideAddModal();
      wx.showToast({ title: '添加成功', icon: 'success' });
    }
  },

  submitEditForm() {
    const { title, author, category, totalPages, startDate } = this.data.formData;
    const bookid = this.data.currentBookId;
    if (!title.trim()) {
      wx.showToast({ title: '请输入书名', icon: 'none' });
      return;
    }
    BookActionService.updateBook(bookid, {
      title: title.trim(),
      author: author.trim(),
      category: category || '',
      totalPages: totalPages ? parseInt(totalPages) : 0,
      startDate
    });
    this.loadReadingBooks();
    this.setData({ showEditModal: false });
    wx.showToast({ title: '编辑成功', icon: 'success' });
  }
});