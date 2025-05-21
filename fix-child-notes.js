// 修复子级笔记创建问题
document.addEventListener('DOMContentLoaded', () => {
  console.log('正在应用子级笔记修复...');
  
  // 检查关键变量
  setTimeout(() => {
    // 修复变量声明问题
    if (typeof selectedOutlineId === 'undefined' && typeof window.selectedOutlineId !== 'undefined') {
      console.log('修复selectedOutlineId全局变量问题');
      window.selectedOutlineId = window.selectedOutlineId || null;
    }
    
    if (typeof selectedNoteLevel === 'undefined' && typeof window.selectedNoteLevel !== 'undefined') {
      console.log('修复selectedNoteLevel全局变量问题');
      window.selectedNoteLevel = window.selectedNoteLevel || 1;
    }
    
    if (typeof isAddingSubnote === 'undefined' && typeof window.isAddingSubnote !== 'undefined') {
      console.log('修复isAddingSubnote全局变量问题');
      window.isAddingSubnote = window.isAddingSubnote || false;
    }
    
    // 监听点击事件，确保正确设置选中状态
    const notesList = document.getElementById('notes-list');
    if (notesList) {
      notesList.addEventListener('click', (e) => {
        // 找到最近的.note-item父元素
        const noteItem = e.target.closest('.note-item');
        
        // 如果找到note-item元素且不是点击了删除按钮或展开/折叠图标
        if (noteItem && 
            !e.target.classList.contains('delete-btn') && 
            !e.target.classList.contains('outline-toggle')) {
          
          // 获取笔记ID和层级
          const id = noteItem.dataset.id;
          const level = parseInt(noteItem.dataset.level) || 1;
          const type = noteItem.dataset.type || 'outline';
          
          console.log(`点击了笔记: ID=${id}, 层级=${level}, 类型=${type}`);
          
          // 手动设置全局变量
          window.selectedOutlineId = id;
          window.selectedNoteLevel = level;
          window.selectedNoteType = type;
        }
      });
    }
    
    // 修复添加父级按钮的逻辑
    const addParentBtn = document.getElementById('add-parent-btn');
    if (addParentBtn) {
      // 移除原有的点击事件（可能导致冲突）
      const oldClickListeners = addParentBtn.getEventListeners?.('click') || [];
      if (oldClickListeners.length > 0) {
        console.log('正在移除旧的点击事件监听器');
        oldClickListeners.forEach(listener => {
          addParentBtn.removeEventListener('click', listener);
        });
      }
      
      // 添加新的点击事件
      addParentBtn.addEventListener('click', () => {
        console.log('点击了添加父级按钮');
        
        // 设置为添加父级模式（非子笔记）
        window.isAddingSubnote = false;
        
        // 获取对话框标题元素
        const addDialogTitle = document.getElementById('add-dialog-title');
        if (addDialogTitle) {
          addDialogTitle.textContent = '添加新父级笔记';
        }
      });
    }
    
    // 修复添加按钮的逻辑
    const addNoteBtn = document.getElementById('add-note-btn');
    if (addNoteBtn) {
      // 重新实现添加按钮的点击处理逻辑
      addNoteBtn.addEventListener('click', async () => {
        const addDialogTitle = document.getElementById('add-dialog-title');
        const addNoteDialog = document.getElementById('add-note-dialog');
        
        // 检查是否有选中的笔记
        if (window.selectedOutlineId) {
          // 为选中的笔记添加子级
          window.isAddingSubnote = true;
          
          try {
            // 获取选中笔记的信息，显示父笔记的标题
            const { ipcRenderer } = require('electron');
            const parentNote = await ipcRenderer.invoke('get-note', window.selectedOutlineId);
            
            if (parentNote && parentNote.title) {
              console.log(`为笔记 "${parentNote.title}" 添加子级`);
              addDialogTitle.textContent = `为"${parentNote.title}"添加小标题`;
            } else {
              addDialogTitle.textContent = '添加小标题';
            }
          } catch (error) {
            console.error('获取父笔记信息失败:', error);
            addDialogTitle.textContent = '添加小标题';
          }
        } else {
          // 没有选中笔记，添加顶级笔记
          window.isAddingSubnote = false;
          addDialogTitle.textContent = '添加新笔记';
        }
        
        // 显示添加笔记对话框
        if (addNoteDialog) {
          addNoteDialog.classList.remove('hidden');
          
          // 获取输入框并聚焦
          const noteTitleInput = document.getElementById('note-title-input');
          if (noteTitleInput) {
            noteTitleInput.value = '';
            noteTitleInput.focus();
          }
        }
      });
    }
    
    console.log('子级笔记修复应用完成');
  }, 1000); // 延迟1秒执行，确保其他脚本已加载
}); 