// utils/pageBase.js

const app = getApp();
const { CATEGORIES, getTodayString } = require('./common.js');

// 页面基类 - 只负责UI逻辑
class PageBase {
  constructor(page) {
    this.page = page;
    this.initData();
    this.bindMethods();
  }

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
    
    this.page._cachedData = {
      books: {}
    };
  }

  bindMethods() {
    this.page.loadBooks = this.loadBooks.bind(this);
    this.page.loadBooksByStatus = this.loadBooksByStatus.bind(this);
    this.page.showAddModal = this.showAddModal.bind(this);
    this.page.hideAddModal = this.hideAddModal.bind(this);
    this.page.showEditModal = this.showEditModal.bind(this);
    this.page.hideEditModal = this.hideEditModal.bind(this);
    this.page.showMoreMenu = this.showMoreMenu.bind(this);
    this.page.hideMoreMenu = this.hideMoreMenu.bind(this);
    this.page.showProgressModal = this.showProgressModal.bind(this);
    this.page.hideProgressModal = this.hideProgressModal.bind(this);
    this.page.onFormInput = this.onFormInput.bind(this);
    this.page.onCategoryChange = this.onCategoryChange.bind(this);
    this.page.onEditCategoryChange = this.onEditCategoryChange.bind(this);
    this.page.onStartDateChange = this.onStartDateChange.bind(this);
    this.page.onDateChange = this.onDateChange.bind(this);
    this.page.stopPropagation = this.stopPropagation.bind(this);
    this.page.deleteBook = this.deleteBook.bind(this);
  }

  loadBooks() {
    if (app.checkDataUpdated()) {
      app.loadBooks();
      this.clearCache();
    }
  }

  clearCache() {
    this.page._cachedData = {
      books: {}
    };
  }

  loadBooksByStatus(status, callback) {
    try {
      const books = app.getBooksByStatus(status);
      const cacheKey = `${status}_${books.length}_${books[books.length - 1]?.createdAt || ''}_${books[books.length - 1]?.updatedAt || ''}`;
      
      if (this.page._cachedData.books[cacheKey]) {
        if (callback) {
          callback(this.page._cachedData.books[cacheKey]);
        }
        return;
      }
      
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

  getStatusText(status) {
    const statusMap = {
      reading: '在读',
      finished: '已读',
      wish: '愿望单'
    };
    return statusMap[status] || status;
  }

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

  hideAddModal() {
    this.page.setData({ showAddModal: false });
  }

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

  hideEditModal() {
    this.page.setData({ showEditModal: false });
  }

  showMoreMenu(e) {
    const { bookid } = e.currentTarget.dataset;
    this.page.setData({
      currentBookId: bookid,
      showMoreMenu: true
    });
  }

  hideMoreMenu() {
    this.page.setData({ showMoreMenu: false });
  }

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

  hideProgressModal() {
    this.page.setData({ showProgressModal: false });
  }

  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.page.setData({
      [`formData.${field}`]: value
    });
  }

  onCategoryChange(e) {
    const index = e.detail.value;
    const category = this.page.data.categories[index];
    this.page.setData({
      categoryIndex: index,
      'formData.category': category
    });
  }

  onEditCategoryChange(e) {
    const index = e.detail.value;
    const category = this.page.data.categories[index];
    this.page.setData({
      editCategoryIndex: index,
      'formData.category': category
    });
  }

  onStartDateChange(e) {
    this.page.setData({
      'formData.startDate': e.detail.value
    });
  }

  onDateChange(e) {
    this.page.setData({
      'formData.finishedDate': e.detail.value
    });
  }

  stopPropagation() {}

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
          if (this.page.loadData) {
            this.page.loadData();
          }
        }
      }
    });
  }

  formatDateForInput(timestamp) {
    if (!timestamp) return getTodayString();
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

module.exports = {
  PageBase
};