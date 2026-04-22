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
    categories: ['文学', '人文社科', '自然科学', '经济与商业', '计算机', '艺术与设计', '生活与健康', '童书', '教材/考试/工具书', '其他'],
    categoryIndex: -1,
    formData: {
      title: '',
      author: '',
      category: ''
    }
  },

  onLoad() {
    this.setData({ isLoading: true });
    app.loadBooks();
    this.loadReadingBooks();
  },

  onShow() {
    app.loadBooks();
    this.loadReadingBooks();
  },

  loadReadingBooks() {
    const showLoading = this.data.isLoading;
    try {
      const readingBooks = app.getBooksByStatus('reading');
      console.log('加载的在读书籍:', readingBooks);
      
      // 按开始阅读时间降序排序，开始读得晚的排在上面
      const sortedBooks = (readingBooks || []).sort((a, b) => {
        const dateA = a.startDate || '';
        const dateB = b.startDate || '';
        if (dateA && dateB) return dateB.localeCompare(dateA);
        if (dateA) return -1;
        if (dateB) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
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
        let daysReading = 0;
        if (book.startDate) {
          const startDate = new Date(book.startDate);
          const today = new Date();
          const diffTime = Math.abs(today - startDate);
          daysReading = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
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
    } catch (error) {
      console.error('加载在读书籍失败:', error);
      this.setData({ 
        readingBooks: [],
        isLoading: false
      });
    }
  },

  showAddModal() {
    // 获取今天的日期作为默认值
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const defaultDate = `${year}-${month}-${day}`;
    
    this.setData({
      showAddModal: true,
      categoryIndex: -1,
      formData: {
        title: '',
        author: '',
        category: '',
        totalPages: '',
        startDate: defaultDate
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

  onStartDateChange(e) {
    const date = e.detail.value;
    this.setData({
      'formData.startDate': date
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

  onEditCategoryChange(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    this.setData({
      editCategoryIndex: index,
      'formData.category': category
    });
  },

  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
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
      const editCategoryIndex = this.data.categories.findIndex(c => c === book.category);
      this.setData({
        formData: {
          title: book.title,
          author: book.author || '',
          category: book.category || '',
          totalPages: book.totalPages || '',
          startDate: book.startDate || ''
        },
        editCategoryIndex: editCategoryIndex >= 0 ? editCategoryIndex : -1,
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
  },

  hideEditModal() {
    this.setData({ showEditModal: false });
  }
});