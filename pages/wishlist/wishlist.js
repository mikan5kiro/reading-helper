// pages/wishlist/wishlist.js
const app = getApp();
const { PageBase } = require('../../utils/pageBase.js');
const { BookService, BookActionService } = require('../../service/bookService.js');

Page({
  data: {
    wishBooks: []
  },

  onLoad() {
    this.pageBase = new PageBase(this);
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    this.loadWishBooks();
  },

  loadWishBooks() {
    this.pageBase.loadBooksByStatus('wish', (books) => {
      const wishBooks = BookService.processWishBooks(books);
      this.setData({ wishBooks });
    });
  },

  startReading(e) {
    const { bookid } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认',
      content: '确定要开始阅读这本书吗？',
      success: (res) => {
        if (res.confirm) {
          BookActionService.startReading(bookid);
          this.loadWishBooks();
          wx.showToast({ title: '已添加到在读书籍', icon: 'success' });
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
    const { title, author, category } = this.data.formData;
    if (!title.trim()) {
      wx.showToast({ title: '请输入书名', icon: 'none' });
      return;
    }
    const result = BookActionService.addBook({
      title,
      author,
      category,
      status: 'wish'
    });
    if (result.success) {
      this.loadWishBooks();
      this.hideAddModal();
      wx.showToast({ title: '添加成功', icon: 'success' });
    }
  },

  submitEditForm() {
    const { title, author, category } = this.data.formData;
    const bookid = this.data.currentBookId;
    if (!title.trim()) {
      wx.showToast({ title: '请输入书名', icon: 'none' });
      return;
    }
    BookActionService.updateBook(bookid, {
      title: title.trim(),
      author: author.trim(),
      category: category || ''
    });
    this.loadWishBooks();
    this.setData({ showEditModal: false });
    wx.showToast({ title: '编辑成功', icon: 'success' });
  }
});