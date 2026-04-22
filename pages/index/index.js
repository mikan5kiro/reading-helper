// pages/index/index.js
const app = getApp();

Page({
  data: {
    readingBooks: [],
    isLoading: false,
    showAddModal: false,
    showMoreMenu: false,
    showEditModal: false,
    currentBookId: '',
    categories: ['小说', '心理', '社会', '成功', '经济', '哲学', '其他'],
    categoryIndex: -1,
    formData: {
      title: '',
      author: '',
      category: ''
    }
  },

  onLoad() {
    app.loadBooks();
    this.loadReadingBooks();
  },

  onShow() {
    app.loadBooks();
    this.loadReadingBooks();
  },

  loadReadingBooks() {
    this.setData({ isLoading: true });
    
    setTimeout(() => {
      const readingBooks = app.getBooksByStatus('reading');
      console.log('加载的在读书籍:', readingBooks);
      
      // 按创建时间降序排序，新添加的书籍排在前面
      const sortedBooks = (readingBooks || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      const formattedBooks = sortedBooks.map(book => {
        let progressPercent = 0;
        if (book.totalPages > 0) {
          progressPercent = Math.round((book.currentPage / book.totalPages) * 100);
        } else if (book.progress !== undefined) {
          progressPercent = book.progress;
        }
        const progressBlockCount = Math.ceil(progressPercent / 20);
        return {
          ...book,
          progressPercent,
          progressBlockCount
        };
      });
      
      console.log('格式化后的书籍数据:', formattedBooks);
      
      this.setData({
        readingBooks: formattedBooks,
        isLoading: false
      });
    }, 300);
  },

  showAddModal() {
    this.setData({
      showAddModal: true,
      categoryIndex: -1,
      formData: {
        title: '',
        author: '',
        category: ''
      }
    });
  },

  onCategoryChange(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    this.setData({
      categoryIndex: index,
      'formData.category': category
    });
  },

  showProgressPicker(e) {
    const { bookid } = e.currentTarget.dataset;
    const book = this.data.readingBooks.find(b => b.id === bookid);
    if (book) {
      this.setData({
        showProgressModal: true,
        currentBookId: bookid,
        tempProgress: book.progressPercent
      });
    }
  },

  hideProgressModal() {
    this.setData({ showProgressModal: false });
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

  hideAddModal() {
    this.setData({ showAddModal: false });
  },

  stopPropagation() {
    // 阻止事件冒泡
  },

  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
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
      status: 'reading'
    };
    
    app.addBook(bookData);
    this.loadReadingBooks();
    this.hideAddModal();
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
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

  showMoreMenu(e) {
    const { bookid } = e.currentTarget.dataset;
    this.setData({
      currentBookId: bookid,
      showMoreMenu: true
    });
  },

  hideMoreMenu() {
    this.setData({
      showMoreMenu: false
    });
  },

  editBook() {
    const bookid = this.data.currentBookId;
    const book = app.globalData.books.find(b => b.id === bookid);
    
    if (book) {
      this.setData({
        formData: {
          title: book.title,
          author: book.author || '',
          totalPages: book.totalPages || ''
        },
        showMoreMenu: false,
        showEditModal: true
      });
    }
  },

  deleteBook() {
    const bookid = this.data.currentBookId;
    
    wx.showModal({
      title: '确认',
      content: '确定要删除这本书吗？',
      success: (res) => {
        if (res.confirm) {
          app.deleteBook(bookid);
          this.loadReadingBooks();
          this.setData({ showMoreMenu: false });
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  submitEditForm() {
    const { title, author, totalPages } = this.data.formData;
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
      totalPages: parseInt(totalPages) || 0
    });
    
    this.loadReadingBooks();
    this.setData({ showEditModal: false });
    wx.showToast({
      title: '编辑成功',
      icon: 'success'
    });
  },

  hideEditModal() {
    this.setData({ showEditModal: false });
  }
});