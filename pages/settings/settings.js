// pages/settings/settings.js
const app = getApp();

Page({
  data: {
    sortByStartDate: true // 默认按开始阅读时间排序
  },

  onLoad() {
    // 从本地存储读取设置
    this.loadSettings();
  },

  loadSettings() {
    try {
      const settings = wx.getStorageSync('readingHelperSettings');
      if (settings) {
        this.setData({
          sortByStartDate: settings.sortByStartDate !== false // 默认为true
        });
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  onSortChange(e) {
    const sortByStartDate = e.detail.value;
    this.setData({ sortByStartDate });
    
    // 保存设置到本地存储
    try {
      wx.setStorageSync('readingHelperSettings', {
        sortByStartDate
      });
      
      // 显示保存成功提示
      wx.showToast({
        title: '设置已保存',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存设置失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  }
});