// pages/index/index.js
const app = getApp();

Page({
  data: {
    readingBooks: [],
    isLoading: false,
    showAddModal: false,
    showMoreMenu: false,
    showEditModal: false,
    showCongratsModal: false,
    thisMonthCount: 0,
    currentBookId: '',
    categories: ['文学', '人文社科', '自然科学', '经济与商业', '计算机', '艺术与设计', '生活与健康', '童书', '教材/考试/工具书', '其他'],
    categoryIndex: -1,
    formData: {
      title: '',
      author: '',
      category: ''
    }
  },

  onLoad(options) {
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
      // 强制重新加载数据
      app.loadBooks();
      
      const readingBooks = app.getBooksByStatus('reading');
      console.log('加载的在读书籍数量:', readingBooks ? readingBooks.length : 0);
      console.log('加载的在读书籍:', readingBooks);
      
      // 确保 readingBooks 是数组
      const booksToProcess = Array.isArray(readingBooks) ? readingBooks : [];
      
      // 读取排序设置
      const settings = wx.getStorageSync('readingHelperSettings');
      const sortByStartDate = settings ? settings.sortByStartDate !== false : true;
      
      // 根据设置决定排序方式
      const sortedBooks = booksToProcess.sort((a, b) => {
        try {
          if (sortByStartDate) {
            // 按开始阅读时间降序排序，开始读得晚的排在上面
            // 如果开始阅读时间相同，按添加时间降序排序，新添加的排在上面
            const dateA = a.startDate || '';
            const dateB = b.startDate || '';
            if (dateA && dateB) {
              const dateComparison = dateB.localeCompare(dateA);
              if (dateComparison !== 0) return dateComparison;
              // 开始阅读时间相同，按添加时间排序
              return (b.createdAt || 0) - (a.createdAt || 0);
            }
            if (dateA) return -1;
            if (dateB) return 1;
            return (b.createdAt || 0) - (a.createdAt || 0);
          } else {
            // 按添加时间降序排序，新添加的排在上面
            return (b.createdAt || 0) - (a.createdAt || 0);
          }
        } catch (sortError) {
          console.error('排序错误:', sortError);
          return 0;
        }
      });
      
      const formattedBooks = sortedBooks.map(book => {
        try {
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
            try {
              const startDate = new Date(book.startDate);
              if (!isNaN(startDate.getTime())) {
                const today = new Date();
                const diffTime = Math.abs(today - startDate);
                daysReading = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }
            } catch (dateError) {
              console.error('日期计算错误:', dateError);
              daysReading = 0;
            }
          }
          
          return {
            ...book,
            progressPercent,
            progressBlockCount,
            daysReading
          };
        } catch (formatError) {
          console.error('格式化书籍错误:', formatError);
          // 返回原始书籍数据，确保不会因为单个书籍错误影响整个列表
          return book;
        }
      });
      
      console.log('格式化后的书籍数据数量:', formattedBooks.length);
      console.log('格式化后的书籍数据:', formattedBooks);
      
      this.setData({
        readingBooks: formattedBooks,
        isLoading: false
      });
    } catch (error) {
      console.error('加载在读书籍失败:', error);
      // 即使出错也尝试获取原始数据
      try {
        app.loadBooks();
        const readingBooks = app.getBooksByStatus('reading');
        const booksToShow = Array.isArray(readingBooks) ? readingBooks : [];
        this.setData({ 
          readingBooks: booksToShow,
          isLoading: false
        });
      } catch (fallbackError) {
        console.error('备用方案也失败:', fallbackError);
        this.setData({ 
          readingBooks: [],
          isLoading: false
        });
      }
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
          
          // 计算本月已读数量
          const finishedBooks = app.getBooksByStatus('finished');
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          const thisMonthCount = finishedBooks.filter(book => {
            if (!book.finishedAt) return false;
            const date = new Date(book.finishedAt);
            return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth;
          }).length;
          
          this.setData({
            showCongratsModal: true,
            thisMonthCount: thisMonthCount
          });
        }
      }
    });
  },

  hideCongratsModal() {
    this.setData({ showCongratsModal: false });
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
  },

  onShareAppMessage() {
    return getApp().getShareConfig();
  },

  // onShareTimeline() {
  //   return getApp().getTimelineConfig();
  // }
});