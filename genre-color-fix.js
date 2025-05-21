// 文体类型颜色修复脚本
// 解决文体类型颜色与标题颜色冲突的问题
const { ipcRenderer } = require('electron');
console.log('[文体类型颜色修复] 脚本开始加载...');

// 在DOM完全加载后执行初始化
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initGenreColorFix, 1000);
});

// 页面加载完成后再次初始化，以防万一
window.addEventListener('load', () => {
  setTimeout(initGenreColorFix, 1500);
});

// 初始化文体类型颜色修复
function initGenreColorFix() {
  console.log('[文体类型颜色修复] 开始初始化...');
  
  // 添加优先级更高的CSS规则
  addGenreColorFixStyles();
  
  // 修复笔记打开时应用的文体类型颜色
  patchOpenNoteFunction();
  
  // 监听标题颜色更新事件
  listenForTitleColorUpdates();
  
  // 立即处理现有的标题
  fixExistingGenreBadges();
  
  // 添加对笔记列表渲染的监听
  listenForNoteListUpdate();
  
  // 定义全局的updateListColors函数
  defineUpdateListColorsFunction();
  
  console.log('[文体类型颜色修复] 初始化完成');
}

// 定义全局的updateListColors函数
function defineUpdateListColorsFunction() {
  // 如果函数已存在，不覆盖
  if (typeof window.updateListColors === 'function') {
    console.log('[文体类型颜色修复] updateListColors函数已存在，不重新定义');
    return;
  }
  
  // 创建并导出函数到全局作用域
  window.updateListColors = async function() {
    console.log('[文体类型颜色修复] 开始更新列表颜色...');
    
    try {
      // 获取所有笔记
      const notes = await ipcRenderer.invoke('get-notes');
      if (!notes || !Array.isArray(notes)) {
        console.warn('[文体类型颜色修复] 无法获取笔记列表或格式错误');
        return;
      }
      
      // 处理所有笔记项
      const noteItems = document.querySelectorAll('.note-item');
      for (const noteItem of noteItems) {
        const noteId = noteItem.dataset.id;
        if (!noteId) continue;
        
        // 查找对应的笔记数据
        const noteData = findNoteById(notes, noteId);
        if (!noteData) continue;
        
        // 应用颜色设置
        applyNoteColorToElement(noteData, noteItem);
      }
      
      console.log('[文体类型颜色修复] 列表颜色更新完成');
    } catch (error) {
      console.error('[文体类型颜色修复] 更新列表颜色出错:', error);
    }
  };
  
  console.log('[文体类型颜色修复] 已定义updateListColors函数');
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

// 为笔记元素应用颜色
function applyNoteColorToElement(note, noteItem) {
  if (!note || !note.metadata || !noteItem) return;
  
  // 应用背景颜色
  if (note.metadata.bgColor) {
    noteItem.style.backgroundColor = note.metadata.bgColor;
    noteItem.classList.add('custom-bg');
  }
  
  // 应用标题颜色
  const titleElement = noteItem.querySelector('.note-title-text');
  if (titleElement && note.metadata.titleColor) {
    const hasContent = note.content && note.content.trim() !== '';
    
    // 只在有内容时应用标题颜色
    if (hasContent) {
      titleElement.style.color = note.metadata.titleColor;
    }
  }
  
  // 应用文体类型颜色
  const genreBadge = noteItem.querySelector('.genre-badge');
  if (genreBadge && note.metadata.genreColor) {
    genreBadge.style.setProperty('--genre-color', note.metadata.genreColor);
    genreBadge.style.color = note.metadata.genreColor;
  }
}

// 监听笔记列表更新事件
function listenForNoteListUpdate() {
  console.log('[文体类型颜色修复] 设置笔记列表更新监听...');
  
  // 监听列表更新事件
  document.addEventListener('noteListUpdated', () => {
    console.log('[文体类型颜色修复] 检测到笔记列表更新');
    
    // 延迟处理，确保DOM已经更新
    setTimeout(() => {
      fixExistingGenreBadges();
    }, 200);
  });
  
  // DOM变化监视器，捕获可能的列表变化
  const observer = new MutationObserver((mutations) => {
    let noteListChanged = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && 
          (mutation.target.id === 'notes-list' || 
           mutation.target.classList.contains('subnotes-container'))) {
        noteListChanged = true;
      }
    });
    
    if (noteListChanged) {
      console.log('[文体类型颜色修复] 检测到笔记列表DOM变化');
      
      // 延迟处理，确保整个DOM变化已完成
      setTimeout(() => {
        fixExistingGenreBadges();
      }, 200);
    }
  });
  
  // 开始观察笔记列表区域
  const notesList = document.getElementById('notes-list');
  if (notesList) {
    observer.observe(notesList, {
      childList: true,
      subtree: true
    });
    console.log('[文体类型颜色修复] 已设置笔记列表DOM观察器');
  }
}

// 补丁函数：重写打开笔记函数，确保文体类型颜色正确
function patchOpenNoteFunction() {
  console.log('[文体类型颜色修复] 正在修补openNote函数...');
  
  // 保存原始的打开笔记函数
  if (typeof window.originalOpenNoteForGenreColor === 'undefined' && 
      typeof window.openNote === 'function') {
    window.originalOpenNoteForGenreColor = window.openNote;
  }
  
  // 如果我们已经完成了替换，则不再继续
  if (window.openNote && window.openNote.genreColorPatched) {
    return;
  }
  
  // 如果原始函数存在，覆盖它
  if (typeof window.originalOpenNoteForGenreColor === 'function') {
    window.openNote = async function(id) {
      // 调用原始函数
      await window.originalOpenNoteForGenreColor(id);
      
      // 延迟执行，以确保其他脚本已经应用了样式
      setTimeout(() => {
        // 修复文体类型颜色
        fixNoteDisplayGenreColor(id);
      }, 100);
    };
    
    // 标记函数已被补丁
    window.openNote.genreColorPatched = true;
    
    console.log('[文体类型颜色修复] openNote函数已修补');
  } else {
    console.warn('[文体类型颜色修复] 无法找到openNote函数');
  }
}

// 监听标题颜色更新事件
function listenForTitleColorUpdates() {
  console.log('[文体类型颜色修复] 监听标题颜色更新事件...');
  
  // 监听标题颜色更新事件
  document.addEventListener('titleColorUpdated', (event) => {
    if (event.detail && event.detail.noteId) {
      console.log('[文体类型颜色修复] 检测到标题颜色更新事件');
      
      // 延迟执行，以确保标题颜色已经应用
      setTimeout(() => {
        fixNoteDisplayGenreColor(event.detail.noteId);
      }, 100);
    }
  });
  
  // 监听文体类型颜色更新事件
  document.addEventListener('genreColorUpdated', (event) => {
    if (event.detail && event.detail.noteId) {
      console.log('[文体类型颜色修复] 检测到文体类型颜色更新事件');
      
      // 立即应用保持与应用文体颜色逻辑一致
      setTimeout(() => {
        fixNoteDisplayGenreColor(event.detail.noteId);
      }, 50);
    }
  });
  
  console.log('[文体类型颜色修复] 事件监听器已设置');
}

// 修复特定笔记的文体类型颜色
async function fixNoteDisplayGenreColor(noteId) {
  console.log(`[文体类型颜色修复] 修复笔记 ${noteId} 的文体类型颜色...`);
  
  if (!noteId) {
    return;
  }
  
  try {
    // 获取笔记元数据
    const note = await ipcRenderer.invoke('get-note', noteId);
    if (!note || !note.metadata || !note.metadata.genreColor) {
      return; // 没有设置文体类型颜色
    }
    
    const genreColor = note.metadata.genreColor;
    
    // 修复编辑器中的标题
    const titleDisplay = document.getElementById('note-title-display');
    if (titleDisplay) {
      const genreBadge = titleDisplay.querySelector('.genre-badge');
      if (genreBadge) {
        genreBadge.style.setProperty('--genre-color', genreColor);
        genreBadge.style.color = genreColor;
        console.log(`[文体类型颜色修复] 已修复编辑器中的文体类型颜色: ${genreColor}`);
      }
    }
    
    // 修复列表中的标题
    const noteItem = document.querySelector(`.note-item[data-id="${noteId}"]`);
    if (noteItem) {
      const titleElement = noteItem.querySelector('.note-title-text');
      if (titleElement) {
        const genreBadge = titleElement.querySelector('.genre-badge');
        if (genreBadge) {
          genreBadge.style.setProperty('--genre-color', genreColor);
          genreBadge.style.color = genreColor;
          console.log(`[文体类型颜色修复] 已修复列表中的文体类型颜色: ${genreColor}`);
        }
      }
    }
  } catch (error) {
    console.error('[文体类型颜色修复] 修复文体类型颜色时出错:', error);
  }
}

// 修复所有现有的文体类型标签
async function fixExistingGenreBadges() {
  console.log('[文体类型颜色修复] 修复所有现有的文体类型标签...');
  
  // 获取所有笔记项
  const noteItems = document.querySelectorAll('.note-item');
  for (const noteItem of noteItems) {
    const noteId = noteItem.dataset.id;
    if (noteId) {
      await fixNoteDisplayGenreColor(noteId);
    }
  }
  
  // 修复当前打开的笔记
  if (window.currentNoteId) {
    await fixNoteDisplayGenreColor(window.currentNoteId);
  }
  
  console.log('[文体类型颜色修复] 所有文体类型标签已处理');
}

// 添加强制性的CSS样式
function addGenreColorFixStyles() {
  console.log('[文体类型颜色修复] 添加CSS样式...');
  
  // 移除旧的样式（如果存在）
  const existingStyle = document.getElementById('genre-color-fix-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'genre-color-fix-styles';
  styleElement.textContent = `
    /* 最关键的修复：确保文体类型标签使用自己的颜色 */
    .genre-badge {
      /* 使用CSS变量存储文体类型颜色 */
      color: var(--genre-color, inherit) !important;
      /* 确保与父元素分离 */
      transition: color 0.2s ease !important;
    }
    
    /* 避免继承父元素的文本颜色，强制使用设置的颜色 */
    .note-title-text .genre-badge,
    #note-title-display .genre-badge,
    .note-item .genre-badge,
    h3 .genre-badge {
      color: var(--genre-color, inherit) !important;
    }
    
    /* 确保内联样式生效 */
    .genre-badge[style*="color"] {
      color: unset !important;
    }
    
    /* 确保在暗色主题下仍有足够对比度 */
    body.dark-theme .genre-badge {
      color: var(--genre-color, inherit) !important;
      text-shadow: 0px 0px 1px rgba(255,255,255,0.3) !important;
    }
    
    /* 确保文体类型标签与标题样式分离 */
    .note-title-text,
    #note-title-display,
    .note-item h3 {
      color-scheme: inherit;
    }
  `;
  
  // 添加样式到文档头部，确保优先级最高
  document.head.appendChild(styleElement);
  
  console.log('[文体类型颜色修复] CSS样式已添加');
}

console.log('[文体类型颜色修复] 脚本加载完成'); 