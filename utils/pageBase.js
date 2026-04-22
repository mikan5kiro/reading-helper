// utils/pageBase.js

const app = getApp();
const { CATEGORIES, formatDate, formatFinishedDate, calculateReadingDays, groupBooksByMonth, getTodayString } = require('./common.js');

// 页面基类
class PageBase {
  constructor(page) {
    this.page = page;
    this.initData();
    this.bindMethods();
  }

  // 初始化数据
  initData() {
    this.page.data = {
      ...this.page.data,
      showAddModal: false,
      showMoreMenu: false,
      showEditModal: false,
      showProgressModal: false,
      currentBookId: '',
      categories: CATEGORIES,
      categoryIndex: -1,
      editCategoryIndex: -1,
      tempProgress: 0,
      formData: {
        title: '',
        author: '',
        category: '',
        totalPages: '',
        startDate: '',
        finishedDate: ''
      }
    };
    
    // 页面数据缓存
    this.page._cachedData = {
      books: {}
    };
  }

  // 绑定方法
  bindMethods() {
    // 加载逻辑
    this.page.loadBooks = this.loadBooks.bind(this);
    this.page.loadBooksByStatus = this.loadBooksByStatus.bind(this);
    
    // 模态框控制
    this.page.showAddModal = this.showAddModal.bind(this);
    this.page.hideAddModal = this.hideAddModal.bind(this);
    this.page.showEditModal = this.showEditModal.bind(this);
    this.page.hideEditModal = this.hideEditModal.bind(this);
    this.page.showMoreMenu = this.showMoreMenu.bind(this);
    this.page.hideMoreMenu = this.hideMoreMenu.bind(this);
    this.page.showProgressModal = this.showProgressModal.bind(this);
    this.page.hideProgressModal = this.hideProgressModal.bind(this);
    
    // 表单处理
    this.page.onFormInput = this.onFormInput.bind(this);
    this.page.onCategoryChange = this.onCategoryChange.bind(this);
    this.page.onEditCategoryChange = this.onEditCategoryChange.bind(this);
    this.page.onStartDateChange = this.onStartDateChange.bind(this);
    this.page.onDateChange = this.onDateChange.bind(this);
    
    // 通用操作
    this.page.stopPropagation = this.stopPropagation.bind(this);
    this.page.deleteBook = this.deleteBook.bind(this);
  }

  // 加载书籍数据
  loadBooks() {
    // 只有在数据更新时才重新加载
    if (app.checkDataUpdated()) {
      app.loadBooks();
      // 数据更新时清除缓存
      this.clearCache();
    }
  }

  // 清除缓存
  clearCache() {
    this.page._cachedData = {
      books: {}
    };
  }

  // 根据状态加载书籍
  loadBooksByStatus(status, callback) {
    try {
      const books = app.getBooksByStatus(status);
      
      // 生成缓存键
      const cacheKey = `${status}_${books.length}_${books[books.length - 1]?.createdAt || ''}_${books[books.length - 1]?.updatedAt || ''}`;
      
      // 检查缓存
      if (this.page._cachedData.books[cacheKey]) {
        // 使用缓存数据
        if (callback) {
          callback(this.page._cachedData.books[cacheKey]);
        }
        return;
      }
      
      // 缓存数据
      this.page._cachedData.books[cacheKey] = books;
      
      if (callback) {
        callback(books);
      }
    } catch (error) {
      console.error(`加载${this.getStatusText(status)}书籍失败:`, error);
      if (callback) {
        callback([]);
      }
    }
  }

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      reading: '在读',
      finished: '已读',
      wish: '愿望单'
    };
    return statusMap[status] || status;
  }

  // 显示添加模态框
  showAddModal() {
    const today = getTodayString();
    this.page.setData({
      showAddModal: true,
      categoryIndex: -1,
      formData: {
        title: '',
        author: '',
        category: '',
        totalPages: '',
        startDate: today,
        finishedDate: today
      }
    });
  }

  // 隐藏添加模态框
  hideAddModal() {
    this.page.setData({ showAddModal: false });
  }

  // 显示编辑模态框
  showEditModal(book) {
    if (!book) return;
    
    const categoryIndex = this.page.data.categories.findIndex(c => c === book.category);
    const today = getTodayString();
    
    this.page.setData({
      formData: {
        title: book.title,
        author: book.author || '',
        category: book.category || '',
        totalPages: book.totalPages || '',
        startDate: book.startDate || today,
        finishedDate: book.finishedAt ? this.formatDateForInput(book.finishedAt) : today
      },
      editCategoryIndex: categoryIndex >= 0 ? categoryIndex : -1,
      showEditModal: true
    });
  }

  // 隐藏编辑模态框
  hideEditModal() {
    this.page.setData({ showEditModal: false });
  }

  // 显示更多菜单
  showMoreMenu(e) {
    const { bookid } = e.currentTarget.dataset;
    this.page.setData({
      currentBookId: bookid,
      showMoreMenu: true
    });
  }

  // 隐藏更多菜单
  hideMoreMenu() {
    this.page.setData({ showMoreMenu: false });
  }

  // 显示进度调节模态框
  showProgressModal(e) {
    const { bookid } = e.currentTarget.dataset;
    const book = this.page.data.readingBooks && this.page.data.readingBooks.find(b => b.id === bookid);
    if (book) {
      this.page.setData({
        showProgressModal: true,
        currentBookId: bookid,
        tempProgress: book.progressPercent
      });
    }
  }

  // 隐藏进度调节模态框
  hideProgressModal() {
    this.page.setData({ showProgressModal: false });
  }

  // 表单输入处理
  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.page.setData({
      [`formData.${field}`]: value
    });
  }

  // 分类选择处理
  onCategoryChange(e) {
    const index = e.detail.value;
    const category = this.page.data.categories[index];
    this.page.setData({
      categoryIndex: index,
      'formData.category': category
    });
  }

  // 编辑分类选择处理
  onEditCategoryChange(e) {
    const index = e.detail.value;
    const category = this.page.data.categories[index];
    this.page.setData({
      editCategoryIndex: index,
      'formData.category': category
    });
  }

  // 开始日期选择处理
  onStartDateChange(e) {
    this.page.setData({
      'formData.startDate': e.detail.value
    });
  }

  // 日期选择处理
  onDateChange(e) {
    this.page.setData({
      'formData.finishedDate': e.detail.value
    });
  }

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡
  }

  // 删除书籍
  deleteBook() {
    const bookid = this.page.data.currentBookId;
    
    wx.showModal({
      title: '确认',
      content: '确定要删除这本书吗？',
      success: (res) => {
        if (res.confirm) {
          app.deleteBook(bookid);
          this.page.setData({ showMoreMenu: false });
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          // 重新加载数据
          if (this.page.loadData) {
            this.page.loadData();
          }
        }
      }
    });
  }

  // 格式化日期为输入框格式
  formatDateForInput(timestamp) {
    if (!timestamp) return getTodayString();
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// 导出模块
module.exports = {
  PageBase,
  CATEGORIES,
  formatDate,
  formatFinishedDate,
  calculateReadingDays,
  groupBooksByMonth,
  getTodayString
};