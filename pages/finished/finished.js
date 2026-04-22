// pages/finished/finished.js
const app = getApp();

Page({
  data: {
    groupedBooks: [],
    totalCount: 0,
    isLoading: false,
    showMoreMenu: false,
    showEditModal: false,
    showAddModal: false,
    currentBookId: '',
    categories: ['文学', '人文社科', '自然科学', '经济与商业', '计算机', '艺术与设计', '生活与健康', '童书', '教材/考试/工具书', '其他'],
    categoryIndex: -1,
    editCategoryIndex: -1,
    formData: {
      title: '',
      author: '',
      category: '',
      finishedDate: ''
    }
  },

  onLoad() {
    this.loadFinishedBooks();
  },

  onShow() {
    this.loadFinishedBooks();
  },

  loadFinishedBooks() {
    this.setData({ isLoading: true });
    
    setTimeout(() => {
      try {
        const finishedBooks = app.getBooksByStatus('finished');
        const groupedBooks = this.groupBooksByMonth(finishedBooks);
        const totalCount = finishedBooks ? finishedBooks.length : 0;
        
        this.setData({
          groupedBooks: groupedBooks || [],
          totalCount: totalCount,
          isLoading: false
        });
      } catch (error) {
        console.error('加载已读书籍失败:', error);
        this.setData({ 
          groupedBooks: [],
          totalCount: 0,
          isLoading: false 
        });
      }
    }, 300);
  },

  groupBooksByMonth(books) {
    if (!books || books.length === 0) {
      return [];
    }
    
    const sortedBooks = books.sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
    
    const groups = {};
    
    sortedBooks.forEach(book => {
      let monthKey = '未设置时间';
      let finishedDateStr = '未设置时间';
      
      if (book.finishedAt) {
        const date = new Date(book.finishedAt);
        monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
        finishedDateStr = this.formatFinishedDate(book.finishedAt);
      }
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          month: monthKey,
          books: []
        };
      }
      
      const formattedBook = {
        ...book,
        finishedDateStr: finishedDateStr
      };
      
      groups[monthKey].books.push(formattedBook);
    });
    
    return Object.values(groups);
  },

  formatFinishedDate(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${month}月${day}日读完`;
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
      const categoryIndex = this.data.categories.findIndex(c => c === book.category);
      this.setData({
        formData: {
          title: book.title,
          author: book.author || '',
          category: book.category || ''
        },
        editCategoryIndex: categoryIndex >= 0 ? categoryIndex : -1,
        showMoreMenu: false,
        showEditModal: true
      });
    }
  },

  onEditCategoryChange(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    this.setData({
      editCategoryIndex: index,
      'formData.category': category
    });
  },

  deleteBook() {
    const bookid = this.data.currentBookId;
    
    wx.showModal({
      title: '确认',
      content: '确定要删除这本书吗？',
      success: (res) => {
        if (res.confirm) {
          app.deleteBook(bookid);
          this.loadFinishedBooks();
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
    
    this.loadFinishedBooks();
    this.setData({ showEditModal: false });
    wx.showToast({
      title: '编辑成功',
      icon: 'success'
    });
  },

  hideEditModal() {
    this.setData({ showEditModal: false });
  },

  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
  },

  stopPropagation() {
    // 阻止事件冒泡
  },

  showAddModal() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    this.setData({
      showAddModal: true,
      categoryIndex: -1,
      formData: {
        title: '',
        author: '',
        category: '',
        finishedDate: todayStr
      }
    });
  },

  hideAddModal() {
    this.setData({ showAddModal: false });
  },

  onCategoryChange(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    this.setData({
      categoryIndex: index,
      'formData.category': category
    });
  },

  onDateChange(e) {
    this.setData({
      'formData.finishedDate': e.detail.value
    });
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

  editBook() {
    const bookid = this.data.currentBookId;
    const book = app.globalData.books.find(b => b.id === bookid);
    
    if (book) {
      const categoryIndex = this.data.categories.findIndex(c => c === book.category);
      let finishedDate = '';
      if (book.finishedAt) {
        const date = new Date(book.finishedAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        finishedDate = `${year}-${month}-${day}`;
      }
      
      this.setData({
        formData: {
          title: book.title,
          author: book.author || '',
          category: book.category || '',
          finishedDate: finishedDate
        },
        editCategoryIndex: categoryIndex >= 0 ? categoryIndex : -1,
        showMoreMenu: false,
        showEditModal: true
      });
    }
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