// pages/profile/profile.js
const app = getApp();
const appConfig = require('../../config/appConfig.js');

Page({
  data: {
    appName: appConfig.appName,
    stats: {
      reading: 0,
      finished: 0,
      wish: 0
    }
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  loadStats() {
    try {
      const stats = app.getBookStats();
      this.setData({ 
        stats: stats || { reading: 0, finished: 0, wish: 0 }
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
      this.setData({ 
        stats: { reading: 0, finished: 0, wish: 0 }
      });
    }
  },

  onFeedback() {
    wx.showToast({
      title: '暂不支持',
      icon: 'none'
    });
  },

  onAbout() {
    wx.showModal({
      title: '关于' + appConfig.appName,
      content: appConfig.appName + '是一款帮助您追踪和管理阅读进度的小程序。\n\n核心功能：\n• 同时管理多本书的阅读进度\n• 分段式进度标记，快速调节阅读状态\n• 按状态分类管理书籍（在读/已读/愿望单）\n• 本地数据存储，安全可靠\n\n温馨提示：\n所有数据均保存在本地，不会同步到服务器。请勿删除小程序的缓存或数据，否则将导致您的阅读记录丢失。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});