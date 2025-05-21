// 标题格式化处理脚本
console.log('[标题格式化] 脚本开始加载...');

// 在DOM完全加载后执行初始化
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initTitleFormatter, 1000);
});

// 页面加载完成后再次初始化，以防万一
window.addEventListener('load', () => {
  setTimeout(initTitleFormatter, 1500);
});

// 初始化标题格式化功能
function initTitleFormatter() {
  console.log('[标题格式化] 开始初始化...');
  
  // 替换原始的渲染笔记函数
  patchRenderNotesListFunction();
  
  // 替换原始的打开笔记函数
  patchOpenNoteFunction();
  
  // 监听DOM变化，处理动态添加的元素
  setupMutationObserver();
  
  // 添加格式化标题的样式
  addTitleFormattingStyles();
  
  // 立即处理现有的标题
  formatExistingTitles();
  
  console.log('[标题格式化] 初始化完成');
}

// 补丁函数：重写渲染笔记列表函数
function patchRenderNotesListFunction() {
  console.log('[标题格式化] 正在修补renderNotesList函数...');
  
  // 保存原始的渲染函数
  if (typeof window.originalRenderNotesList === 'undefined' && 
      typeof window.renderNotesList === 'function') {
    window.originalRenderNotesList = window.renderNotesList;
  }
  
  // 如果我们已经完成了替换，则不再继续
  if (window.renderNotesList && window.renderNotesList.patched) {
    return;
  }
  
  // 如果原始函数存在，覆盖它
  if (typeof window.originalRenderNotesList === 'function') {
    window.renderNotesList = function(notes) {
      // 调用原始函数
      window.originalRenderNotesList(notes);
      
      // 处理所有标题
      formatExistingTitles();
    };
    
    // 标记函数已被补丁
    window.renderNotesList.patched = true;
    
    console.log('[标题格式化] renderNotesList函数已修补');
  } else {
    console.warn('[标题格式化] 无法找到renderNotesList函数');
  }
}

// 补丁函数：重写打开笔记函数
function patchOpenNoteFunction() {
  console.log('[标题格式化] 正在修补openNote函数...');
  
  // 保存原始的打开笔记函数
  if (typeof window.originalOpenNote === 'undefined' && 
      typeof window.openNote === 'function') {
    window.originalOpenNote = window.openNote;
  }
  
  // 如果我们已经完成了替换，则不再继续
  if (window.openNote && window.openNote.patched) {
    return;
  }
  
  // 如果原始函数存在，覆盖它
  if (typeof window.originalOpenNote === 'function') {
    window.openNote = async function(id) {
      // 调用原始函数
      await window.originalOpenNote(id);
      
      // 专门处理笔记标题显示
      formatNoteDisplayTitle();
    };
    
    // 标记函数已被补丁
    window.openNote.patched = true;
    
    console.log('[标题格式化] openNote函数已修补');
  } else {
    console.warn('[标题格式化] 无法找到openNote函数');
  }
}

// 设置DOM变化观察器，监视标题元素的添加
function setupMutationObserver() {
  console.log('[标题格式化] 设置DOM变化观察器...');
  
  // 如果已经设置过观察器，不再重复设置
  if (window._titleFormatterObserver) {
    return;
  }
  
  // 创建观察器
  const observer = new MutationObserver((mutations) => {
    let shouldProcessTitles = false;
    
    // 检查是否有标题元素变化
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // 检查添加的节点是否包含标题元素
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // 元素节点
            if (node.querySelector && 
                (node.querySelector('.note-title-text') || 
                 node.id === 'note-title-display')) {
              shouldProcessTitles = true;
            }
          }
        });
      }
    });
    
    // 如果有标题元素变化，处理所有标题
    if (shouldProcessTitles) {
      formatExistingTitles();
    }
  });
  
  // 开始观察文档的变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // 保存观察器引用
  window._titleFormatterObserver = observer;
  
  console.log('[标题格式化] DOM变化观察器已设置');
}

// 格式化已存在的标题
function formatExistingTitles() {
  console.log('[标题格式化] 格式化现有标题...');
  
  // 处理列表中的所有标题
  const titleElements = document.querySelectorAll('.note-title-text');
  titleElements.forEach(formatTitleElement);
  
  // 处理当前打开的笔记标题
  formatNoteDisplayTitle();
  
  console.log(`[标题格式化] 已处理 ${titleElements.length} 个标题元素`);
}

// 格式化单个标题元素
function formatTitleElement(titleElement) {
  if (!titleElement || titleElement.dataset.formatted === 'true') {
    return; // 已格式化过或无效元素
  }
  
  const fullTitle = titleElement.textContent;
  
  // 检查标题是否包含文体类型（通过两个空格分隔）
  if (fullTitle && fullTitle.includes('  ')) {
    // 分割标题和文体类型
    const parts = fullTitle.split('  ');
    if (parts.length >= 2) {
      const mainTitle = parts[0];
      const genre = parts[1];
      
      // 创建标记文体类型的元素
      const genreBadgeHtml = `<span class="genre-badge">${genre}</span>`;
      
      // 更新标题元素
      titleElement.innerHTML = `${mainTitle}${genreBadgeHtml}`;
      
      // 标记为已格式化
      titleElement.dataset.formatted = 'true';
      
      // 获取笔记元数据，应用颜色
      if (titleElement.closest) {
        const noteItem = titleElement.closest('.note-item');
        if (noteItem && noteItem.dataset.id) {
          const noteId = noteItem.dataset.id;
          applyGenreColorFromMetadata(noteId, titleElement.querySelector('.genre-badge'));
        }
      }
    }
  } else {
    // 标记为已格式化（即使没有文体类型）
    titleElement.dataset.formatted = 'true';
  }
}

// 格式化当前打开笔记的标题
function formatNoteDisplayTitle() {
  console.log('[标题格式化] 处理当前笔记标题显示...');
  
  const titleDisplay = document.getElementById('note-title-display');
  if (!titleDisplay) {
    return;
  }
  
  const fullTitle = titleDisplay.textContent;
  
  // 检查标题是否包含文体类型（通过两个空格分隔）
  if (fullTitle && fullTitle.includes('  ')) {
    // 分割标题和文体类型
    const parts = fullTitle.split('  ');
    if (parts.length >= 2) {
      const mainTitle = parts[0];
      const genre = parts[1];
      
      // 创建标记文体类型的元素
      const genreBadgeHtml = `<span class="genre-badge">${genre}</span>`;
      
      // 更新标题元素
      titleDisplay.innerHTML = `${mainTitle}${genreBadgeHtml}`;
      
      // 应用文体类型颜色
      if (window.currentNoteId) {
        applyGenreColorFromMetadata(window.currentNoteId, titleDisplay.querySelector('.genre-badge'));
      }
    }
  }
}

// 从元数据应用文体类型颜色
async function applyGenreColorFromMetadata(noteId, genreBadge) {
  if (!noteId || !genreBadge || typeof ipcRenderer === 'undefined') {
    return;
  }
  
  try {
    // 获取笔记元数据
    const note = await ipcRenderer.invoke('get-note', noteId);
    if (note && note.metadata && note.metadata.genreColor) {
      // 设置CSS变量保存文体类型颜色
      genreBadge.style.setProperty('--genre-color', note.metadata.genreColor);
      // 应用保存的文体类型颜色
      genreBadge.style.color = note.metadata.genreColor;
    }
  } catch (error) {
    console.error('[标题格式化] 获取笔记元数据失败:', error);
  }
}

// 添加格式化标题的样式
function addTitleFormattingStyles() {
  console.log('[标题格式化] 添加标题格式化样式...');
  
  // 如果已经添加过样式，则不再重复添加
  if (document.getElementById('title-formatter-styles')) {
    return;
  }
  
  // 创建样式元素
  const styleElement = document.createElement('style');
  styleElement.id = 'title-formatter-styles';
  styleElement.textContent = `
    /* 确保文体类型标签显示正确 */
    .genre-badge {
      display: inline-block !important;
      margin-left: 8px !important;
      font-size: 0.8em !important;
      font-style: italic !important;
      font-family: 'Kaiti', 'STKaiti', 'FangSong', 'STFangSong', cursive !important;
      font-weight: normal !important;
      opacity: 0.9 !important;
      transition: color 0.2s ease, transform 0.2s ease !important;
      letter-spacing: 1px !important;
      text-shadow: 0px 0px 1px rgba(0,0,0,0.1) !important;
      transform: scale(0.9) !important;
      vertical-align: baseline !important;
      position: relative !important;
      top: -1px !important;
      border-left: 1px solid rgba(0,0,0,0.1) !important;
      padding-left: 8px !important;
    }
    
    /* 确保在暗色主题下也能看清 */
    body.dark-theme .genre-badge {
      text-shadow: 0px 0px 1px rgba(255,255,255,0.2) !important;
      border-left: 1px solid rgba(255,255,255,0.1) !important;
    }
  `;
  
  // 添加样式到文档
  document.head.appendChild(styleElement);
  
  console.log('[标题格式化] 标题格式化样式已添加');
}

console.log('[标题格式化] 脚本加载完成'); 