# 代码质量规范

## 一、避免重复代码

### 1.1 方法重复定义
**问题描述**：在同一个文件中定义同名的方法，后定义的方法会覆盖前面的，导致前一个方法永远不会被执行，且增加维护负担。

**正确做法**：
```javascript
// pages/finished/finished.js
Page({
  // 只定义一次
  editBook(e) {
    // 方法实现
  },

  submitEditForm(e) {
    // 方法实现
  }
});
```

**错误做法**：
```javascript
Page({
  editBook(e) { /* ... */ },
  editBook(e) { /* 这个会覆盖上面的，永远不会执行 */ }
});
```

### 1.2 跨文件代码重复
**问题描述**：多个页面包含完全相同的代码片段（如分类数组、表单处理逻辑、加载逻辑等）。

**建议**：
- 将公共数据（如分类数组）统一放在 `app.js` 的 `globalData` 中
- 将公共方法提取到工具文件（如 `utils/bookHelper.js`）

## 二、代码组织原则

### 2.1 每个文件只定义一次
- 同一个变量不要重复声明
- 同一个方法不要重复定义
- 同一个组件不要重复注册

### 2.2 方法顺序
建议按以下顺序组织代码：
1. `data` 对象（页面状态）
2. `onLoad` 生命周期
3. `onShow` 生命周期
4. 数据加载方法（`loadXXXBooks`）
5. 表单相关方法（`showAddModal`, `showEditModal`, `hideModal` 等）
6. 业务逻辑方法（`addBook`, `editBook`, `deleteBook`, `moveToFinished` 等）
7. 辅助方法（`formatDate`, `getDaysPassed` 等）

### 2.3 分离 UI 和业务逻辑
**问题描述**：在页面 JS 文件中混合了数据处理、状态管理、UI 控制等多种逻辑，导致代码臃肿且难以维护。

**正确做法**：将业务逻辑和数据处理抽离到独立的模块

```javascript
// pages/index/index.js - 页面控制器（只负责 UI 交互）
const app = getApp();
const bookHelper = require('../../utils/bookHelper');

Page({
  data: {
    readingBooks: [],
    isLoading: true,
    showAddModal: false,
    // ...
  },

  onLoad() {
    this.setData({ isLoading: true });
    this.loadReadingBooks();
  },

  loadReadingBooks() {
    const books = app.getBooksByStatus('reading');
    const formattedBooks = bookHelper.formatBooksForDisplay(books);
    this.setData({
      readingBooks: formattedBooks,
      isLoading: false
    });
  },

  showAddModal() {
    this.setData({ showAddModal: true });
  },

  hideAddModal() {
    this.setData({ showAddModal: false, formData: { title: '', author: '', category: '' } });
  },

  onAddBook(e) {
    const formData = e.detail.value;
    bookHelper.validateBookData(formData);
    app.addBook({ ...formData, status: 'reading' });
    this.hideAddModal();
    this.loadReadingBooks();
  }
});
```

```javascript
// utils/bookHelper.js - 业务逻辑模块
const app = getApp();

module.exports = {
  formatBooksForDisplay(books) {
    return books.map(book => ({
      ...book,
      displayDays: this.calculateDays(book.startDate),
      formattedDate: this.formatDate(book.finishedAt)
    }));
  },

  calculateDays(startDate) {
    if (!startDate) return 0;
    const now = Date.now();
    const start = new Date(startDate).getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },

  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  },

  validateBookData(data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('书名不能为空');
    }
  }
};
```

**错误做法**：在页面 JS 中混合所有逻辑
```javascript
// pages/index/index.js - 不要这样做
Page({
  data: { /* ... */ },

  onLoad() {
    // 直接在 onLoad 中写所有逻辑
    const books = wx.getStorageSync('books') || [];
    const readingBooks = books.filter(b => b.status === 'reading');
    const formatted = readingBooks.map(book => {
      // 大量格式化逻辑
      const days = Math.floor((Date.now() - book.startDate) / (1000 * 60 * 60 * 24));
      return { ...book, days };
    });
    // ...
  }
});
```

### 2.4 数据状态管理
```javascript
data: {
  // 加载状态
  isLoading: true,  // 首次加载时为true，显示加载中

  // 数据列表
  books: [],

  // 模态框状态
  showAddModal: false,
  showEditModal: false,

  // 表单数据
  formData: { title: '', author: '', category: '' }
}
```

## 三、页面加载逻辑

### 3.1 加载状态控制
```javascript
onLoad() {
  this.setData({ isLoading: true });  // 显示加载中
  this.loadData();  // 加载数据
},

onShow() {
  this.loadData();  // 直接刷新数据，不显示加载状态
},

loadData() {
  const books = app.getBooksByStatus('reading');
  this.setData({
    books,
    isLoading: false  // 加载完成，隐藏加载状态
  });
}
```

### 3.2 避免闪烁
- 首次进入（onLoad）：显示加载状态，避免空列表闪烁
- 切换选项卡（onShow）：直接更新数据，不显示加载状态

## 四、变量命名规范

### 4.1 状态变量
| 变量名 | 用途 |
|--------|------|
| `isLoading` | 是否显示加载状态 |
| `showAddModal` | 是否显示添加模态框 |
| `showEditModal` | 是否显示编辑模态框 |
| `showMoreMenu` | 是否显示更多操作菜单 |
| `currentBookId` | 当前操作的书籍ID |

### 4.2 数据变量
| 变量名 | 用途 |
|--------|------|
| `readingBooks` | 在读书籍列表 |
| `finishedBooks` | 已读书籍列表 |
| `wishBooks` | 愿望单列表 |
| `groupedBooks` | 分组后的书籍（如按月份分组） |
| `formData` | 表单数据对象 |
| `categories` | 书籍分类数组 |

## 五、样式管理

### 5.1 全局样式优先
- 公共样式（如按钮、模态框、加号按钮）统一放在 `app.wxss`
- 页面特有样式放在对应的 `.wxss` 文件
- 避免在页面样式中重复定义全局已有的样式

### 5.2 CSS 变量使用
```css
/* app.wxss */
page {
  --color-primary: #4A90D9;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --border-radius: 8px;
}
```

### 5.3 模态框层级
```css
.modal-overlay {
  z-index: 1001;  /* 确保在最上层 */
}
```

## 六、数据管理

### 6.1 统一数据入口
所有对书籍数据的操作都通过 `app.js` 提供的方法：
- `app.loadBooks()` - 从本地存储加载数据
- `app.addBook(bookData)` - 添加书籍
- `app.updateBook(id, data)` - 更新书籍
- `app.deleteBook(id)` - 删除书籍
- `app.getBooksByStatus(status)` - 按状态获取书籍

### 6.2 避免硬编码
- 分类数组在 `app.js` 中定义一份，所有页面引用
- 设置项（如排序方式）保存在本地存储中

## 七、常见错误避免

### 7.1 条件判断错误
```javascript
// 错误：进度为0时会被当作"无进度"
if (book.progress) { /* ... */ }

// 正确：明确判断 undefined
if (book.progress !== undefined) { /* ... */ }
```

### 7.2 组件渲染错误
```javascript
// 错误：wx:if 在条件切换时组件会被销毁
<action-sheet wx:if="{{showMoreMenu}}" ... />

// 正确：使用 hidden 保持组件存在
<action-sheet hidden="{{!showMoreMenu}}" ... />
```

### 7.3 表单数据保存
```javascript
// 错误：丢失某些字段
app.updateBook(id, { title, author });  // category 丢失

// 正确：显式设置所有需要更新的字段
app.updateBook(id, {
  title,
  author,
  category: category || '',  // 确保 category 字段被保存
  totalPages
});
```

## 八、代码自检清单

在提交代码前，检查以下问题：

- [ ] 是否有重复的方法定义？
- [ ] 是否有未使用的变量或方法？
- [ ] 页面加载逻辑是否正确（onLoad 显示加载状态，onShow 直接刷新）？
- [ ] 表单数据是否完整保存（所有字段都要设置）？
- [ ] 条件判断是否正确（边界情况是否考虑）？
- [ ] 组件渲染是否使用正确的属性（wx:if vs hidden）？
- [ ] 公共样式是否放在全局样式文件中？
- [ ] 是否有调试代码（console.log）需要移除？
- [ ] 业务逻辑是否与 UI 代码分离（数据格式化、日期计算等应抽离到工具模块）？

## 九、项目结构

```
reading-helper/
├── app.js              # 全局数据管理
├── app.wxss             # 全局样式
├── app.json             # 全局配置
├── pages/
│   ├── index/           # 在读页面（只负责 UI 交互）
│   ├── finished/        # 已读页面（只负责 UI 交互）
│   ├── wishlist/        # 愿望单页面（只负责 UI 交互）
│   ├── profile/         # 我的页面（只负责 UI 交互）
│   └── settings/        # 设置页面（只负责 UI 交互）
├── utils/
│   └── bookHelper.js    # 书籍业务逻辑（数据格式化、验证等）
└── config/
    └── appConfig.js     # 应用配置（如小程序名称）
```

## 十、关键原则

1. **DRY 原则**（Don't Repeat Yourself）：不要重复自己
2. **单一职责原则**：每个方法只做一件事
3. **UI 与业务逻辑分离**：页面 JS 只负责 UI 交互，业务逻辑抽离到独立模块
4. **先读后写原则**：修改文件前先读取最新内容
5. **最小化修改原则**：只改需要改的部分，不要大面积重写
6. **测试验证原则**：修改后验证功能是否正常
