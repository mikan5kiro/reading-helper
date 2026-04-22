// pages/finished/finished.js
const app = getApp();
const { PageBase, formatFinishedDate, groupBooksByMonth, getTodayString } = require('../../utils/pageBase.js');

Page({
  data: {
    groupedBooks: [],
    totalCount: 0
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
    this.loadFinishedBooks();
  },

  loadFinishedBooks() {
    this.pageBase.loadBooksByStatus('finished', (books) => {
      console.log('加载的已读书籍:', books);
      
      // 按完成时间降序排序
      const sortedBooks = (books || []).sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
      
      // 按月份分组
      const groupedBooks = groupBooksByMonth(sortedBooks, formatFinishedDate);
      
      this.setData({
        groupedBooks,
        totalCount: books.length,
        isLoading: false
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
      wx.showToast({
        title: '请输入书名',
        icon: 'none'
      });
      return;
    }
    
    if (!finishedDate) {
      wx.showToast({
        title: '请选择读完时间',
        icon: 'none'
      });
      return;
    }
    
    const finishedAt = new Date(finishedDate).getTime();
    
    const bookData = {
      title: title.trim(),
      author: author.trim(),
      category: category || '',
      status: 'finished',
      finishedAt: finishedAt
    };
    
    app.addBook(bookData);
    this.loadFinishedBooks();
    this.hideAddModal();
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  submitEditForm() {
    const { title, author, category, finishedDate } = this.data.formData;
    const bookid = this.data.currentBookId;
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入书名',
        icon: 'none'
      });
      return;
    }
    
    if (!finishedDate) {
      wx.showToast({
        title: '请选择读完时间',
        icon: 'none'
      });
      return;
    }
    
    const finishedAt = new Date(finishedDate).getTime();
    
    app.updateBook(bookid, {
      title: title.trim(),
      author: author.trim(),
      category: category || '',
      finishedAt: finishedAt
    });
    
    this.loadFinishedBooks();
    this.setData({ showEditModal: false });
    wx.showToast({
      title: '编辑成功',
      icon: 'success'
    });
  }
});