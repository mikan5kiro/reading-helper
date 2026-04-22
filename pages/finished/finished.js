// pages/finished/finished.js
const app = getApp();
const { PageBase } = require('../../utils/pageBase.js');
const { BookService, BookActionService } = require('../../service/bookService.js');

Page({
  data: {
    groupedBooks: [],
    totalCount: 0
  },

  onLoad() {
    this.pageBase = new PageBase(this);
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    this.loadFinishedBooks();
  },

  loadFinishedBooks() {
    this.pageBase.loadBooksByStatus('finished', (books) => {
      const groupedBooks = BookService.processFinishedBooks(books);
      this.setData({
        groupedBooks,
        totalCount: books.length
      });
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

  submitAddForm() {
    const { title, author, category, finishedDate } = this.data.formData;
    if (!title.trim()) {
      wx.showToast({ title: '请输入书名', icon: 'none' });
      return;
    }
    if (!finishedDate) {
      wx.showToast({ title: '请选择读完时间', icon: 'none' });
      return;
    }
    const finishedAt = new Date(finishedDate).getTime();
    const result = BookActionService.addBook({
      title,
      author,
      category,
      status: 'finished',
      finishedAt
    });
    if (result.success) {
      this.loadFinishedBooks();
      this.hideAddModal();
      wx.showToast({ title: '添加成功', icon: 'success' });
    }
  },

  submitEditForm() {
    const { title, author, category, finishedDate } = this.data.formData;
    const bookid = this.data.currentBookId;
    if (!title.trim()) {
      wx.showToast({ title: '请输入书名', icon: 'none' });
      return;
    }
    if (!finishedDate) {
      wx.showToast({ title: '请选择读完时间', icon: 'none' });
      return;
    }
    const finishedAt = new Date(finishedDate).getTime();
    BookActionService.updateBook(bookid, {
      title: title.trim(),
      author: author.trim(),
      category: category || '',
      finishedAt
    });
    this.loadFinishedBooks();
    this.setData({ showEditModal: false });
    wx.showToast({ title: '编辑成功', icon: 'success' });
  }
});