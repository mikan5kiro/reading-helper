// pages/finished/finished.js
const app = getApp();

Page({
  data: {
    groupedBooks: [],
    totalCount: 0,
    isLoading: false,
    showMoreMenu: false,
    showEditModal: false,
    currentBookId: '',
    categories: ['小说', '非小说', '传记', '历史', '科技', '商业', '心理学', '哲学', '艺术', '其他'],
    editCategoryIndex: -1,
    formData: {
      title: '',
      author: '',
      category: ''
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
      if (book.finishedAt) {
        const date = new Date(book.finishedAt);
        const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
        
        if (!groups[monthKey]) {
          groups[monthKey] = {
            month: monthKey,
            books: []
          };
        }
        
        const formattedBook = {
          ...book,
          finishedDateStr: this.formatFinishedDate(book.finishedAt)
        };
        
        groups[monthKey].books.push(formattedBook);
      }
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
  }
});