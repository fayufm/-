// renderer-patch.js
// 这个文件用于修补renderer.js中的函数，使其可以被其他脚本访问

// 当DOM内容加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 确保主渲染器已加载
  setTimeout(() => {
    // 创建一个全局renderNote函数的副本
    if (typeof window.renderNote !== 'function') {
      console.log('准备导出renderNote函数到全局作用域');
      
      // 从renderNotesList函数中获取renderNote函数
      if (typeof renderNotesList === 'function') {
        // 等待renderNotesList函数中的renderNote函数被定义
        // 在渲染第一个笔记列表时，创建一个全局引用
        const originalRenderNotesList = window.renderNotesList;
        
        window.renderNotesList = function(...args) {
          const result = originalRenderNotesList.apply(this, args);
          
          // 如果renderNote函数存在但尚未导出到window，则导出它
          setTimeout(() => {
            if (typeof renderNote === 'function' && typeof window.renderNote !== 'function') {
              window.renderNote = renderNote;
              console.log('renderNote函数已成功导出到全局作用域');
            }
          }, 100);
          
          return result;
        };
      }
    }
  }, 500);

  // 等待页面完全加载后执行
  setTimeout(() => {
    const addNoteBtn = document.getElementById('add-note-btn');
    
    if (addNoteBtn) {
      // 获取所有添加按钮的点击事件
      const clickEvents = addNoteBtn._events ? addNoteBtn._events.click : null;
      
      // 如果存在旧的点击事件（renderer.js中的handleAddButtonClick），移除它
      // 因为现在点击添加按钮应该显示菜单，而不是直接添加笔记
      if (clickEvents && typeof clickEvents === 'function') {
        // 克隆原始的handleAddButtonClick函数为全局变量，供add-menu.js调用
        window.originalHandleAddButtonClick = clickEvents;
        
        // 移除旧的事件处理程序
        addNoteBtn.removeEventListener('click', clickEvents);
        console.log('已移除添加按钮的原始点击事件');
      } else if (Array.isArray(clickEvents) && clickEvents.length > 0) {
        // 保存原始事件处理函数
        window.originalHandleAddButtonClick = clickEvents[0];
        
        // 移除所有旧的事件处理程序
        clickEvents.forEach(handler => {
          if (typeof handler === 'function') {
            addNoteBtn.removeEventListener('click', handler);
          }
        });
        console.log('已移除添加按钮的多个原始点击事件');
      }
    }
  }, 500); // 延迟500毫秒确保页面和其他脚本都已加载
});

// 渲染器补丁脚本，用于修复和增强原始渲染器功能
console.log('渲染器补丁脚本已加载');

// 在页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 等待一段时间确保其他脚本已加载
  setTimeout(applyPatches, 1500);
});

// 应用各种补丁
function applyPatches() {
  console.log('开始应用渲染器补丁...');
  
  // 增强笔记打开函数，添加事件通知
  patchOpenNoteFunction();
  
  // 增强笔记列表渲染函数，添加事件通知
  patchRenderNotesListFunction();
  
  // 增强颜色应用函数
  patchColorFunctions();
  
  console.log('渲染器补丁应用完成');
}

// 修补笔记打开函数
function patchOpenNoteFunction() {
  if (typeof window.openNote === 'function') {
    const originalOpenNote = window.openNote;
    window.openNote = async function(id) {
      const result = await originalOpenNote.apply(this, arguments);
      
      // 触发笔记打开事件
      document.dispatchEvent(new CustomEvent('noteOpened', {
        detail: { noteId: id, timestamp: Date.now() }
      }));
      
      console.log(`笔记打开事件已触发: ${id}`);
      return result;
    };
    console.log('笔记打开函数已修补');
  }
}

// 修补笔记列表渲染函数
function patchRenderNotesListFunction() {
  if (typeof window.renderNotesList === 'function') {
    const originalRenderNotesList = window.renderNotesList;
    window.renderNotesList = function(notes) {
      const result = originalRenderNotesList.apply(this, arguments);
      
      // 触发笔记列表更新事件
      document.dispatchEvent(new CustomEvent('noteListUpdated', {
        detail: { timestamp: Date.now() }
      }));
      
      console.log('笔记列表更新事件已触发');
      return result;
    };
    console.log('笔记列表渲染函数已修补');
  }
}

// 修补颜色相关函数
function patchColorFunctions() {
  // 确保颜色更新后自动同步到列表
  document.addEventListener('noteColorUpdated', (event) => {
    if (typeof window.updateListColors === 'function') {
      console.log('检测到颜色更新事件，将在300ms后同步列表颜色');
      setTimeout(window.updateListColors, 300);
    }
  });
  
  // 监听返回按钮点击
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (typeof window.updateListColors === 'function') {
        console.log('检测到返回按钮点击，将在500ms后同步列表颜色');
        setTimeout(window.updateListColors, 500);
      }
    });
  }
  
  // 监听笔记内容变化，以便在保存后更新颜色
  if (typeof window.saveNoteContent === 'function') {
    const originalSaveNoteContent = window.saveNoteContent;
    window.saveNoteContent = async function() {
      const result = await originalSaveNoteContent.apply(this, arguments);
      
      // 笔记内容保存后，可能需要更新颜色（例如，从空内容变为有内容，标题颜色才会显示）
      if (typeof window.updateListColors === 'function') {
        console.log('笔记内容已保存，将在500ms后同步列表颜色');
        setTimeout(window.updateListColors, 500);
      }
      
      return result;
    };
  }
  
  console.log('颜色相关函数已修补');
} 