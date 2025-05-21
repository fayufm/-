// 处理对话框中的添加父级按钮
document.addEventListener('DOMContentLoaded', () => {
  const addParentBtn = document.getElementById('add-parent-btn');
  
  if (!addParentBtn) {
    console.error('找不到添加父级按钮');
    return;
  }
  
  // 添加点击事件
  addParentBtn.addEventListener('click', () => {
    // 获取对话框标题元素
    const addDialogTitle = document.getElementById('add-dialog-title');
    
    if (addDialogTitle) {
      // 切换标题文本
      if (addDialogTitle.textContent === '添加新父级笔记') {
        addDialogTitle.textContent = '添加新笔记';
        addParentBtn.classList.remove('active');
      } else {
        addDialogTitle.textContent = '添加新父级笔记';
        addParentBtn.classList.add('active');
      }
      
      // 设置全局标志，表示是否添加为父级笔记
      window.isAddingSubnote = addDialogTitle.textContent !== '添加新父级笔记';
      
      // 如果有handleAddParentButtonClick函数，调用它
      if (typeof handleAddParentButtonClick === 'function') {
        handleAddParentButtonClick();
      }
    }
  });
  
  console.log('添加父级按钮功能已初始化');
}); 