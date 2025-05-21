// 文体类型颜色强制修复脚本
// 使用最强硬的方法确保文体类型颜色完全独立于标题颜色
const { ipcRenderer } = require('electron');
console.log('[强制颜色修复] 脚本开始加载...');

// 初始化所有色彩映射
const genreColorMap = new Map();
let isInitialized = false;
let forceObserver = null;
let enforceInterval = null;

// 在所有脚本加载完成后再执行初始化
window.addEventListener('load', () => {
  // 使用延迟确保在其他脚本初始化完成后执行
  setTimeout(initForceGenreColor, 2000);
});

// 初始化函数
async function initForceGenreColor() {
  if (isInitialized) return;
  console.log('[强制颜色修复] 开始初始化...');
  
  // 预加载所有笔记的颜色信息
  await loadAllGenreColors();
  
  // 添加绝对最高优先级的CSS样式
  injectForcedStyles();
  
  // 覆盖所有可能的颜色设置函数
  overrideColorFunctions();
  
  // 设置强制性的DOM观察器
  setupForceObserver();
  
  // 设置定期强制执行的间隔
  setupEnforceInterval();
  
  // 处理已有元素
  await forceFixAllElements();
  
  // 标记为已初始化
  isInitialized = true;
  console.log('[强制颜色修复] 初始化完成');
}

// 加载所有笔记的文体类型颜色
async function loadAllGenreColors() {
  try {
    // 获取所有笔记
    const notes = await ipcRenderer.invoke('get-notes');
    if (!notes || !Array.isArray(notes)) return;
    
    // 递归处理所有笔记和子笔记
    function processNote(note) {
      if (note.id && note.metadata && note.metadata.genreColor) {
        genreColorMap.set(note.id, note.metadata.genreColor);
      }
      
      // 处理子笔记
      if (note.children && Array.isArray(note.children)) {
        note.children.forEach(processNote);
      }
    }
    
    // 处理所有顶级笔记
    notes.forEach(processNote);
    
    console.log(`[强制颜色修复] 已加载 ${genreColorMap.size} 个笔记的颜色信息`);
  } catch (error) {
    console.error('[强制颜色修复] 加载笔记颜色信息失败:', error);
  }
}

// 注入强制性的CSS样式
function injectForcedStyles() {
  // 移除可能存在的旧样式
  const existingStyle = document.getElementById('force-genre-color-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // 创建新样式元素
  const style = document.createElement('style');
  style.id = 'force-genre-color-styles';
  style.setAttribute('data-priority', 'highest');
  
  // 设置强制性的CSS规则
  style.textContent = `
    /* 定义强制彻底隔离的文体类型样式 */
    .genre-badge-wrapper {
      /* 创建新的层叠上下文和颜色上下文 */
      isolation: isolate !important;
      color: initial !important;
      display: inline-block !important;
      margin-left: 8px !important;
      padding: 0 !important;
      line-height: inherit !important;
      font: inherit !important;
      vertical-align: baseline !important;
      position: relative !important;
      text-align: left !important;
    }
    
    /* 最强硬的方式确保文体标签颜色不受影响 */
    .genre-badge-force {
      display: inline-block !important;
      font-size: 0.8em !important;
      font-style: italic !important;
      font-family: 'Kaiti', 'STKaiti', 'FangSong', 'STFangSong', cursive !important;
      font-weight: normal !important;
      letter-spacing: 1px !important;
      opacity: 0.9 !important;
      transform: scale(0.9) !important;
      padding-left: 8px !important;
      border-left: 1px solid rgba(0,0,0,0.1) !important;
      margin: 0 !important;
      top: -1px !important;
      position: relative !important;
      /* 使用CSS变量和多重保证 */
      color: var(--force-genre-color, currentColor) !important;
    }
    
    /* 确保原始文体标签隐藏，以免干扰 */
    .genre-badge {
      display: none !important;
    }
    
    /* 适配暗色主题 */
    body.dark-theme .genre-badge-force {
      border-left-color: rgba(255,255,255,0.1) !important;
    }
  `;
  
  // 将样式添加到文档头部
  document.head.appendChild(style);
  console.log('[强制颜色修复] 注入了强制样式');
}

// 覆盖所有可能设置颜色的函数
function overrideColorFunctions() {
  // 覆盖applyTitleColor函数
  if (typeof window.originalForcedApplyTitleColor === 'undefined' && 
      typeof window.applyTitleColor === 'function') {
    window.originalForcedApplyTitleColor = window.applyTitleColor;
    
    window.applyTitleColor = async function() {
      // 调用原始函数
      const result = await window.originalForcedApplyTitleColor.apply(this, arguments);
      
      // 在颜色应用后强制修复
      setTimeout(forceFixAllElements, 10);
      
      return result;
    };
    
    console.log('[强制颜色修复] 已覆盖applyTitleColor函数');
  }
  
  // 覆盖其他可能的相关函数
  const functionsToOverride = [
    'previewTitleColor',
    'applyGenreColor',
    'previewGenreColor',
    'updateGenreColorInUI'
  ];
  
  functionsToOverride.forEach(funcName => {
    const originalName = 'originalForced' + funcName;
    
    if (typeof window[originalName] === 'undefined' && 
        typeof window[funcName] === 'function') {
      window[originalName] = window[funcName];
      
      window[funcName] = function() {
        // 调用原始函数
        const result = window[originalName].apply(this, arguments);
        
        // 在颜色应用后强制修复
        setTimeout(forceFixAllElements, 10);
        
        return result;
      };
      
      console.log(`[强制颜色修复] 已覆盖${funcName}函数`);
    }
  });
  
  // 覆盖updateListColors函数，确保在列表更新时强制应用颜色
  window.updateListColors = function() {
    console.log('[强制颜色修复] 调用了updateListColors函数');
    setTimeout(forceFixAllElements, 5);
    return true;
  };
}

// 设置强制DOM观察器
function setupForceObserver() {
  // 如果已经有观察器，先停止它
  if (forceObserver) {
    forceObserver.disconnect();
  }
  
  // 创建新的强制观察器
  forceObserver = new MutationObserver(mutations => {
    let needsFixing = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // 检查新添加的节点
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // 元素节点
            if (node.classList?.contains('note-item') || 
                node.classList?.contains('genre-badge') ||
                node.id === 'note-title-display' ||
                node.querySelector?.('.genre-badge')) {
              needsFixing = true;
            }
          }
        });
      } else if (mutation.type === 'attributes') {
        // 如果是样式或颜色变化，也需要修复
        if (mutation.attributeName === 'style' || 
            mutation.attributeName === 'color' ||
            mutation.attributeName === 'class') {
          needsFixing = true;
        }
      }
    });
    
    if (needsFixing) {
      setTimeout(forceFixAllElements, 5);
    }
  });
  
  // 观察整个文档的变化
  forceObserver.observe(document.body, {
    childList: true,
    attributes: true,
    subtree: true,
    attributeFilter: ['style', 'class', 'color']
  });
  
  console.log('[强制颜色修复] 已设置强制DOM观察器');
}

// 设置定期强制执行间隔
function setupEnforceInterval() {
  // 清除可能已有的间隔
  if (enforceInterval) {
    clearInterval(enforceInterval);
  }
  
  // 设置新的强制执行间隔
  enforceInterval = setInterval(forceFixAllElements, 2000);
  console.log('[强制颜色修复] 已设置定期强制执行间隔');
}

// 强制修复所有元素
async function forceFixAllElements() {
  try {
    // 处理所有笔记列表项
    const noteItems = document.querySelectorAll('.note-item');
    for (const noteItem of noteItems) {
      const noteId = noteItem?.dataset?.id;
      if (noteId) {
        // 获取或更新颜色信息
        await ensureGenreColor(noteId);
        
        // 修复列表项中的文体类型标签
        fixGenreBadgeInListItem(noteItem, noteId);
      }
    }
    
    // 处理当前打开的笔记标题
    const titleDisplay = document.getElementById('note-title-display');
    if (titleDisplay && window.currentNoteId) {
      // 获取或更新颜色信息
      await ensureGenreColor(window.currentNoteId);
      
      // 修复当前笔记标题中的文体类型标签
      fixGenreBadgeInTitle(titleDisplay, window.currentNoteId);
    }
  } catch (error) {
    console.error('[强制颜色修复] 修复元素出错:', error);
  }
}

// 确保有指定笔记的颜色信息
async function ensureGenreColor(noteId) {
  // 如果颜色映射已有此笔记的颜色，直接使用
  if (genreColorMap.has(noteId)) {
    return genreColorMap.get(noteId);
  }
  
  try {
    // 没有缓存的颜色，从后端获取
    const note = await ipcRenderer.invoke('get-note', noteId);
    if (note && note.metadata && note.metadata.genreColor) {
      genreColorMap.set(noteId, note.metadata.genreColor);
      return note.metadata.genreColor;
    }
  } catch (error) {
    console.error('[强制颜色修复] 获取笔记颜色出错:', error);
  }
  
  return null;
}

// 修复列表项中的文体类型标签
function fixGenreBadgeInListItem(noteItem, noteId) {
  // 获取标题元素和原始文体类型标签
  const titleText = noteItem.querySelector('.note-title-text');
  if (!titleText) return;
  
  const originalBadge = titleText.querySelector('.genre-badge');
  if (!originalBadge) return; // 没有文体类型标签
  
  // 获取标签文本和颜色
  const genreText = originalBadge.textContent;
  const genreColor = genreColorMap.get(noteId);
  
  // 检查是否已经有强制版本的标签
  let forceWrapper = titleText.querySelector('.genre-badge-wrapper');
  let forceBadge = forceWrapper?.querySelector('.genre-badge-force');
  
  if (!forceWrapper) {
    // 创建新的包装器和强制标签
    forceWrapper = document.createElement('span');
    forceWrapper.className = 'genre-badge-wrapper';
    forceBadge = document.createElement('span');
    forceBadge.className = 'genre-badge-force';
    forceWrapper.appendChild(forceBadge);
    
    // 添加到标题文本末尾
    titleText.appendChild(forceWrapper);
  }
  
  // 更新文本内容
  forceBadge.textContent = genreText;
  
  // 应用颜色
  if (genreColor) {
    forceBadge.style.setProperty('--force-genre-color', genreColor);
    forceBadge.style.color = genreColor;
  }
}

// 修复当前笔记标题中的文体类型标签
function fixGenreBadgeInTitle(titleDisplay, noteId) {
  // 获取原始文体类型标签
  const originalBadge = titleDisplay.querySelector('.genre-badge');
  if (!originalBadge) return; // 没有文体类型标签
  
  // 获取标签文本和颜色
  const genreText = originalBadge.textContent;
  const genreColor = genreColorMap.get(noteId);
  
  // 检查是否已经有强制版本的标签
  let forceWrapper = titleDisplay.querySelector('.genre-badge-wrapper');
  let forceBadge = forceWrapper?.querySelector('.genre-badge-force');
  
  if (!forceWrapper) {
    // 创建新的包装器和强制标签
    forceWrapper = document.createElement('span');
    forceWrapper.className = 'genre-badge-wrapper';
    forceBadge = document.createElement('span');
    forceBadge.className = 'genre-badge-force';
    forceWrapper.appendChild(forceBadge);
    
    // 添加到标题文本末尾
    titleDisplay.appendChild(forceWrapper);
  }
  
  // 更新文本内容
  forceBadge.textContent = genreText;
  
  // 应用颜色
  if (genreColor) {
    forceBadge.style.setProperty('--force-genre-color', genreColor);
    forceBadge.style.color = genreColor;
  }
}

// 导出全局可用的更新函数
window.forceUpdateGenreColors = forceFixAllElements;

console.log('[强制颜色修复] 脚本加载完成'); 