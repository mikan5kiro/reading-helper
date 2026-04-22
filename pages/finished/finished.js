// pages/finished/finished.js
const app = getApp();
const { CATEGORIES, formatFinishedDate, groupBooksByMonth, getTodayString } = require('../../utils/common.js');

Page({
  data: {
    groupedBooks: [],
    totalCount: 0,
    isLoading: true,
    showMoreMenu: false,
    showEditModal: false,
    showAddModal: false,
    currentBookId: '',
    categories: CATEGORIES,
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
    this.setData({ isLoading: true });
    this.loadFinishedBooks();
  },

  onShow() {
    this.loadFinishedBooks();
  },

  loadFinishedBooks() {
    try {
      const finishedBooks = app.getBooksByStatus('finished');
      console.log('加载的已读书籍:', finishedBooks);
      
      // 按完成时间降序排序
      const sortedBooks = (finishedBooks || []).sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
      
      // 按月份分组
      const groupedBooks = groupBooksByMonth(sortedBooks, formatFinishedDate);
      
      this.setData({
        groupedBooks,
        totalCount: finishedBooks.length,
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
    const todayStr = getTodayString();
    
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