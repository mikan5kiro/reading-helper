// pages/wishlist/wishlist.js
const app = getApp();

Page({
  data: {
    wishBooks: [],
    isLoading: true,
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
    this.loadWishBooks();
  },

  onShow() {
    this.loadWishBooks();
  },

  loadWishBooks() {
    this.setData({ isLoading: true });
    
    setTimeout(() => {
      try {
        const wishBooks = app.getBooksByStatus('wish');
        // 按创建时间降序排序，新添加的书籍排在前面
        const sortedBooks = (wishBooks || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        this.setData({
          wishBooks: sortedBooks,
          isLoading: false
        });
      } catch (error) {
        console.error('加载愿望单书籍失败:', error);
        this.setData({ 
          wishBooks: [],
          isLoading: false 
        });
      }
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
          this.loadWishBooks();
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
    
    this.loadWishBooks();
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