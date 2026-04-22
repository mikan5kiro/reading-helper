// pages/wishlist/wishlist.js
const app = getApp();
const { PageBase, formatDate } = require('../../utils/pageBase.js');

Page({
  data: {
    wishBooks: []
  },

  onLoad() {
    // 初始化页面基类
    this.pageBase = new PageBase(this);
    this.setData({ isLoading: true });
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  loadData() {
    this.loadWishBooks();
  },

  loadWishBooks() {
    this.pageBase.loadBooksByStatus('wish', (books) => {
      // 按创建时间降序排序，新添加的书籍排在前面
      const sortedBooks = (books || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      // 添加添加日期字符串
      const booksWithDate = sortedBooks.map(book => {
        const addDateStr = book.createdAt ? formatDate(book.createdAt) : '未知';
        return {
          ...book,
          addDateStr
        };
      });
      this.setData({
        wishBooks: booksWithDate,
        isLoading: false
      });
    });
  },

  startReading(e) {
    const { bookid } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认',
      content: '确定要开始阅读这本书吗？',
      success: (res) => {
        if (res.confirm) {
          app.startReading(bookid);
          this.loadWishBooks();
          wx.showToast({
            title: '已添加到在读书籍',
            icon: 'success'
          });
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
      wx.showToast({
        title: '请输入书名',
        icon: 'none'
      });
      return;
    }
    
    const bookData = {
      title: title.trim(),
      author: author.trim(),
      category: category || '',
      status: 'wish'
    };
    
    app.addBook(bookData);
    this.loadWishBooks();
    this.hideAddModal();
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  submitEditForm() {
    const { title, author, category } = this.data.formData;
    const bookid = this.data.currentBookId;
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入书名',
        icon: 'none'
      });
      return;
    }
    
    app.updateBook(bookid, {
      title: title.trim(),
      author: author.trim(),
      category: category || ''
    });
    
    this.loadWishBooks();
    this.setData({ showEditModal: false });
    wx.showToast({
      title: '编辑成功',
      icon: 'success'
    });
  }
});