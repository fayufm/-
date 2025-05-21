// 文体类型颜色修复脚本 (精简版 v2)
// 专门解决文体类型颜色与标题颜色冲突的问题
const { ipcRenderer } = require('electron');
console.log('[文体类型颜色修复-精简版] 脚本开始加载...');

// 在DOM完全加载后执行初始化
document.addEventListener('DOMContentLoaded', () => {
  // 延迟执行，确保其他脚本已加载
  setTimeout(initColorFix, 1000);
});

// 页面加载完成再次初始化
window.addEventListener('load', () => {
  setTimeout(initColorFix, 1500);
});

// 初始化所有修复
function initColorFix() {
  console.log('[文体类型颜色修复-精简版] 开始初始化...');
  
  // 完全禁用其他脚本中的样式和函数
  disableOtherScripts();
  
  // 移除所有可能存在的冲突样式
  removeConflictingStyles();
  
  // 添加新的样式规则
  addColorFixStyles();
  
  // 监听颜色更新事件
  setupEventListeners();
  
  // 修复应用笔记颜色的函数
  patchApplyTitleColorFunction();
  
  // 钩入DOM操作
  patchDOMFunctions();
  
  // 立即修复已存在的元素
  fixExistingElements();
  
  console.log('[文体类型颜色修复-精简版] 初始化完成');
}

// 禁用其他脚本中可能冲突的函数
function disableOtherScripts() {
  // 保存原始函数
  if (typeof window.originalApplyTitleColor === 'undefined' && 
      typeof window.applyTitleColor === 'function') {
    window.originalApplyTitleColor = window.applyTitleColor;
    console.log('[文体类型颜色修复-精简版] 已保存原始applyTitleColor函数');
  }
  
  // 保存原始的预览函数
  if (typeof window.originalPreviewTitleColor === 'undefined' && 
      typeof window.previewTitleColor === 'function') {
    window.originalPreviewTitleColor = window.previewTitleColor;
    console.log('[文体类型颜色修复-精简版] 已保存原始previewTitleColor函数');
  }
  
  // 保存原始的应用文体颜色函数
  if (typeof window.originalApplyGenreColor === 'undefined' && 
      typeof window.applyGenreColor === 'function') {
    window.originalApplyGenreColor = window.applyGenreColor;
    console.log('[文体类型颜色修复-精简版] 已保存原始applyGenreColor函数');
  }
  
  // 保存原始的预览文体颜色函数
  if (typeof window.originalPreviewGenreColor === 'undefined' && 
      typeof window.previewGenreColor === 'function') {
    window.originalPreviewGenreColor = window.previewGenreColor;
    console.log('[文体类型颜色修复-精简版] 已保存原始previewGenreColor函数');
  }
}

// 修复应用标题颜色的函数
function patchApplyTitleColorFunction() {
  // 如果函数不存在或已被修补，不重复执行
  if (!window.applyTitleColor || window.applyTitleColor.patchedByFixNew) {
    return;
  }
  
  // 保存原始引用
  const originalApplyTitleColor = window.applyTitleColor;
  
  // 重写函数
  window.applyTitleColor = async function() {
    // 调用原始函数
    const result = await originalApplyTitleColor.apply(this, arguments);
    
    // 在颜色应用后，立即修复文体类型颜色
    setTimeout(() => {
      if (window.currentNoteId) {
        fixGenreBadgeColors(window.currentNoteId);
      }
      
      // 可能还需要刷新整个列表
      setTimeout(fixExistingElements, 100);
    }, 50);
    
    return result;
  };
  
  // 标记为已修补
  window.applyTitleColor.patchedByFixNew = true;
  console.log('[文体类型颜色修复-精简版] 已修补applyTitleColor函数');
  
  // 同样修补预览函数
  if (typeof window.previewTitleColor === 'function') {
    const originalPreviewTitleColor = window.previewTitleColor;
    
    window.previewTitleColor = function(color) {
      // 调用原始函数
      originalPreviewTitleColor.apply(this, arguments);
      
      // 保存所有文体类型标签的颜色
      const titleDisplay = document.getElementById('note-title-display');
      if (titleDisplay) {
        const genreBadge = titleDisplay.querySelector('.genre-badge');
        if (genreBadge) {
          // 获取当前设置的颜色或使用自定义颜色变量
          const currentColor = genreBadge.style.getPropertyValue('--genre-color') || 
                              genreBadge.getAttribute('data-original-color');
          
          if (currentColor) {
            // 重新设置文体类型颜色，覆盖可能的继承
            genreBadge.style.setProperty('--genre-color', currentColor);
            genreBadge.style.color = currentColor;
          }
        }
      }
    };
    
    window.previewTitleColor.patchedByFixNew = true;
    console.log('[文体类型颜色修复-精简版] 已修补previewTitleColor函数');
  }
}

// 移除可能冲突的样式
function removeConflictingStyles() {
  // 查找并移除可能冲突的样式
  const styleIds = [
    'genre-color-fix-styles',
    'title-formatter-styles',
    'genre-color-styles'
  ];
  
  styleIds.forEach(id => {
    const styleElement = document.getElementById(id);
    if (styleElement) {
      styleElement.remove();
      console.log(`[文体类型颜色修复-精简版] 已移除样式: ${id}`);
    }
  });
}

// 添加新的样式规则
function addColorFixStyles() {
  // 移除之前的统一样式（如果存在）
  const existingStyle = document.getElementById('genre-color-fix-unified');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'genre-color-fix-unified';
  
  // 添加样式规则，使用强制选择器优先级
  styleElement.textContent = `
    /* 重置所有可能的样式继承 */
    .genre-badge {
      all: revert;
      
      /* 基本样式 */
      display: inline-block !important;
      margin-left: 8px !important;
      font-size: 0.8em !important;
      font-style: italic !important;
      font-family: 'Kaiti', 'STKaiti', 'FangSong', 'STFangSong', cursive !important;
      font-weight: normal !important;
      opacity: 0.9 !important;
      letter-spacing: 1px !important;
      text-shadow: 0px 0px 1px rgba(0,0,0,0.1) !important;
      transform: scale(0.9) !important;
      vertical-align: baseline !important;
      position: relative !important;
      top: -1px !important;
      border-left: 1px solid rgba(0,0,0,0.1) !important;
      padding-left: 8px !important;
      
      /* 最关键的修复：使用更高优先级选择器和CSS变量 */
      color: var(--genre-color, currentColor) !important;
      
      /* 完全阻断颜色继承 */
      color-scheme: light dark !important;
      forced-color-adjust: none !important;
      isolation: isolate !important;
    }
    
    /* 断开与父元素的颜色继承关系 - 使用非常高优先级的选择器 */
    h3 .genre-badge,
    .note-title-text .genre-badge,
    #note-title-display .genre-badge,
    .note-item .genre-badge,
    [class*="note"] .genre-badge,
    .genre-badge,
    body .genre-badge,
    html body .genre-badge,
    *[class] .genre-badge {
      /* 使用三重优先级选择器确保覆盖其他样式 */
      color: var(--genre-color, currentColor) !important;
    }
    
    /* 确保内联样式生效 */
    [style*="color"].genre-badge,
    .genre-badge[style*="color"],
    h3 .genre-badge[style*="color"],
    .note-title-text .genre-badge[style*="color"],
    #note-title-display .genre-badge[style*="color"],
    body .genre-badge[style*="color"] {
      /* 允许内联样式覆盖继承 */
      color: unset !important;
    }
    
    /* 暗色主题适配 */
    body.dark-theme .genre-badge {
      text-shadow: 0px 0px 1px rgba(255,255,255,0.2) !important;
      border-left: 1px solid rgba(255,255,255,0.1) !important;
    }
    
    /* 创建特殊的隔离容器 */
    .color-isolation-container {
      /* 完全断开与父级的颜色关系 */
      color: initial !important;
      display: contents !important;
      isolation: isolate !important;
    }
    
    /* 笔记列表项标题的颜色应用 */
    .note-item .note-title-text:not(.genre-badge) {
      color: var(--title-color, inherit);
    }
    
    /* 确保即使在颜色变化时也能保持文体类型标签的独立性 */
    @keyframes protect-genre-badge {
      from { color: var(--genre-color, currentColor) !important; }
      to { color: var(--genre-color, currentColor) !important; }
    }
    
    /* 应用动画确保颜色持续保持 */
    .genre-badge {
      animation: protect-genre-badge 1s infinite alternate;
      animation-play-state: running;
    }
  `;
  
  // 添加到文档头部，确保最高优先级
  document.head.appendChild(styleElement);
  console.log('[文体类型颜色修复-精简版] 已添加增强隔离的统一样式');
}

// 设置事件监听器
function setupEventListeners() {
  // 监听标题颜色更新事件
  document.addEventListener('titleColorUpdated', (event) => {
    if (event.detail && event.detail.noteId) {
      // 延迟执行，确保其他变更已完成
      setTimeout(() => {
        fixGenreBadgeColors(event.detail.noteId);
        // 同时可能需要修复整个列表
        fixExistingElements();
      }, 100);
    }
  });
  
  // 监听文体类型颜色更新事件
  document.addEventListener('genreColorUpdated', (event) => {
    if (event.detail && event.detail.noteId) {
      // 立即应用文体类型颜色
      setTimeout(() => {
        fixGenreBadgeColors(event.detail.noteId);
      }, 50);
    }
  });
  
  // 监听笔记打开事件
  document.addEventListener('noteOpened', (event) => {
    if (event.detail && event.detail.noteId) {
      setTimeout(() => {
        fixGenreBadgeColors(event.detail.noteId);
      }, 100);
    }
  });
  
  // 监听笔记列表更新事件
  document.addEventListener('noteListUpdated', () => {
    setTimeout(fixExistingElements, 200);
  });
  
  // 定期强制刷新颜色
  setInterval(() => {
    console.log('[文体类型颜色修复-精简版] 定期刷新所有颜色');
    fixExistingElements();
  }, 5000);
  
  // 监听DOM变化，捕获动态添加的元素
  const observer = new MutationObserver((mutations) => {
    let needsFixing = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // 检查是否添加了相关元素
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && (
              node.classList?.contains('note-item') ||
              node.id === 'note-title-display' ||
              node.querySelector?.('.genre-badge')
            )) {
            needsFixing = true;
            break;
          }
        }
      }
    });
    
    if (needsFixing) {
      fixExistingElements();
    }
  });
  
  // 开始观察整个文档
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('[文体类型颜色修复-精简版] 已设置更全面的事件监听器');
}

// 修复指定笔记ID的文体类型标签颜色
async function fixGenreBadgeColors(noteId) {
  try {
    if (!noteId) return;
    
    // 获取笔记数据
    const note = await ipcRenderer.invoke('get-note', noteId);
    if (!note || !note.metadata || !note.metadata.genreColor) return;
    
    const genreColor = note.metadata.genreColor;
    
    // 修复编辑器中的标题
    const titleDisplay = document.getElementById('note-title-display');
    if (titleDisplay) {
      const genreBadge = titleDisplay.querySelector('.genre-badge');
      if (genreBadge) {
        // 保存原始颜色以便后续恢复
        genreBadge.setAttribute('data-original-color', genreColor);
        // 设置CSS变量和直接颜色
        genreBadge.style.setProperty('--genre-color', genreColor);
        genreBadge.style.color = genreColor;
        
        // 为确保与父元素完全隔离，可以使用隔离容器
        if (!genreBadge.parentElement.classList.contains('color-isolation-container')) {
          // 将文体类型标签包装在隔离容器中
          const wrapper = document.createElement('span');
          wrapper.className = 'color-isolation-container';
          genreBadge.parentNode.insertBefore(wrapper, genreBadge);
          wrapper.appendChild(genreBadge);
        }
      }
    }
    
    // 修复列表中的标题
    const noteItem = document.querySelector(`.note-item[data-id="${noteId}"]`);
    if (noteItem) {
      const genreBadge = noteItem.querySelector('.genre-badge');
      if (genreBadge) {
        // 保存原始颜色
        genreBadge.setAttribute('data-original-color', genreColor);
        // 设置CSS变量和直接颜色
        genreBadge.style.setProperty('--genre-color', genreColor);
        genreBadge.style.color = genreColor;
        
        // 同样添加隔离容器
        if (!genreBadge.parentElement.classList.contains('color-isolation-container')) {
          const wrapper = document.createElement('span');
          wrapper.className = 'color-isolation-container';
          genreBadge.parentNode.insertBefore(wrapper, genreBadge);
          wrapper.appendChild(genreBadge);
        }
      }
    }
  } catch (error) {
    console.error('[文体类型颜色修复-精简版] 修复颜色出错:', error);
  }
}

// 修复所有现有元素
async function fixExistingElements() {
  console.log('[文体类型颜色修复-精简版] 修复所有现有元素...');
  
  try {
    // 获取所有笔记数据
    const notes = await ipcRenderer.invoke('get-notes');
    if (!notes || !Array.isArray(notes)) return;
    
    // 处理当前打开的笔记
    if (window.currentNoteId) {
      await fixGenreBadgeColors(window.currentNoteId);
    }
    
    // 处理列表中的所有笔记
    const noteItems = document.querySelectorAll('.note-item');
    for (const noteItem of noteItems) {
      const noteId = noteItem.dataset.id;
      if (noteId) {
        const note = findNoteById(notes, noteId);
        if (note && note.metadata && note.metadata.genreColor) {
          const genreBadge = noteItem.querySelector('.genre-badge');
          if (genreBadge) {
            // 保存原始颜色
            genreBadge.setAttribute('data-original-color', note.metadata.genreColor);
            // 设置CSS变量和直接颜色
            genreBadge.style.setProperty('--genre-color', note.metadata.genreColor);
            genreBadge.style.color = note.metadata.genreColor;
            
            // 为确保与父元素完全隔离，添加隔离容器
            if (!genreBadge.parentElement.classList.contains('color-isolation-container')) {
              const wrapper = document.createElement('span');
              wrapper.className = 'color-isolation-container';
              genreBadge.parentNode.insertBefore(wrapper, genreBadge);
              wrapper.appendChild(genreBadge);
            }
          }
        }
        
        // 同时处理标题颜色
        if (note && note.metadata && note.metadata.titleColor) {
          const titleElement = noteItem.querySelector('.note-title-text');
          if (titleElement) {
            titleElement.style.color = note.metadata.titleColor;
          }
        }
      }
    }
  } catch (error) {
    console.error('[文体类型颜色修复-精简版] 修复现有元素出错:', error);
  }
}

// 递归查找笔记
function findNoteById(notes, id) {
  // 直接在顶层查找
  const directMatch = notes.find(note => note.id === id);
  if (directMatch) return directMatch;
  
  // 递归搜索子笔记
  for (const note of notes) {
    if (note.children && Array.isArray(note.children) && note.children.length > 0) {
      const childMatch = findNoteById(note.children, id);
      if (childMatch) return childMatch;
    }
  }
  
  return null;
}

// 导出全局使用的updateListColors函数
window.updateListColors = function() {
  console.log('[文体类型颜色修复-精简版] 调用了updateListColors函数');
  fixExistingElements();
  return true;
};

// 钩入DOM操作以拦截文体类型标签创建
function patchDOMFunctions() {
  // 保存原始的appendChild方法
  const originalAppendChild = Element.prototype.appendChild;
  
  // 替换appendChild方法
  Element.prototype.appendChild = function(node) {
    // 调用原始方法
    const result = originalAppendChild.call(this, node);
    
    // 检查是否添加了文体类型标签
    if (node && node.nodeType === 1 && 
        (node.classList?.contains('genre-badge') || 
         node.querySelector?.('.genre-badge'))) {
      
      // 延迟处理以确保所有属性都已设置
      setTimeout(() => {
        // 如果是文体类型标签本身
        if (node.classList?.contains('genre-badge')) {
          processGenreBadge(node);
        } 
        // 如果是包含文体类型标签的容器
        else if (node.querySelector?.('.genre-badge')) {
          const badges = node.querySelectorAll('.genre-badge');
          badges.forEach(badge => processGenreBadge(badge));
        }
      }, 0);
    }
    
    // 检查是否添加了笔记列表项
    if (node && node.nodeType === 1 && node.classList?.contains('note-item')) {
      const noteId = node.dataset?.id;
      if (noteId) {
        // 查找标题文本元素并应用笔记颜色
        setTimeout(async () => {
          try {
            const note = await ipcRenderer.invoke('get-note', noteId);
            if (note && note.metadata) {
              const titleElement = node.querySelector('.note-title-text');
              // 应用标题颜色
              if (titleElement && note.metadata.titleColor) {
                titleElement.style.color = note.metadata.titleColor;
                titleElement.style.setProperty('--title-color', note.metadata.titleColor);
              }
              
              // 处理文体类型标签
              const genreBadge = node.querySelector('.genre-badge');
              if (genreBadge && note.metadata.genreColor) {
                processGenreBadge(genreBadge, note.metadata.genreColor);
              }
            }
          } catch (error) {
            console.error('[文体类型颜色修复-精简版] 处理列表项出错:', error);
          }
        }, 5);
      }
    }
    
    return result;
  };
  
  // 标记为已修补
  Element.prototype.appendChild.patchedByFixNew = true;
  console.log('[文体类型颜色修复-精简版] 已钩入DOM appendChild方法');
  
  // 可以类似地修补其他可能创建或修改文体类型标签的方法
  // 例如insertBefore、replaceChild等
}

// 处理文体类型标签
function processGenreBadge(badge, explicitColor = null) {
  if (!badge) return;
  
  try {
    // 查找包含此标签的笔记项
    const noteItem = findParentByClass(badge, 'note-item');
    const noteId = noteItem?.dataset?.id || window.currentNoteId;
    
    // 如果有明确的颜色，直接应用
    if (explicitColor) {
      applyColorToBadge(badge, explicitColor);
      return;
    }
    
    // 否则，尝试从笔记元数据获取颜色
    if (noteId) {
      ipcRenderer.invoke('get-note', noteId).then(note => {
        if (note && note.metadata && note.metadata.genreColor) {
          applyColorToBadge(badge, note.metadata.genreColor);
        }
      }).catch(error => {
        console.error('[文体类型颜色修复-精简版] 获取笔记元数据出错:', error);
      });
    }
  } catch (error) {
    console.error('[文体类型颜色修复-精简版] 处理文体类型标签出错:', error);
  }
}

// 应用颜色到文体类型标签
function applyColorToBadge(badge, color) {
  // 保存原始颜色
  badge.setAttribute('data-original-color', color);
  
  // 应用颜色的两种方式，确保覆盖
  badge.style.setProperty('--genre-color', color);
  badge.style.color = color;
  
  // 添加隔离容器
  if (!badge.parentElement.classList.contains('color-isolation-container')) {
    const wrapper = document.createElement('span');
    wrapper.className = 'color-isolation-container';
    badge.parentNode.insertBefore(wrapper, badge);
    wrapper.appendChild(badge);
  }
}

// 查找具有特定类的父元素
function findParentByClass(element, className) {
  let current = element;
  while (current && current !== document.body) {
    if (current.classList && current.classList.contains(className)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

console.log('[文体类型颜色修复-精简版] 脚本加载完成'); 