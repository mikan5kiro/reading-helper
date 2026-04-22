// pages/index/index.js
const app = getApp();
const { PageBase, calculateReadingDays, getTodayString } = require('../../utils/pageBase.js');

Page({
  data: {
    readingBooks: []
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
    this.loadBooks();
    this.loadReadingBooks();
  },

  loadReadingBooks() {
    this.pageBase.loadBooksByStatus('reading', (books) => {
      console.log('加载的在读书籍:', books);
      
      // 读取排序设置
      const settings = wx.getStorageSync('readingHelperSettings');
      const sortByStartDate = settings ? settings.sortByStartDate !== false : true;
      
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
      
      const formattedBooks = sortedBooks.map(book => {
        let progressPercent = 0;
        if (book.totalPages > 0) {
          progressPercent = Math.round((book.currentPage / book.totalPages) * 100);
        } else if (book.progress !== undefined) {
          progressPercent = book.progress;
        }
        const progressBlockCount = Math.ceil(progressPercent / 20);
        
        // 计算已读天数
        const daysReading = calculateReadingDays(book.startDate);
        
        return {
          ...book,
          progressPercent,
          progressBlockCount,
          daysReading
        };
      });
      
      console.log('格式化后的书籍数据:', formattedBooks);
      
      this.setData({
        readingBooks: formattedBooks,
        isLoading: false
      });
    });
  },

  onProgressSliderChange(e) {
    this.setData({
      tempProgress: e.detail.value
    });
  },

  setQuickProgress(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({
      tempProgress: value
    });
  },

  confirmProgress() {
    const { currentBookId, tempProgress } = this.data;
    const book = this.data.readingBooks.find(b => b.id === currentBookId);
    if (book) {
      if (book.totalPages > 0) {
        const currentPage = Math.round((tempProgress / 100) * book.totalPages);
        app.updateBook(currentBookId, { currentPage });
      } else {
        app.updateBook(currentBookId, { progress: tempProgress });
      }
      
      const progressBlockCount = Math.ceil(tempProgress / 20);
      const updatedBooks = this.data.readingBooks.map(item => {
        if (item.id === currentBookId) {
          return {
            ...item,
            progressPercent: tempProgress,
            progressBlockCount,
            currentPage: book.totalPages > 0 ? Math.round((tempProgress / 100) * book.totalPages) : item.currentPage
          };
        }
        return item;
      });
      
      this.setData({
        readingBooks: updatedBooks,
        showProgressModal: false
      });
      
      wx.showToast({
        title: '进度已更新',
        icon: 'success'
      });
    }
  },

  onProgressBlockTap(e) {
    const { bookid, index } = e.currentTarget.dataset;
    console.log('点击进度块:', bookid, index, typeof index);
    const progress = (parseInt(index) + 1) * 20;
    console.log('计算进度:', progress);
    const book = this.data.readingBooks.find(b => b.id === bookid);
    console.log('找到书籍:', book);
    
    if (book) {
      if (book.totalPages > 0) {
        const currentPage = Math.round((progress / 100) * book.totalPages);
        app.updateBook(bookid, { currentPage });
      } else {
        app.updateBook(bookid, { progress: progress });
      }
      
      const progressBlockCount = Math.ceil(progress / 20);
      const updatedBooks = this.data.readingBooks.map(item => {
        if (item.id === bookid) {
          return {
            ...item,
            progressPercent: progress,
            progressBlockCount,
            currentPage: book.totalPages > 0 ? Math.round((progress / 100) * book.totalPages) : item.currentPage
          };
        }
        return item;
      });
      
      this.setData({
        readingBooks: updatedBooks
      });
    }
  },

  onSliderChange(e) {
    const { bookid } = e.currentTarget.dataset;
    const progress = e.detail.value;
    
    const book = app.globalData.books.find(b => b.id === bookid);
    if (book) {
      if (book.totalPages > 0) {
        const currentPage = Math.round((progress / 100) * book.totalPages);
        app.updateBook(bookid, { currentPage });
      } else {
        app.updateBook(bookid, { progress: progress });
      }
      
      const progressBlockCount = Math.ceil(progress / 20);
      const updatedBooks = this.data.readingBooks.map(item => {
        if (item.id === bookid) {
          return {
            ...item,
            progressPercent: progress,
            progressBlockCount,
            currentPage: book.totalPages > 0 ? Math.round((progress / 100) * book.totalPages) : item.currentPage
          };
        }
        return item;
      });
      
      this.setData({
        readingBooks: updatedBooks
      });
    }
  },

  markAsFinished(e) {
    const { bookid } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认',
      content: '确定要标记这本书为已读吗？',
      success: (res) => {
        if (res.confirm) {
          app.markAsFinished(bookid);
          this.loadReadingBooks();
          wx.showToast({
            title: '已标记为已读',
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
    const { title, author, category, startDate } = this.data.formData;
    
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
      status: 'reading',
      startDate: startDate
    };
    
    app.addBook(bookData);
    this.loadReadingBooks();
    this.hideAddModal();
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  submitEditForm() {
    const { title, author, category, totalPages, startDate } = this.data.formData;
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
      category: category || '',
      totalPages: totalPages ? parseInt(totalPages) : 0,
      startDate: startDate
    });
    
    this.loadReadingBooks();
    this.setData({ showEditModal: false });
    wx.showToast({
      title: '编辑成功',
      icon: 'success'
    });
  }
});